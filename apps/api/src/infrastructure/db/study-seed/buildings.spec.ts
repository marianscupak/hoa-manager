import {
  OwnerKind,
  OwnershipPartyType,
} from '@/modules/core/property/domain/ownership-plan';

import {
  type BuildingPlan,
  JASMINOVA_3,
  PHASE_TWO_VOTE_KEY,
  planTally,
  SHARE_DENOMINATOR,
  SLUNECNA_12,
} from './buildings';

const PLANS: BuildingPlan[] = [SLUNECNA_12, JASMINOVA_3];

describe.each(PLANS.map((p) => [p.key, p] as const))(
  'building plan %s',
  (_key, plan) => {
    it('has unit shares summing to exactly one', () => {
      const sum = plan.units.reduce((a, u) => a + u.shareNumerator, 0);
      expect(sum).toBe(SHARE_DENOMINATOR);
    });

    it('references only existing units and owners', () => {
      const unitNos = new Set(plan.units.map((u) => u.unitNo));
      const ownerKeys = new Set(plan.owners.map((o) => o.key));
      for (const party of plan.parties) {
        expect(unitNos.has(party.unitNo)).toBe(true);
        for (const k of party.ownerKeys) expect(ownerKeys.has(k)).toBe(true);
      }
      for (const vote of plan.votes) {
        for (const b of vote.ballots) {
          expect(unitNos.has(b.unitNo)).toBe(true);
          expect(ownerKeys.has(b.ownerKey)).toBe(true);
        }
      }
    });

    it('gives SJM parties two members and SOLE parties one', () => {
      for (const party of plan.parties) {
        expect(party.ownerKeys).toHaveLength(
          party.partyType === OwnershipPartyType.SJM ? 2 : 1,
        );
      }
    });

    it('has party shares per unit summing to one', () => {
      for (const unit of plan.units) {
        const parties = plan.parties.filter((p) => p.unitNo === unit.unitNo);
        expect(parties.length).toBeGreaterThan(0);
        // sum over common denominator 6 covers 1/1, 1/2, 1/3, 2/3
        const sixths = parties.reduce(
          (a, p) => a + (p.shareNumerator * 6) / p.shareDenominator,
          0,
        );
        expect(sixths).toBe(6);
      }
    });

    it('lets only sole owners with an account cast ballots', () => {
      const owners = new Map(plan.owners.map((o) => [o.key, o]));
      for (const vote of plan.votes) {
        for (const b of vote.ballots) {
          const party = plan.parties.find(
            (p) => p.unitNo === b.unitNo && p.ownerKeys.includes(b.ownerKey),
          );
          expect(party).toBeDefined();
          expect(party!.partyType).toBe(OwnershipPartyType.SOLE);
          expect(party!.shareNumerator / party!.shareDenominator).toBeGreaterThan(
            0.5,
          );
          expect(owners.get(b.ownerKey)!.hasAccount).toBe(true);
          expect(owners.get(b.ownerKey)!.kind).toBe(OwnerKind.PERSON);
        }
        const units = vote.ballots.map((b) => b.unitNo);
        expect(new Set(units).size).toBe(units.length);
      }
    });

    it('has unique owner keys, unit numbers and vote keys', () => {
      expect(new Set(plan.owners.map((o) => o.key)).size).toBe(plan.owners.length);
      expect(new Set(plan.units.map((u) => u.unitNo)).size).toBe(plan.units.length);
      expect(new Set(plan.votes.map((v) => v.key)).size).toBe(plan.votes.length);
    });
  },
);

describe('SLUNECNA_12 (tenant B)', () => {
  it('links exactly one owner to the persona and none to the participant', () => {
    expect(SLUNECNA_12.owners.filter((o) => o.isPersona)).toHaveLength(1);
    expect(SLUNECNA_12.owners.filter((o) => o.isParticipant)).toHaveLength(0);
  });

  it('"Výměna oken" fails although yes outnumbers no (A6 ground truth)', () => {
    const t = planTally(SLUNECNA_12, 'vymena-oken');
    expect(t).toEqual({ yes: 3588, no: 950, countable: 9400, passes: false });
    expect(t.yes).toBeGreaterThan(t.no);
  });
});

describe('JASMINOVA_3 (tenant C)', () => {
  it('has exactly one participant owner on unit 4 and no persona owner', () => {
    const participant = JASMINOVA_3.owners.filter((o) => o.isParticipant);
    expect(participant).toHaveLength(1);
    expect(JASMINOVA_3.owners.filter((o) => o.isPersona)).toHaveLength(0);
    const party = JASMINOVA_3.parties.find((p) =>
      p.ownerKeys.includes(participant[0].key),
    );
    expect(party).toMatchObject({
      unitNo: '4',
      partyType: OwnershipPartyType.SOLE,
      shareNumerator: 1,
      shareDenominator: 1,
    });
    expect(participant[0].hasAccount).toBe(false);
  });

  it('"Zateplení fasády" passes (O5 ground truth)', () => {
    expect(planTally(JASMINOVA_3, 'zatepleni-fasady')).toEqual({
      yes: 5400,
      no: 0,
      countable: 10000,
      passes: true,
    });
  });

  it('keeps the phase-two vote scheduled with two pre-cast YES ballots', () => {
    const vote = JASMINOVA_3.votes.find((v) => v.key === PHASE_TWO_VOTE_KEY)!;
    expect(vote.state.kind).toBe('OPEN_IN_PHASE_2');
    expect(vote.ballots.map((b) => b.answer)).toEqual(['YES', 'YES']);
    expect(planTally(JASMINOVA_3, PHASE_TWO_VOTE_KEY).passes).toBe(false);
  });

  it('keeps the delegation vote scheduled with no ballots', () => {
    const vote = JASMINOVA_3.votes.find((v) => v.key === 'novy-domovni-rad')!;
    expect(vote.state.kind).toBe('SCHEDULED');
    expect(vote.ballots).toHaveLength(0);
  });

  it('never lets the participant vote in seeded votes', () => {
    for (const vote of JASMINOVA_3.votes) {
      expect(vote.ballots.some((b) => b.ownerKey === 'participant')).toBe(false);
    }
  });
});
