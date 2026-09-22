import { memberRef, ownerRef, refKey } from './representative-ref';

describe('RepresentativeRef', () => {
  it('keys an owner and a member differently even with the same id', () => {
    expect(refKey(ownerRef('x'))).toBe('owner:x');
    expect(refKey(memberRef('x'))).toBe('member:x');
  });

  it('builds refs with exactly one id set', () => {
    expect(ownerRef('o1')).toEqual({ ownerId: 'o1', membershipId: null });
    expect(memberRef('m1')).toEqual({ ownerId: null, membershipId: 'm1' });
  });
});
