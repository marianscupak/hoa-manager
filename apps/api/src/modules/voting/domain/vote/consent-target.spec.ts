import { canonicalizeConsentTargets } from './consent-target';
import { memberRef, ownerRef } from './representative-ref';

describe('canonicalizeConsentTargets', () => {
  const ownerByMembership = new Map([['m-husband', 'husband']]);

  it('passes an owner target through', () => {
    expect(
      canonicalizeConsentTargets(
        [
          {
            unitId: 'u1',
            fromOwnerId: 'wife',
            toOwnerId: 'husband',
            toMembershipId: null,
          },
        ],
        ownerByMembership,
      ),
    ).toEqual([{ unitId: 'u1', fromOwnerId: 'wife', to: ownerRef('husband') }]);
  });

  it('folds a membership target into the owner its user is linked to', () => {
    expect(
      canonicalizeConsentTargets(
        [
          {
            unitId: 'u1',
            fromOwnerId: 'wife',
            toOwnerId: null,
            toMembershipId: 'm-husband',
          },
        ],
        ownerByMembership,
      ),
    ).toEqual([{ unitId: 'u1', fromOwnerId: 'wife', to: ownerRef('husband') }]);
  });

  it('keeps a membership target for a member who owns nothing in the tenant', () => {
    expect(
      canonicalizeConsentTargets(
        [
          {
            unitId: 'u1',
            fromOwnerId: 'wife',
            toOwnerId: null,
            toMembershipId: 'board',
          },
        ],
        ownerByMembership,
      ),
    ).toEqual([{ unitId: 'u1', fromOwnerId: 'wife', to: memberRef('board') }]);
  });

  it('drops a row with no target rather than inventing one', () => {
    expect(
      canonicalizeConsentTargets(
        [
          {
            unitId: 'u1',
            fromOwnerId: 'wife',
            toOwnerId: null,
            toMembershipId: null,
          },
        ],
        ownerByMembership,
      ),
    ).toEqual([]);
  });
});
