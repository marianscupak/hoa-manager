import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { CoreAuditLabelResolver } from '@/modules/core/audit-projections/core-audit-label-resolver.service';
import {
  KatastrImportResultResponseDto,
  planCounts,
  toPreviewResponse,
} from '@/modules/core/property/api/dto/katastr-import.dto';
import { ImportKatastrDataCommand } from '@/modules/core/property/application/commands/import-katastr-data.command';
import {
  KATASTR_SNAPSHOT_REPOSITORY,
  type KatastrSnapshotRepository,
} from '@/modules/core/property/application/ports/katastr-snapshot.repository.port';
import {
  OWNER_REPOSITORY,
  UNIT_OWNERSHIP_REPOSITORY,
  UNIT_REPOSITORY,
  type OwnerRepository,
  type UnitOwnershipRepository,
  type UnitRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import { KatastrDataImportedAuditEvent } from '@/modules/core/property/audit/events/katastr-data-imported.event';
import {
  buildImportPlan,
  earliestAllowedEffectiveAt,
} from '@/modules/core/property/domain/katastr/build-import-plan';
import type {
  ImportBlocker,
  ImportPlan,
} from '@/modules/core/property/domain/katastr/import-plan';
import { parseKatastrDocument } from '@/modules/core/property/domain/katastr/parse-katastr-document';
import {
  computeFileHash,
  computePlanHash,
} from '@/modules/core/property/domain/katastr/plan-hash';
import {
  validateOwnershipPlan,
  type OwnerRef,
  type OwnershipPartyInput,
  type OwnershipPlanError,
} from '@/modules/core/property/domain/ownership-plan';
import {
  planOwnershipTransition,
  type OwnershipTransitionPlan,
} from '@/modules/core/property/domain/ownership-transition';
import type { UnitOwnershipParty } from '@/modules/core/property/domain/property.entity';
import {
  KatastrFileRejectedException,
  KatastrImportBlockedException,
  KatastrImportPlanStaleException,
} from '@/shared/application/exceptions/property.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';
import { formatAssociationDate } from '@/shared/domain/association-date';

/**
 * `validateOwnershipPlan`'s own codes, mapped into the shape the katastr
 * catalogue renders (M4). Reusing those codes as `ImportBlocker`s directly
 * would have `MIXED_ASSOCIATION` collide by name with this file's own
 * katastr-level blocker of the same name, while carrying neither `unitNo`
 * nor `ownerName` — the chair's sentence would render with empty holes.
 * Only the fixed `code` crosses over, never `index`/`ownerId`/`actual`: this
 * whole path is a "should not happen" backstop (see OWNERSHIP_PLAN_REJECTED's
 * own comment in import-plan.ts), so there is no reason to carry more.
 */
export function ownershipPlanErrorsToBlockers(
  unitNo: string,
  errors: OwnershipPlanError[],
): ImportBlocker[] {
  return errors.map((error) => ({
    code: 'OWNERSHIP_PLAN_REJECTED',
    unitNo,
    reason: error.code,
  }));
}

/**
 * Maps the write-time re-check of `planOwnershipTransition` (defense in
 * depth: the diff's own `checkTransition` already runs this once when the
 * plan is built) into a properly shaped blocker (M5) — the earlier code
 * pushed `{ code: transition.code, unitNo }` raw, which silently dropped
 * EFFECTIVE_DATE_TOO_EARLY's required `earliestAllowed` and left the
 * catalogue message with an empty `{{earliestAllowed}}` hole.
 */
export function transitionRejectionToBlocker(
  unitNo: string,
  transition: Extract<OwnershipTransitionPlan, { kind: 'REJECT' }>,
  existingParties: UnitOwnershipParty[],
): ImportBlocker {
  if (transition.code === 'TRANSFER_ALREADY_SCHEDULED') {
    return { code: 'TRANSFER_ALREADY_SCHEDULED', unitNo };
  }
  return {
    code: 'EFFECTIVE_DATE_TOO_EARLY',
    unitNo,
    // Same derivation build-import-plan.ts's own checkTransition uses for
    // this same blocker code — a calendar day, not the Prague-midnight
    // instant validFrom/validTo are stored as.
    earliestAllowed: formatAssociationDate(
      earliestAllowedEffectiveAt(existingParties),
    ),
  };
}

@CommandHandler(ImportKatastrDataCommand)
export class ImportKatastrDataHandler
  implements
    ICommandHandler<ImportKatastrDataCommand, KatastrImportResultResponseDto>
{
  constructor(
    @Inject(KATASTR_SNAPSHOT_REPOSITORY)
    private readonly snapshots: KatastrSnapshotRepository,
    @Inject(UNIT_REPOSITORY)
    private readonly unitRepo: UnitRepository,
    @Inject(OWNER_REPOSITORY)
    private readonly ownerRepo: OwnerRepository,
    @Inject(UNIT_OWNERSHIP_REPOSITORY)
    private readonly ownershipRepo: UnitOwnershipRepository,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: UnitOfWork,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: CoreAuditLabelResolver,
  ) {}

  async execute(
    command: ImportKatastrDataCommand,
  ): Promise<KatastrImportResultResponseDto> {
    const { tenantId, xml, effectiveAt, expectedPlanHash } = command;

    // Cheap and stateless, so it happens before any transaction is opened.
    const parsed = parseKatastrDocument(xml);
    if (!parsed.ok) throw new KatastrFileRejectedException(parsed.errors);

    return this.unitOfWork.execute(async () => {
      // One gate per house, held for the rest of the transaction, so the plan
      // below is built on data that cannot move under it.
      await this.snapshots.lockTenant(tenantId);

      const now = this.clock.now();
      const snapshot = await this.snapshots.load(tenantId);
      const plan = buildImportPlan(parsed.document, snapshot, effectiveAt, now);
      plan.warnings.unshift(...parsed.warnings);

      if (plan.blockers.length > 0) {
        throw new KatastrImportBlockedException(plan.blockers);
      }

      const actualHash = computePlanHash(xml, plan);
      if (actualHash !== expectedPlanHash) {
        // A different file, a different date, or the register was edited since
        // the preview. Hand back a fresh one instead of guessing.
        throw new KatastrImportPlanStaleException(
          toPreviewResponse(plan, actualHash),
        );
      }

      const ownerIdByPerson = await this.writeOwners(tenantId, plan);
      const ownerRefs = await this.collectOwnerRefs(tenantId);
      const changedUnitNumbers = await this.writeUnits(
        tenantId,
        plan,
        ownerIdByPerson,
        ownerRefs,
        now,
      );

      const actor = this.auditContext.requireActor();
      await this.auditService.append(
        KatastrDataImportedAuditEvent.build({
          tenantId,
          actor,
          occurredAt: now,
          effectiveFrom: formatAssociationDate(plan.effectiveAt),
          counts: planCounts(plan),
          unitNumbers: changedUnitNumbers,
          document: {
            lvNumber: plan.document.lvNumber,
            municipality: plan.document.municipality,
            cadastralArea: plan.document.cadastralArea,
            validAt: plan.document.validAt.toISOString(),
            issuedAt: plan.document.issuedAt.toISOString(),
            fileHash: computeFileHash(xml),
          },
          warningCodes: plan.warnings.map((w) => w.code),
          actorLabel: await this.labelResolver.resolveActorLabel(actor),
        }),
      );

      return {
        counts: planCounts(plan),
        // A calendar day, matching toPreviewResponse (C1) — the preview and
        // the confirmed result must agree on what this field is.
        effectiveAt: formatAssociationDate(plan.effectiveAt),
      };
    });
  }

  /** Creates missing owners and backfills identifiers on matched ones. */
  private async writeOwners(
    tenantId: string,
    plan: ImportPlan,
  ): Promise<Map<string, string>> {
    const ids = new Map<string, string>();

    for (const planned of plan.owners) {
      if (planned.action === 'CREATE') {
        const owner = await this.ownerRepo.create(tenantId, {
          displayName: planned.displayName,
          userId: null,
          // The cadastre carries no e-mail; the admin adds it afterwards.
          email: null,
          kind: planned.kind,
          katastrPersonId: planned.katastrPersonId,
          ico: planned.ico,
        });
        ids.set(planned.katastrPersonId, owner.id);
        continue;
      }

      if (planned.existingOwnerId === null) continue;
      ids.set(planned.katastrPersonId, planned.existingOwnerId);
      // display_name and kind are deliberately left alone; only identifiers
      // are written onto a row the admin created.
      if (planned.backfillKatastrId || planned.backfillIco) {
        await this.ownerRepo.setKatastrPersonId(
          tenantId,
          planned.existingOwnerId,
          planned.katastrPersonId,
          planned.backfillIco ? planned.ico : null,
        );
      }
    }

    return ids;
  }

  /** Owner kinds for `validateOwnershipPlan`, including the rows just created. */
  private async collectOwnerRefs(
    tenantId: string,
  ): Promise<Map<string, OwnerRef>> {
    const owners = await this.ownerRepo.listByTenant(tenantId);
    return new Map(owners.map((o) => [o.id, { id: o.id, kind: o.kind }]));
  }

  private async writeUnits(
    tenantId: string,
    plan: ImportPlan,
    ownerIdByPerson: Map<string, string>,
    ownerRefs: Map<string, OwnerRef>,
    now: Date,
  ): Promise<string[]> {
    const changed: string[] = [];

    for (const planned of plan.units) {
      // Number() is safe: the parser rejected anything above int32.
      const unitValues = {
        unitNo: planned.unitNo,
        buildingShareNumerator: Number(planned.buildingShare.num),
        buildingShareDenominator: Number(planned.buildingShare.den),
        katastrUnitId: planned.katastrUnitId,
        usageCode: planned.usageCodeToWrite,
        usageName: planned.usageNameToWrite,
      };

      let unitId = planned.existingUnitId;

      if (planned.action === 'CREATE') {
        const created = await this.unitRepo.create(tenantId, unitValues);
        unitId = created.id;
        changed.push(planned.unitNo);
      } else if (planned.action === 'UPDATE' && unitId !== null) {
        await this.unitRepo.update(tenantId, unitId, unitValues);
        changed.push(planned.unitNo);
      }

      if (planned.ownershipChange === null || unitId === null) continue;

      const parties: OwnershipPartyInput[] = planned.parties.map((p) => ({
        partyType: p.partyType,
        shareNumerator: Number(p.share.num),
        shareDenominator: Number(p.share.den),
        memberOwnerIds: p.memberKatastrPersonIds.map((key) => {
          const id = ownerIdByPerson.get(key);
          if (id === undefined) {
            throw new Error(`no owner row for katastr person ${key}`);
          }
          return id;
        }),
      }));

      // The only authority on what valid ownership is. Run again here with real
      // UUIDs, deliberately duplicating the diff's structural checks.
      const errors = validateOwnershipPlan(parties, ownerRefs);
      if (errors.length > 0) {
        throw new KatastrImportBlockedException(
          ownershipPlanErrorsToBlockers(planned.unitNo, errors),
        );
      }

      const existing = await this.ownershipRepo.listByUnit(tenantId, unitId);
      if (existing.length > 0) {
        const transition = planOwnershipTransition(
          existing,
          plan.effectiveAt,
          now,
        );
        if (transition.kind === 'REJECT') {
          throw new KatastrImportBlockedException([
            transitionRejectionToBlocker(planned.unitNo, transition, existing),
          ]);
        }
        if (transition.deletePartyIds.length > 0) {
          await this.ownershipRepo.deleteParties(
            tenantId,
            transition.deletePartyIds,
          );
        }
        if (transition.closePartyIds.length > 0) {
          await this.ownershipRepo.closeParties(
            tenantId,
            transition.closePartyIds,
            plan.effectiveAt,
          );
        }
      }

      await this.ownershipRepo.createMany(
        tenantId,
        unitId,
        parties,
        plan.effectiveAt,
      );
    }

    return changed;
  }
}
