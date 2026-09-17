/**
 * Whether a Google account may be attached to an account that already signs
 * in with a password. Both paths ask here: the explicit link from the profile,
 * and the sign-in that finds an account on the same address.
 *
 * Linking from the profile happens on a session the user already holds, so it
 * cannot hand their account to a stranger. What it can do is make the account
 * unreadable — two addresses on one profile with nothing to say which one it
 * answers to — or quietly steal a Google identity from another account. Both
 * are refused here rather than in the handler, so the rules can be read in
 * one place.
 */

export interface LinkIdentityInput {
  account: { id: string; email: string; isEmailVerified: boolean };
  googleEmail: string;
  /** Google's own claim that the address belongs to whoever just signed in. */
  emailVerified: boolean;
  /** Who already holds this Google subject, if anyone. */
  identityOwnerId: string | null;
}

export type LinkRefusalReason =
  | 'EMAIL_NOT_VERIFIED'
  | 'ACCOUNT_EMAIL_NOT_VERIFIED'
  | 'EMAIL_MISMATCH'
  | 'IDENTITY_ALREADY_LINKED';

export type LinkIdentityDecision =
  | { outcome: 'LINK' }
  | { outcome: 'ALREADY_LINKED' }
  | { outcome: 'REFUSE'; reason: LinkRefusalReason };

export function decideIdentityLink({
  account,
  googleEmail,
  emailVerified,
  identityOwnerId,
}: LinkIdentityInput): LinkIdentityDecision {
  if (!emailVerified) {
    return { outcome: 'REFUSE', reason: 'EMAIL_NOT_VERIFIED' };
  }

  if (identityOwnerId === account.id) {
    // The same link twice — a double click, or a tab left open. Nothing to
    // do, and nothing went wrong.
    return { outcome: 'ALREADY_LINKED' };
  }

  if (identityOwnerId !== null) {
    return { outcome: 'REFUSE', reason: 'IDENTITY_ALREADY_LINKED' };
  }

  if (!account.isEmailVerified) {
    // Google proved the address; this account never did. Attaching them would
    // hand the account to whoever holds the mailbox, which is exactly the
    // squat the registration flow lets the real owner undo.
    return { outcome: 'REFUSE', reason: 'ACCOUNT_EMAIL_NOT_VERIFIED' };
  }

  if (googleEmail.toLowerCase() !== account.email.toLowerCase()) {
    return { outcome: 'REFUSE', reason: 'EMAIL_MISMATCH' };
  }

  return { outcome: 'LINK' };
}
