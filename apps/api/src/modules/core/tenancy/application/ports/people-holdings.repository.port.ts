import { type PeopleHoldingRow } from '@/modules/core/tenancy/domain/people-union';

export interface PeopleHoldingsRepository {
  /**
   * One row per (owner, ownership party) active at `now`, with both the
   * party's share of its unit and that unit's share of the building.
   *
   * Deliberately raw: multiplying and summing the two fractions is exact
   * `Rational` work in `unionPeople`, and doing it in SQL would mean floats.
   */
  findHoldings(tenantId: string, now: Date): Promise<PeopleHoldingRow[]>;
}

export const PEOPLE_HOLDINGS_REPOSITORY = Symbol('PEOPLE_HOLDINGS_REPOSITORY');
