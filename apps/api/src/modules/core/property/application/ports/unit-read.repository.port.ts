/**
 * Aggregated unit metrics used by the property overview endpoint.
 *
 * `buildingShareSum` is a percentage: each unit contributes
 * `(numerator / denominator) * 100`, and the sum is rounded to two
 * decimal places. A perfectly configured building sums to exactly 100.
 *
 * `withoutOwnersCount` counts units that have no party active at `now`
 * (see `ownershipActiveAt`).
 */
export interface UnitOverview {
  total: number;
  withoutOwnersCount: number;
  buildingShareSum: number;
}

/**
 * One row per unit owned by the calling membership.
 *
 * Every share is reported twice: as the stored fraction and as a
 * percentage (0..100) rounded to two decimal places, matching the
 * rounding convention used by `buildingShareSum` in `UnitOverview`.
 * The fraction is what the cadastre and the association's documents
 * state, so owner-facing pages lead with it; the percentage stays for
 * the compact dashboard readout and for sorting.
 *
 * `shareNumerator / shareDenominator` is the party's undivided share of
 * the unit (an SJM party is not split between its two member-owners);
 * `buildingShareNumerator / buildingShareDenominator` is the unit's
 * share of the building's common parts.
 */
export interface OwnedUnitRow {
  id: string;
  unitNo: string;
  ownerSharePct: number;
  shareNumerator: number;
  shareDenominator: number;
  buildingSharePct: number;
  buildingShareNumerator: number;
  buildingShareDenominator: number;
  partyType: 'SOLE' | 'SJM';
}

export interface UnitReadRepository {
  getOverview(tenantId: string, now: Date): Promise<UnitOverview>;
  findOwnedByMembership(params: {
    tenantId: string;
    membershipId: string;
    now: Date;
  }): Promise<OwnedUnitRow[]>;
}

export const UNIT_READ_REPOSITORY = Symbol('UNIT_READ_REPOSITORY');
