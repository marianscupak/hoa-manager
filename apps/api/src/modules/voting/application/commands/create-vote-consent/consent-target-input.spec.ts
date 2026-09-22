import { toRepresentativeRef } from './consent-target-input';

describe('toRepresentativeRef', () => {
  it('maps an owner target to an owner ref', () => {
    expect(toRepresentativeRef({ toOwnerId: 'o1' })).toEqual({
      ownerId: 'o1',
      membershipId: null,
    });
  });
  it('maps a member target to a member ref', () => {
    expect(toRepresentativeRef({ toMembershipId: 'm1' })).toEqual({
      ownerId: null,
      membershipId: 'm1',
    });
  });
  it('refuses both and neither', () => {
    expect(() =>
      toRepresentativeRef({ toOwnerId: 'o1', toMembershipId: 'm1' }),
    ).toThrow(/CONSENT_TARGET_INVALID/);
    expect(() => toRepresentativeRef({})).toThrow(/CONSENT_TARGET_INVALID/);
  });
});
