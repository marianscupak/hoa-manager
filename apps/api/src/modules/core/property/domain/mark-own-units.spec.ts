import { markOwnUnits } from './mark-own-units';

const unit = (id: string, unitNo: string) => ({ id, unitNo });

const owned = (
  id: string,
  shareNumerator: number,
  shareDenominator: number,
) => ({ id, shareNumerator, shareDenominator });

describe('markOwnUnits', () => {
  it('marks the units the caller owns and carries their share', () => {
    const rows = markOwnUnits(
      [unit('u1', '1'), unit('u2', '2')],
      [owned('u2', 2, 3)],
    );

    expect(rows).toEqual([
      {
        ...unit('u1', '1'),
        mine: false,
        myShareNumerator: null,
        myShareDenominator: null,
      },
      {
        ...unit('u2', '2'),
        mine: true,
        myShareNumerator: 2,
        myShareDenominator: 3,
      },
    ]);
  });

  it('leaves every row unmarked for someone who owns nothing', () => {
    // A board member with no unit of their own still sees the register.
    const rows = markOwnUnits([unit('u1', '1')], []);

    expect(rows[0]).toMatchObject({ mine: false, myShareNumerator: null });
  });

  it('keeps the whole register, not just the units the caller owns', () => {
    // The point of the screen: the whole building, with mine picked out.
    const rows = markOwnUnits(
      [unit('u1', '1'), unit('u2', '2'), unit('u3', '3')],
      [owned('u2', 1, 1)],
    );

    expect(rows).toHaveLength(3);
    expect(rows.filter((r) => r.mine).map((r) => r.unitNo)).toEqual(['2']);
  });

  it('ignores an owned unit that is not in the register', () => {
    // Defensive: the two lists are read separately, and a unit deleted
    // between them must not conjure a row.
    const rows = markOwnUnits([unit('u1', '1')], [owned('gone', 1, 1)]);

    expect(rows).toHaveLength(1);
    expect(rows[0].mine).toBe(false);
  });
});
