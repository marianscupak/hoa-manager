/** The caller's holding in one unit, as `GetOwnedUnitsQuery` reports it. */
export interface OwnedUnitShare {
  id: string;
  shareNumerator: number;
  shareDenominator: number;
}

export type MarkedUnit<T extends { id: string }> = T & {
  /** True when the caller holds a share in this unit today. */
  mine: boolean;
  myShareNumerator: number | null;
  myShareDenominator: number | null;
};

/**
 * Picks the caller's own units out of the building's register.
 *
 * The screen shows the whole house — who owns which unit is public — and
 * marks the rows the reader has a stake in, because in a fifty-unit building
 * "which are mine" is otherwise lost. The share travels with the mark: for a
 * unit held with someone else, "I own two thirds of it" is the fact the owner
 * came for, and the register's own column is the unit's share of the
 * building, not theirs.
 *
 * An owned unit missing from the register is ignored rather than added. The
 * two lists are read separately, and a unit deleted between the two reads
 * must not conjure a row.
 */
export function markOwnUnits<T extends { id: string }>(
  units: T[],
  owned: OwnedUnitShare[],
): MarkedUnit<T>[] {
  const shareByUnit = new Map(owned.map((o) => [o.id, o]));

  return units.map((unit) => {
    const share = shareByUnit.get(unit.id);
    return {
      ...unit,
      mine: !!share,
      myShareNumerator: share?.shareNumerator ?? null,
      myShareDenominator: share?.shareDenominator ?? null,
    };
  });
}
