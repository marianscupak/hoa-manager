import { decideIdentityLink } from './link-identity';

const ACCOUNT = {
  id: 'u1',
  email: 'marian@example.com',
  isEmailVerified: true,
};

describe('decideIdentityLink', () => {
  it('links when the verified Google address is the account’s own', () => {
    expect(
      decideIdentityLink({
        account: ACCOUNT,
        googleEmail: 'marian@example.com',
        emailVerified: true,
        identityOwnerId: null,
      }),
    ).toEqual({ outcome: 'LINK' });
  });

  it('refuses an address Google has not verified', () => {
    // Without that proof anyone could claim any address at their provider.
    expect(
      decideIdentityLink({
        account: ACCOUNT,
        googleEmail: 'marian@example.com',
        emailVerified: false,
        identityOwnerId: null,
      }),
    ).toEqual({ outcome: 'REFUSE', reason: 'EMAIL_NOT_VERIFIED' });
  });

  it('refuses a Google account whose address is not the account’s', () => {
    // Linking it would be safe but unreadable: the profile would show two
    // addresses with nothing to say which one the account answers to.
    expect(
      decideIdentityLink({
        account: ACCOUNT,
        googleEmail: 'someone.else@example.com',
        emailVerified: true,
        identityOwnerId: null,
      }),
    ).toEqual({ outcome: 'REFUSE', reason: 'EMAIL_MISMATCH' });
  });

  it('compares addresses case-insensitively', () => {
    expect(
      decideIdentityLink({
        account: ACCOUNT,
        googleEmail: 'Marian@Example.COM',
        emailVerified: true,
        identityOwnerId: null,
      }),
    ).toEqual({ outcome: 'LINK' });
  });

  it('refuses a Google account already linked to somebody else', () => {
    expect(
      decideIdentityLink({
        account: ACCOUNT,
        googleEmail: 'marian@example.com',
        emailVerified: true,
        identityOwnerId: 'u2',
      }),
    ).toEqual({ outcome: 'REFUSE', reason: 'IDENTITY_ALREADY_LINKED' });
  });

  it('refuses an account that never proved its own address', () => {
    // Google proved the address; this account never did. Attaching them would
    // hand the account to whoever holds the mailbox.
    expect(
      decideIdentityLink({
        account: { ...ACCOUNT, isEmailVerified: false },
        googleEmail: 'marian@example.com',
        emailVerified: true,
        identityOwnerId: null,
      }),
    ).toEqual({ outcome: 'REFUSE', reason: 'ACCOUNT_EMAIL_NOT_VERIFIED' });
  });

  it('treats a repeat of the same link as done, not as an error', () => {
    // Pressing the button twice, or a stale tab, should not read as a failure.
    expect(
      decideIdentityLink({
        account: ACCOUNT,
        googleEmail: 'marian@example.com',
        emailVerified: true,
        identityOwnerId: 'u1',
      }),
    ).toEqual({ outcome: 'ALREADY_LINKED' });
  });
});
