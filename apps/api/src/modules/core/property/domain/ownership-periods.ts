import type { UnitOwnershipParty } from '@/modules/core/property/domain/property.entity';

export type OwnershipPeriodStatus = 'SCHEDULED' | 'ACTIVE' | 'CLOSED';

/** Parties saved together share (validFrom, validTo); that set is a period. */
export interface OwnershipPeriod {
  validFrom: Date;
  validTo: Date | null;
  status: OwnershipPeriodStatus;
  parties: UnitOwnershipParty[];
}

/**
 * A period is the half-open interval [validFrom, validTo): the party holds
 * the unit from `validFrom` up to, but not including, `validTo`.
 */
export function periodStatus(
  period: { validFrom: Date; validTo: Date | null },
  now: Date,
): OwnershipPeriodStatus {
  const t = now.getTime();
  if (period.validFrom.getTime() > t) return 'SCHEDULED';
  if (period.validTo !== null && period.validTo.getTime() <= t) return 'CLOSED';
  return 'ACTIVE';
}

export function scheduledParties(
  parties: UnitOwnershipParty[],
  now: Date,
): UnitOwnershipParty[] {
  return parties.filter((p) => p.validFrom.getTime() > now.getTime());
}

/** Groups parties into periods, newest `validFrom` first. */
export function groupIntoPeriods(
  parties: UnitOwnershipParty[],
  now: Date,
): OwnershipPeriod[] {
  const byKey = new Map<string, OwnershipPeriod>();
  for (const party of parties) {
    const key = `${party.validFrom.getTime()}|${party.validTo?.getTime() ?? 'open'}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.parties.push(party);
    } else {
      byKey.set(key, {
        validFrom: party.validFrom,
        validTo: party.validTo,
        status: periodStatus(party, now),
        parties: [party],
      });
    }
  }
  return [...byKey.values()].sort(
    (a, b) => b.validFrom.getTime() - a.validFrom.getTime(),
  );
}
