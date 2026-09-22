/**
 * Who represents a unit: an owner of the tenant (with or without a user
 * account), or a member who owns nothing in the tenant and therefore only
 * exists as a membership. Exactly one id is set.
 *
 * The resolver ranks people, not accounts — whether the representative can
 * cast in the app is a separate question answered by the "channel" (see
 * `electorate-channel.ts` and `electorate-channel.sql.ts`).
 */
export type RepresentativeRef =
  | { ownerId: string; membershipId: null }
  | { ownerId: null; membershipId: string };

export const ownerRef = (ownerId: string): RepresentativeRef => ({
  ownerId,
  membershipId: null,
});

export const memberRef = (membershipId: string): RepresentativeRef => ({
  ownerId: null,
  membershipId,
});

/** Stable map key: `owner:<id>` or `member:<id>`. */
export function refKey(ref: RepresentativeRef): string {
  return ref.ownerId !== null
    ? `owner:${ref.ownerId}`
    : `member:${ref.membershipId}`;
}
