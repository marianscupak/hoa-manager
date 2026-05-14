/**
 * Aggregated unit metrics used by the property overview endpoint.
 *
 * `buildingShareSum` is a percentage: each unit contributes
 * `(numerator / denominator) * 100`, and the sum is rounded to two
 * decimal places. A perfectly configured building sums to exactly 100.
 *
 * `withoutOwnersCount` counts units that have no currently active
 * ownership row (i.e. no `unit_ownerships` row with `valid_to IS NULL`).
 */
export interface UnitOverview {
  total: number;
  withoutOwnersCount: number;
  buildingShareSum: number;
}

export interface UnitReadRepository {
  getOverview(tenantId: string): Promise<UnitOverview>;
}

export const UNIT_READ_REPOSITORY = Symbol('UNIT_READ_REPOSITORY');
