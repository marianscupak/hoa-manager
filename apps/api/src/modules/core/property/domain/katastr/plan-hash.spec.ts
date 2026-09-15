import type { ImportPlan } from '@/modules/core/property/domain/katastr/import-plan';
import { computePlanHash } from '@/modules/core/property/domain/katastr/plan-hash';
import { OwnershipPartyType } from '@/modules/core/property/domain/ownership-plan';

const plan = (over: Partial<ImportPlan> = {}): ImportPlan => ({
  effectiveAt: new Date('2024-04-08T00:15:02Z'),
  document: {
    validAt: new Date('2024-04-08T00:15:02Z'),
    issuedAt: new Date('2026-09-15T14:51:26Z'),
    lvNumber: '33',
    municipality: 'Volary',
    cadastralArea: 'Volary',
  },
  units: [],
  owners: [],
  unitsNotInFile: [],
  ownersNotInFile: [],
  warnings: [],
  blockers: [],
  ...over,
});

describe('computePlanHash', () => {
  it('is stable for the same file and plan', () => {
    expect(computePlanHash('<xml/>', plan())).toBe(
      computePlanHash('<xml/>', plan()),
    );
  });

  it('changes when the file changes', () => {
    expect(computePlanHash('<xml/>', plan())).not.toBe(
      computePlanHash('<other/>', plan()),
    );
  });

  it('changes when the effective date changes', () => {
    expect(computePlanHash('<xml/>', plan())).not.toBe(
      computePlanHash(
        '<xml/>',
        plan({ effectiveAt: new Date('2026-01-01T00:00:00Z') }),
      ),
    );
  });

  it('changes when the register moved under the plan', () => {
    expect(computePlanHash('<xml/>', plan())).not.toBe(
      computePlanHash(
        '<xml/>',
        plan({ unitsNotInFile: [{ unitId: 'u1', unitNo: '131/1' }] }),
      ),
    );
  });

  it('serialises bigint shares instead of throwing on them', () => {
    expect(() =>
      computePlanHash(
        '<xml/>',
        plan({
          units: [
            {
              katastrUnitId: 'k1',
              unitNo: '132/1',
              action: 'CREATE',
              existingUnitId: null,
              unitNoChange: null,
              shareChange: null,
              usageChange: null,
              backfillKatastrId: false,
              ownershipChange: null,
              parties: [
                {
                  partyType: OwnershipPartyType.SOLE,
                  share: { num: 3819n, den: 206422n },
                  memberKatastrPersonIds: ['p1'],
                },
              ],
              buildingShare: { num: 3819n, den: 206422n },
              usageCodeToWrite: '1',
              usageNameToWrite: 'byt',
            },
          ],
        }),
      ),
    ).not.toThrow();
  });
});
