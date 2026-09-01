import {
  OwnerKind,
  OwnershipPartyType,
  validateOwnershipPlan,
  type OwnershipPartyInput,
} from './ownership-plan';

const owners = new Map([
  ['p1', { id: 'p1', kind: OwnerKind.PERSON }],
  ['p2', { id: 'p2', kind: OwnerKind.PERSON }],
  ['p3', { id: 'p3', kind: OwnerKind.PERSON }],
  ['le1', { id: 'le1', kind: OwnerKind.LEGAL_ENTITY }],
  ['svj', { id: 'svj', kind: OwnerKind.ASSOCIATION }],
]);

const sole = (
  ownerId: string,
  num: number,
  den: number,
): OwnershipPartyInput => ({
  partyType: OwnershipPartyType.SOLE,
  shareNumerator: num,
  shareDenominator: den,
  memberOwnerIds: [ownerId],
});

describe('validateOwnershipPlan', () => {
  it('accepts a sole owner holding 1/1', () => {
    expect(validateOwnershipPlan([sole('p1', 1, 1)], owners)).toEqual([]);
  });

  it('accepts thirds that decimals cannot represent', () => {
    expect(
      validateOwnershipPlan(
        [sole('p1', 1, 3), sole('p2', 1, 3), sole('p3', 1, 3)],
        owners,
      ),
    ).toEqual([]);
  });

  it('accepts an SJM couple holding 1/2 next to a sole 1/2', () => {
    const plan: OwnershipPartyInput[] = [
      {
        partyType: OwnershipPartyType.SJM,
        shareNumerator: 1,
        shareDenominator: 2,
        memberOwnerIds: ['p1', 'p2'],
      },
      sole('p3', 1, 2),
    ];
    expect(validateOwnershipPlan(plan, owners)).toEqual([]);
  });

  it('rejects sums other than exactly 1 with the actual sum', () => {
    const errors = validateOwnershipPlan(
      [sole('p1', 1, 2), sole('p2', 1, 3)],
      owners,
    );
    expect(errors).toEqual([
      { code: 'SUM_NOT_ONE', actual: { num: '5', den: '6' } },
    ]);
  });

  it('rejects invalid fractions (zero, negative, num > den)', () => {
    expect(validateOwnershipPlan([sole('p1', 0, 1)], owners)[0]).toEqual({
      code: 'INVALID_SHARE',
      index: 0,
    });
    expect(validateOwnershipPlan([sole('p1', 3, 2)], owners)[0]).toEqual({
      code: 'INVALID_SHARE',
      index: 0,
    });
    expect(validateOwnershipPlan([sole('p1', 1.5, 2)], owners)[0]).toEqual({
      code: 'INVALID_SHARE',
      index: 0,
    });
  });

  it('rejects SJM with a legal entity, one member, or identical members', () => {
    const bad = (memberOwnerIds: string[]): OwnershipPartyInput => ({
      partyType: OwnershipPartyType.SJM,
      shareNumerator: 1,
      shareDenominator: 1,
      memberOwnerIds,
    });
    expect(validateOwnershipPlan([bad(['p1', 'le1'])], owners)[0]).toEqual({
      code: 'SJM_MEMBER_RULES',
      index: 0,
    });
    expect(validateOwnershipPlan([bad(['p1'])], owners)[0]).toEqual({
      code: 'SJM_MEMBER_RULES',
      index: 0,
    });
    expect(validateOwnershipPlan([bad(['p1', 'p1'])], owners)[0]).toEqual({
      code: 'SJM_MEMBER_RULES',
      index: 0,
    });
  });

  it('rejects SOLE parties with more than one member', () => {
    const plan: OwnershipPartyInput[] = [
      {
        partyType: OwnershipPartyType.SOLE,
        shareNumerator: 1,
        shareDenominator: 1,
        memberOwnerIds: ['p1', 'p2'],
      },
    ];
    expect(validateOwnershipPlan(plan, owners)[0]).toEqual({
      code: 'SOLE_MEMBER_COUNT',
      index: 0,
    });
  });

  it('rejects one owner appearing in two parties', () => {
    const errors = validateOwnershipPlan(
      [sole('p1', 1, 2), sole('p1', 1, 2)],
      owners,
    );
    expect(errors[0]).toEqual({ code: 'DUPLICATE_OWNER', ownerId: 'p1' });
  });

  it('accepts the association holding the whole unit, rejects mixed association ownership', () => {
    expect(validateOwnershipPlan([sole('svj', 1, 1)], owners)).toEqual([]);
    const mixed = validateOwnershipPlan(
      [sole('svj', 1, 2), sole('p1', 1, 2)],
      owners,
    );
    expect(mixed[0]).toEqual({ code: 'MIXED_ASSOCIATION' });
  });

  it('rejects unknown owner ids', () => {
    expect(validateOwnershipPlan([sole('ghost', 1, 1)], owners)[0]).toEqual({
      code: 'UNKNOWN_OWNER',
      ownerId: 'ghost',
    });
  });

  it('rejects SJM with identical members, yielding only SJM_MEMBER_RULES', () => {
    const plan: OwnershipPartyInput[] = [
      {
        partyType: OwnershipPartyType.SJM,
        shareNumerator: 1,
        shareDenominator: 1,
        memberOwnerIds: ['p1', 'p1'],
      },
    ];
    expect(validateOwnershipPlan(plan, owners)).toEqual([
      { code: 'SJM_MEMBER_RULES', index: 0 },
    ]);
  });
});
