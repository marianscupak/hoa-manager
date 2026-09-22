import {
  memberRef,
  ownerRef,
  type RepresentativeRef,
} from './representative-ref';

/** A `vote_unit_consents` row's target columns, as stored. */
export interface StoredConsentTarget {
  unitId: string;
  fromOwnerId: string;
  toOwnerId: string | null;
  toMembershipId: string | null;
}

export interface CanonicalConsent {
  unitId: string;
  fromOwnerId: string;
  to: RepresentativeRef;
}

/**
 * Turns stored consents into resolver inputs. A membership target whose user
 * is linked to an owner in the tenant becomes that owner, so a consent given
 * to a co-owner's *account* joins the same coalition as the co-owner's own
 * support. `owners` has UNIQUE (tenant_id, user_id), so the fold is
 * one-to-one. Done at load time with the current links — never at write time
 * and never by backfill — so a later link or unlink is honoured.
 */
export function canonicalizeConsentTargets(
  consents: StoredConsentTarget[],
  ownerIdByMembershipId: ReadonlyMap<string, string>,
): CanonicalConsent[] {
  const out: CanonicalConsent[] = [];
  for (const c of consents) {
    if (c.toOwnerId) {
      out.push({
        unitId: c.unitId,
        fromOwnerId: c.fromOwnerId,
        to: ownerRef(c.toOwnerId),
      });
      continue;
    }
    if (c.toMembershipId) {
      const ownerId = ownerIdByMembershipId.get(c.toMembershipId);
      out.push({
        unitId: c.unitId,
        fromOwnerId: c.fromOwnerId,
        to: ownerId ? ownerRef(ownerId) : memberRef(c.toMembershipId),
      });
    }
  }
  return out;
}
