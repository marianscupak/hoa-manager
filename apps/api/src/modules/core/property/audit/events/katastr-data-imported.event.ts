import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import type { AuditActor } from '@/modules/core/audit/domain/actor';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { CoreEventType } from '@/modules/core/audit-projections/core-event-types';

/**
 * The only warning codes the differ/parser can ever produce (see
 * build-import-plan.ts and parse-katastr-document.ts). Constraining this to
 * an enum, combined with `.strict()` below, turns the payload into a
 * contract: an unrecognised code or an unplanned extra field fails
 * validation loudly at append time instead of being written into the audit
 * trail unnoticed.
 */
const WarningCode = z.enum([
  'IMPLIED_FULL_SHARE',
  'NAME_MATCH',
  'KIND_MISMATCH',
]);

const PayloadSchema = z
  .object({
    counts: z.object({
      unitsCreated: z.number().int(),
      unitsUpdated: z.number().int(),
      unitsUnchanged: z.number().int(),
      ownersCreated: z.number().int(),
      ownersMatched: z.number().int(),
    }),
    /** Unit numbers the import created or changed, in document order. */
    unitNumbers: z.array(z.string()),
    effectiveFrom: z.string(),
    document: z
      .object({
        lvNumber: z.string(),
        municipality: z.string(),
        cadastralArea: z.string(),
        validAt: z.string(),
        issuedAt: z.string(),
        /** SHA-256 of the uploaded file: proof of which file, without keeping it. */
        fileHash: z.string(),
      })
      .strict(),
    warningCodes: z.array(WarningCode),
    labels: z.object({ importedBy: z.string() }),
  })
  .strict();

export const KatastrDataImportedAuditEvent = defineAuditEvent({
  eventType: CoreEventType.KATASTR_DATA_IMPORTED,
  module: 'CORE',
  payloadSchema: PayloadSchema,
  visibility: Visibility.TENANT_PRIVILEGED,
  tenantRequired: true,
  aggregateType: 'TENANT',
  entityType: null,
  build(input: {
    tenantId: string;
    actor: AuditActor;
    occurredAt: Date;
    effectiveFrom: string;
    counts: z.infer<typeof PayloadSchema>['counts'];
    unitNumbers: string[];
    document: z.infer<typeof PayloadSchema>['document'];
    warningCodes: z.infer<typeof PayloadSchema>['warningCodes'];
    actorLabel: string;
  }) {
    return {
      occurredAt: input.occurredAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.tenantId,
      entityId: null,
      payload: {
        counts: input.counts,
        unitNumbers: input.unitNumbers,
        effectiveFrom: input.effectiveFrom,
        document: input.document,
        warningCodes: input.warningCodes,
        labels: { importedBy: input.actorLabel },
      },
    };
  },
});
