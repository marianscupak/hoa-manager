import type {
  ImportBlocker,
  ImportPlan,
  ImportWarning,
  PartySummary,
  PlannedOwner,
  PlannedParty,
  PlannedUnit,
  RegisterOwner,
  RegisterSnapshot,
  RegisterUnit,
} from '@/modules/core/property/domain/katastr/import-plan';
import type {
  Fraction,
  KatastrDocument,
  KatastrParty,
  KatastrUnit,
} from '@/modules/core/property/domain/katastr/katastr-document';
import { periodStatus } from '@/modules/core/property/domain/ownership-periods';
import {
  OwnerKind,
  OwnershipPartyType,
} from '@/modules/core/property/domain/ownership-plan';
import { planOwnershipTransition } from '@/modules/core/property/domain/ownership-transition';
import type { UnitOwnershipParty } from '@/modules/core/property/domain/property.entity';
import { formatAssociationDate } from '@/shared/domain/association-date';
import { Rational } from '@/shared/domain/rational';
import { slugify } from '@/shared/domain/slugify';

const showShare = (f: Fraction) => `${f.num}/${f.den}`;
const rational = (f: Fraction) => Rational.from(f.num, f.den);

const kindOf = (party: KatastrParty): OwnerKind =>
  party.type === 'OPO' ? OwnerKind.LEGAL_ENTITY : OwnerKind.PERSON;

const partyTypeOf = (party: KatastrParty): OwnershipPartyType =>
  party.type === 'BSM' ? OwnershipPartyType.SJM : OwnershipPartyType.SOLE;

/** Stable fingerprint of one party: type, reduced share, sorted members. */
const partyKey = (
  partyType: OwnershipPartyType,
  share: Rational,
  memberIds: string[],
): string => {
  const { num, den } = share.toJSON();
  return `${partyType}|${num}/${den}|${[...memberIds].sort().join(',')}`;
};

// buildImportPlan is a pure function: its output must be determined by its
// input values, not by the row order the snapshot happened to arrive in.
// These comparators keep that property intrinsic to the differ rather than
// relying on every caller (a real repository, a test fake, a future snapshot
// source) to hand rows back in a stable order. Plain code-unit comparison
// (not `localeCompare`, whose collation is locale/implementation-dependent)
// to match the ordering `partyKey`'s own `[...memberIds].sort()` already
// relies on, and to keep the hash's determinism independent of ICU data.
const compareStrings = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;

const byUnitNo = (a: { unitNo: string }, b: { unitNo: string }): number =>
  compareStrings(a.unitNo, b.unitNo);

const byDisplayNameThenId = (
  a: { displayName: string; ownerId: string },
  b: { displayName: string; ownerId: string },
): number =>
  compareStrings(a.displayName, b.displayName) ||
  compareStrings(a.ownerId, b.ownerId);

const byPartyId = (a: { id: string }, b: { id: string }): number =>
  compareStrings(a.id, b.id);

export function buildImportPlan(
  document: KatastrDocument,
  snapshot: RegisterSnapshot,
  effectiveAt: Date,
  now: Date,
): ImportPlan {
  const warnings: ImportWarning[] = [];
  const blockers: ImportBlocker[] = [];

  const owners = planOwners(document, snapshot, warnings, blockers);
  const ownerIdByPerson = new Map<string, string | null>(
    owners.map((o) => [o.katastrPersonId, o.existingOwnerId]),
  );
  const ownerByPerson = new Map(owners.map((o) => [o.katastrPersonId, o]));
  // Names for current members the file no longer mentions, e.g. a co-owner
  // who sold their share; without them the preview would show a raw id.
  const registerOwnerNames = new Map(
    snapshot.owners.map((o) => [o.id, o.displayName]),
  );

  const unitsById = new Map(
    snapshot.units
      .filter((u) => u.katastrUnitId !== null)
      .map((u) => [u.katastrUnitId as string, u]),
  );
  const unitsByNo = new Map(snapshot.units.map((u) => [u.unitNo, u]));

  const units: PlannedUnit[] = [];
  const touchedUnitIds = new Set<string>();

  for (const unit of document.units) {
    const existing =
      unitsById.get(unit.katastrId) ?? unitsByNo.get(unit.unitNo) ?? null;
    if (existing !== null) touchedUnitIds.add(existing.id);
    const planned = planUnit(
      unit,
      existing,
      ownerIdByPerson,
      ownerByPerson,
      registerOwnerNames,
      now,
    );
    if (existing !== null) {
      checkTransition(planned, existing, effectiveAt, now, blockers);
    }
    checkMixedAssociation(planned, ownerByPerson, blockers);
    units.push(planned);
  }

  checkUnitNoCollisions(units, snapshot, blockers);

  const referencedPersonIds = new Set(
    document.units.flatMap((u) =>
      u.parties.flatMap((p) => p.members.map((m) => m.katastrPersonId)),
    ),
  );
  const matchedOwnerIds = new Set(
    owners
      .map((o) => o.existingOwnerId)
      .filter((id): id is string => id !== null),
  );

  return {
    effectiveAt,
    document: {
      validAt: document.validAt,
      issuedAt: document.issuedAt,
      lvNumber: document.lvNumber,
      municipality: document.municipality,
      cadastralArea: document.cadastralArea,
    },
    units,
    owners: owners.filter((o) => referencedPersonIds.has(o.katastrPersonId)),
    unitsNotInFile: snapshot.units
      .filter((u) => !touchedUnitIds.has(u.id))
      .map((u) => ({ unitId: u.id, unitNo: u.unitNo }))
      .sort(byUnitNo),
    ownersNotInFile: snapshot.owners
      .filter((o) => !matchedOwnerIds.has(o.id))
      .map((o) => ({ ownerId: o.id, displayName: o.displayName }))
      .sort(byDisplayNameThenId),
    warnings,
    blockers,
  };
}

function planOwners(
  document: KatastrDocument,
  snapshot: RegisterSnapshot,
  warnings: ImportWarning[],
  blockers: ImportBlocker[],
): PlannedOwner[] {
  const people = new Map<
    string,
    { displayName: string; ico: string | null; kind: OwnerKind }
  >();
  for (const unit of document.units) {
    for (const party of unit.parties) {
      for (const member of party.members) {
        if (!people.has(member.katastrPersonId)) {
          people.set(member.katastrPersonId, {
            displayName: member.displayName,
            ico: member.ico,
            kind: kindOf(party),
          });
        }
      }
    }
  }

  const byKatastrId = new Map(
    snapshot.owners
      .filter((o) => o.katastrPersonId !== null)
      .map((o) => [o.katastrPersonId as string, o]),
  );
  // Grouped, not a last-one-wins Map: owners.ico has no unique constraint, so
  // two register rows can share one IČO. Picking whichever the snapshot
  // handed back last would depend on unspecified database row order — the
  // same class of non-determinism Task 7 fixed for the two ownership
  // queries. See the ambiguity check below, which blocks instead.
  const byIco = new Map<string, RegisterOwner[]>();
  for (const owner of snapshot.owners) {
    if (owner.ico === null) continue;
    byIco.set(owner.ico, [...(byIco.get(owner.ico) ?? []), owner]);
  }
  const nameable = snapshot.owners.filter((o) => o.katastrPersonId === null);
  const byName = new Map<string, RegisterOwner[]>();
  for (const owner of nameable) {
    const key = slugify(owner.displayName);
    byName.set(key, [...(byName.get(key) ?? []), owner]);
  }

  // `via` records which path decided the match, so the tail loop below can
  // report the ambiguity under the code that actually names it (AMBIGUOUS_ICO
  // vs AMBIGUOUS_NAME) rather than re-deriving — a second source of truth for
  // a fact already decided once, above.
  const claimedOwnerIds = new Map<
    string,
    { katastrPersonId: string; via: PlannedOwner['action'] }[]
  >();
  const planned: PlannedOwner[] = [];

  for (const [katastrPersonId, person] of people) {
    let existing: RegisterOwner | null = null;
    let action: PlannedOwner['action'] = 'CREATE';

    const byId = byKatastrId.get(katastrPersonId);
    if (byId !== undefined) {
      existing = byId;
      action = 'MATCHED_BY_KATASTR_ID';
    } else if (person.ico !== null && byIco.has(person.ico)) {
      const candidates = byIco.get(person.ico) as RegisterOwner[];
      if (candidates.length > 1) {
        // Ambiguous: block rather than silently pick one, the same rule
        // the name path (below) already applies via AMBIGUOUS_NAME — the
        // IČO path runs first and never had it until now.
        blockers.push({
          code: 'AMBIGUOUS_ICO',
          ico: person.ico,
          registerOwnerIds: candidates.map((c) => c.id).sort(),
          katastrPersonIds: [katastrPersonId],
        });
      } else {
        existing = candidates[0];
        action = 'MATCHED_BY_ICO';
      }
    } else {
      const candidates = byName.get(slugify(person.displayName)) ?? [];
      // Never pair on name when both sides have an IČO and they disagree:
      // two entities with the same name and different IČO are two entities.
      const usable = candidates.filter(
        (c) => !(c.ico !== null && person.ico !== null && c.ico !== person.ico),
      );
      if (usable.length > 1) {
        blockers.push({
          code: 'AMBIGUOUS_NAME',
          name: person.displayName,
          registerOwnerIds: usable.map((c) => c.id).sort(),
          katastrPersonIds: [katastrPersonId],
        });
      } else if (usable.length === 1) {
        existing = usable[0];
        action = 'MATCHED_BY_NAME';
      }
    }

    if (existing !== null) {
      claimedOwnerIds.set(existing.id, [
        ...(claimedOwnerIds.get(existing.id) ?? []),
        { katastrPersonId, via: action },
      ]);
      if (action === 'MATCHED_BY_NAME') {
        warnings.push({
          code: 'NAME_MATCH',
          katastrPersonId,
          fileName: person.displayName,
          registerName: existing.displayName,
        });
      }
      if (existing.kind !== person.kind) {
        warnings.push({
          code: 'KIND_MISMATCH',
          katastrPersonId,
          registerKind: existing.kind,
          fileKind: person.kind,
        });
      }
    }

    planned.push({
      katastrPersonId,
      displayName: person.displayName,
      ico: person.ico,
      kind: person.kind,
      action,
      existingOwnerId: existing?.id ?? null,
      existingDisplayName: existing?.displayName ?? null,
      existingEmail: existing?.email ?? null,
      existingHasAccount: existing?.hasAccount ?? false,
      kindInRegister: existing?.kind ?? null,
      backfillKatastrId:
        existing !== null && action !== 'MATCHED_BY_KATASTR_ID',
      backfillIco:
        existing !== null && existing.ico === null && person.ico !== null,
    });
  }

  // Two people in the file resolving to one register row is equally
  // ambiguous — detected on the *total* claim count for the owner, never on
  // one path's own count. Gating per path first (grouping, then checking
  // each group's length) missed a mixed-path double-claim entirely: one
  // person matched by IČO and another by name, each alone in a group of
  // size 1, would both fail a `> 1` check and vanish with no blocker at all.
  // That shape is not exotic — once one import backfills both
  // katastr_person_id and IČO onto a matched row, a plain cadastre-id match
  // and an IČO match landing on that same row is the routine second-import
  // case, not an edge case.
  for (const [ownerId, claims] of claimedOwnerIds) {
    if (claims.length <= 1) continue;
    const owner = snapshot.owners.find((o) => o.id === ownerId);
    const byVia = new Map<PlannedOwner['action'], string[]>();
    for (const { katastrPersonId, via } of claims) {
      byVia.set(via, [...(byVia.get(via) ?? []), katastrPersonId]);
    }
    // A cadastre-id match never gets a blocker *of its own* — there is no
    // code for "ambiguous by cadastre id", and none is needed:
    // katastr_person_id is unique per tenant, so that path alone can never
    // put more than one document person on the same row. But once some
    // other match brings genuine contention to this row, the id-matched
    // claimant is one of the real-world subjects contending for it too, and
    // a blocker naming only the other claimant sends the chair looking for
    // a duplicate under a code that will never show them one — the same
    // "true statement, wrong diagnosis" failure this task started with
    // (a missing subject id surfacing as "the shares add up to 0/1"). So
    // every blocker that does fire for this owner names every claimant that
    // landed on it, cadastre-id ones included — one list per real cause
    // (IČO vs. name), not one list for the owner as a whole, so a mixed
    // claim still reports each cause distinctly.
    const claimantsVia = (via: PlannedOwner['action']): string[] =>
      claims
        .filter((c) => c.via === via || c.via === 'MATCHED_BY_KATASTR_ID')
        .map((c) => c.katastrPersonId);
    if (byVia.has('MATCHED_BY_ICO')) {
      blockers.push({
        code: 'AMBIGUOUS_ICO',
        // The ICO path only ever matches a candidate whose own `ico` is
        // non-null (see byIco above), so this is never the '' fallback.
        ico: owner?.ico ?? '',
        registerOwnerIds: [ownerId],
        katastrPersonIds: claimantsVia('MATCHED_BY_ICO'),
      });
    }
    if (byVia.has('MATCHED_BY_NAME')) {
      blockers.push({
        code: 'AMBIGUOUS_NAME',
        name: owner?.displayName ?? '',
        registerOwnerIds: [ownerId],
        katastrPersonIds: claimantsVia('MATCHED_BY_NAME'),
      });
    }
  }

  return planned;
}

function planUnit(
  unit: KatastrUnit,
  existing: RegisterUnit | null,
  ownerIdByPerson: Map<string, string | null>,
  ownerByPerson: Map<string, PlannedOwner>,
  registerOwnerNames: Map<string, string>,
  now: Date,
): PlannedUnit {
  const parties: PlannedParty[] = unit.parties.map((party) => ({
    partyType: partyTypeOf(party),
    share: party.share,
    memberKatastrPersonIds: party.members.map((m) => m.katastrPersonId),
  }));

  const toSummary = (): PartySummary[] =>
    unit.parties.map((party) => ({
      partyType: partyTypeOf(party),
      share: showShare(party.share),
      memberNames: party.members.map((m) => m.displayName),
    }));

  if (existing === null) {
    return {
      katastrUnitId: unit.katastrId,
      unitNo: unit.unitNo,
      action: 'CREATE',
      existingUnitId: null,
      unitNoChange: null,
      shareChange: { from: '', to: showShare(unit.buildingShare) },
      usageChange: { from: null, to: unit.usageName },
      backfillKatastrId: false,
      ownershipChange: { from: [], to: toSummary() },
      parties,
      buildingShare: unit.buildingShare,
      usageCodeToWrite: unit.usageCode,
      usageNameToWrite: unit.usageName,
    };
  }

  const active = existing.parties.filter(
    (p) => periodStatus(p, now) === 'ACTIVE',
  );
  const currentKeys = active
    .map((p: UnitOwnershipParty) =>
      partyKey(
        p.partyType,
        Rational.from(p.shareNumerator, p.shareDenominator),
        p.memberOwnerIds,
      ),
    )
    .sort();
  const proposedKeys = parties
    .map((p) =>
      partyKey(
        p.partyType,
        rational(p.share),
        p.memberKatastrPersonIds.map(
          (k) => ownerIdByPerson.get(k) ?? `new:${k}`,
        ),
      ),
    )
    .sort();
  const ownershipChanged =
    currentKeys.length !== proposedKeys.length ||
    currentKeys.some((k, i) => k !== proposedKeys[i]);

  const nameById = new Map(
    [...ownerByPerson.values()].map((o) => [
      o.existingOwnerId ?? `new:${o.katastrPersonId}`,
      o.existingDisplayName ?? o.displayName,
    ]),
  );
  // `to` (toSummary, below) is deterministic in document order already — for
  // an SJM party that's the cadastre's own oS/oS2 sequence. `from` is read
  // back from the database: two parties can share a validFrom (every
  // replace-unit-ownership write gives its new parties an identical one), and
  // unit_ownership_members has no ordinal column at all, so there is no
  // member order to preserve — sorting by id supplies the determinism the
  // schema never provided, rather than losing information the schema had.
  const fromSummary: PartySummary[] = [...active].sort(byPartyId).map((p) => ({
    partyType: p.partyType,
    share: `${p.shareNumerator}/${p.shareDenominator}`,
    memberNames: p.memberOwnerIds
      .map((id) => nameById.get(id) ?? registerOwnerNames.get(id) ?? id)
      .sort(compareStrings),
  }));

  const shareChanged = !rational(unit.buildingShare).eq(
    rational(existing.buildingShare),
  );
  const usageChanged =
    (existing.usageCode ?? null) !== (unit.usageCode ?? null) ||
    (existing.usageName ?? null) !== (unit.usageName ?? null);
  const unitNoChanged =
    existing.katastrUnitId === unit.katastrId &&
    existing.unitNo !== unit.unitNo;
  const backfillKatastrId = existing.katastrUnitId === null;

  const changed =
    ownershipChanged ||
    shareChanged ||
    usageChanged ||
    unitNoChanged ||
    backfillKatastrId;

  return {
    katastrUnitId: unit.katastrId,
    unitNo: unit.unitNo,
    action: changed ? 'UPDATE' : 'UNCHANGED',
    existingUnitId: existing.id,
    unitNoChange: unitNoChanged
      ? { from: existing.unitNo, to: unit.unitNo }
      : null,
    shareChange: shareChanged
      ? {
          from: showShare(existing.buildingShare),
          to: showShare(unit.buildingShare),
        }
      : null,
    usageChange: usageChanged
      ? { from: existing.usageName, to: unit.usageName }
      : null,
    backfillKatastrId,
    ownershipChange: ownershipChanged
      ? { from: fromSummary, to: toSummary() }
      : null,
    parties,
    buildingShare: unit.buildingShare,
    usageCodeToWrite: unit.usageCode,
    usageNameToWrite: unit.usageName,
  };
}

/**
 * The earliest date `planOwnershipTransition` would accept: the latest period's
 * start, or its end when that period is already closed.
 *
 * Exported so the apply-time handler can compute the same value when its own
 * defense-in-depth re-check (`planOwnershipTransition` run again at write
 * time) rejects — one derivation, not two.
 */
export function earliestAllowedEffectiveAt(
  parties: UnitOwnershipParty[],
): Date {
  const latestFrom = Math.max(...parties.map((p) => p.validFrom.getTime()));
  const latest = parties.filter((p) => p.validFrom.getTime() === latestFrom);
  const ends = latest
    .map((p) => p.validTo?.getTime() ?? latestFrom)
    .concat(latestFrom);
  return new Date(Math.max(...ends));
}

function checkTransition(
  planned: PlannedUnit,
  existing: RegisterUnit,
  effectiveAt: Date,
  now: Date,
  blockers: ImportBlocker[],
): void {
  if (planned.ownershipChange === null) return;
  const transition = planOwnershipTransition(
    existing.parties,
    effectiveAt,
    now,
  );
  if (transition.kind !== 'REJECT') return;
  if (transition.code === 'TRANSFER_ALREADY_SCHEDULED') {
    blockers.push({
      code: 'TRANSFER_ALREADY_SCHEDULED',
      unitNo: planned.unitNo,
    });
    return;
  }
  blockers.push({
    code: 'EFFECTIVE_DATE_TOO_EARLY',
    unitNo: planned.unitNo,
    // A calendar day, not the instant it is Prague midnight at — the same
    // fact C1 fixed for `effectiveAt`. `earliestAllowedEffectiveAt` returns
    // a Prague-midnight instant (validFrom/validTo are stored that way), so
    // `.toISOString()` here would have been a second, independent instance
    // of exactly the bug that made the portal walk a date backwards.
    earliestAllowed: formatAssociationDate(
      earliestAllowedEffectiveAt(existing.parties),
    ),
  });
}

/**
 * `validateOwnershipPlan` refuses an ASSOCIATION member on a unit with more
 * than one party. Catch it during preview, not mid-write.
 */
function checkMixedAssociation(
  planned: PlannedUnit,
  ownerByPerson: Map<string, PlannedOwner>,
  blockers: ImportBlocker[],
): void {
  if (planned.ownershipChange === null) return;
  if (planned.parties.length <= 1) return;
  for (const party of planned.parties) {
    for (const personId of party.memberKatastrPersonIds) {
      const owner = ownerByPerson.get(personId);
      if (owner === undefined || owner.existingOwnerId === null) continue;
      if (owner.kindInRegister !== OwnerKind.ASSOCIATION) continue;
      blockers.push({
        code: 'MIXED_ASSOCIATION',
        unitNo: planned.unitNo,
        ownerName: owner.displayName,
      });
    }
  }
}

function checkUnitNoCollisions(
  planned: PlannedUnit[],
  snapshot: RegisterSnapshot,
  blockers: ImportBlocker[],
): void {
  const holder = new Map(snapshot.units.map((u) => [u.unitNo, u.id]));
  const seenInFile = new Map<string, string>();

  for (const unit of planned) {
    const heldBy = holder.get(unit.unitNo);
    if (heldBy !== undefined && heldBy !== unit.existingUnitId) {
      blockers.push({
        code: 'UNIT_NO_COLLISION',
        unitNo: unit.unitNo,
        incomingKatastrUnitId: unit.katastrUnitId,
        heldByUnitId: heldBy,
      });
    } else if (seenInFile.has(unit.unitNo)) {
      blockers.push({
        code: 'UNIT_NO_COLLISION',
        unitNo: unit.unitNo,
        incomingKatastrUnitId: unit.katastrUnitId,
        heldByUnitId: null,
      });
    }
    seenInFile.set(unit.unitNo, unit.katastrUnitId);
  }
}
