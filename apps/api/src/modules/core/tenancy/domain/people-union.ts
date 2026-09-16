import { Rational } from '@/shared/domain/rational';

export interface PeopleOwnerRow {
  ownerId: string;
  displayName: string;
  email: string | null;
  kind: 'PERSON' | 'LEGAL_ENTITY' | 'ASSOCIATION';
  ico: string | null;
  userId: string | null;
  hasOwnershipRecords: boolean;
  inviteStatus: string | null;
  inviteCreatedAt: Date | null;
}

export interface PeopleMemberRow {
  membershipId: string;
  userId: string;
  fullName: string | null;
  email: string;
  role: string;
  status: string;
  joinedAt: Date;
}

/** One unit an owner holds a party in, as of today. */
export interface PeopleHoldingRow {
  ownerId: string;
  unitId: string;
  unitShareNum: number;
  unitShareDen: number;
  partyShareNum: number;
  partyShareDen: number;
}

export interface Person {
  key: string;
  source: 'OWNER' | 'MEMBER';
  displayName: string;
  email: string | null;
  ownerId: string | null;
  kind: 'PERSON' | 'LEGAL_ENTITY' | 'ASSOCIATION' | null;
  ico: string | null;
  unitCount: number;
  share: Rational;
  hasOwnershipRecords: boolean;
  membershipId: string | null;
  userId: string | null;
  role: string | null;
  status: string | null;
  joinedAt: Date | null;
  inviteStatus: string | null;
  inviteCreatedAt: Date | null;
  suggestedCounterpartKey: string | null;
}

const ownerKey = (ownerId: string) => `owner:${ownerId}`;
const memberKey = (membershipId: string) => `member:${membershipId}`;
const normalise = (email: string | null) => email?.trim().toLowerCase() || null;

/**
 * One list of people out of two tables.
 *
 * `owners` and `tenant_memberships` describe the same humans from two sides
 * and share no key, so a row is keyed by which side it came from. An owner
 * linked to an account is one person and appears once, on the owner row,
 * which carries both sides; the membership it claims is not emitted again.
 *
 * Identity is never inferred. A matching e-mail only produces a suggestion
 * the admin confirms — the link decides who may vote for a unit, and
 * `owners.email` is an optional contact that spouses and managing agents
 * legitimately share. Names are not matched at all: two owners can share one,
 * while an e-mail is unique within an association.
 */
export function unionPeople(input: {
  owners: PeopleOwnerRow[];
  members: PeopleMemberRow[];
  holdings: PeopleHoldingRow[];
}): Person[] {
  const memberByUserId = new Map(input.members.map((m) => [m.userId, m]));
  const claimedUserIds = new Set(
    input.owners.map((o) => o.userId).filter((id): id is string => !!id),
  );

  // A unit counts once however many parties the owner holds in it; the share
  // is what those parties actually hold, so a co-owner is not credited with
  // the whole unit.
  const unitsByOwner = new Map<string, Set<string>>();
  const shareByOwner = new Map<string, Rational>();
  for (const holding of input.holdings) {
    const units = unitsByOwner.get(holding.ownerId) ?? new Set<string>();
    units.add(holding.unitId);
    unitsByOwner.set(holding.ownerId, units);

    const held = Rational.from(
      holding.partyShareNum,
      holding.partyShareDen,
    ).mul(Rational.from(holding.unitShareNum, holding.unitShareDen));
    shareByOwner.set(
      holding.ownerId,
      (shareByOwner.get(holding.ownerId) ?? Rational.zero()).add(held),
    );
  }

  const ownerPeople: Person[] = input.owners.map((o) => {
    const linked = o.userId ? memberByUserId.get(o.userId) : undefined;
    return {
      key: ownerKey(o.ownerId),
      source: 'OWNER',
      displayName: o.displayName,
      email: o.email,
      ownerId: o.ownerId,
      kind: o.kind,
      ico: o.ico,
      unitCount: unitsByOwner.get(o.ownerId)?.size ?? 0,
      share: shareByOwner.get(o.ownerId) ?? Rational.zero(),
      hasOwnershipRecords: o.hasOwnershipRecords,
      membershipId: linked?.membershipId ?? null,
      userId: o.userId,
      role: linked?.role ?? null,
      status: linked?.status ?? null,
      joinedAt: linked?.joinedAt ?? null,
      inviteStatus: o.inviteStatus,
      inviteCreatedAt: o.inviteCreatedAt,
      suggestedCounterpartKey: null,
    };
  });

  const memberPeople: Person[] = input.members
    .filter((m) => !claimedUserIds.has(m.userId))
    .map((m) => ({
      key: memberKey(m.membershipId),
      source: 'MEMBER',
      displayName: m.fullName ?? m.email,
      email: m.email,
      ownerId: null,
      kind: null,
      ico: null,
      unitCount: 0,
      share: Rational.zero(),
      hasOwnershipRecords: false,
      membershipId: m.membershipId,
      userId: m.userId,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
      inviteStatus: null,
      inviteCreatedAt: null,
      suggestedCounterpartKey: null,
    }));

  // Suggestions run only between an unlinked owner and a membership no owner
  // claims — anything else is not a duplicate.
  const unlinkedMemberByEmail = new Map(
    memberPeople.map((m) => [normalise(m.email), m]),
  );
  for (const person of ownerPeople) {
    if (person.userId) continue;
    const email = normalise(person.email);
    if (!email) continue;
    const counterpart = unlinkedMemberByEmail.get(email);
    if (!counterpart) continue;
    person.suggestedCounterpartKey = counterpart.key;
    counterpart.suggestedCounterpartKey = person.key;
  }

  return [...ownerPeople, ...memberPeople].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, 'cs'),
  );
}
