import { and, eq, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import * as schema from '@/infrastructure/db/schema';
import { OwnershipPartyType } from '@/modules/core/property/domain/ownership-plan';

import {
  type BuildingPlan,
  type PlanOwner,
  SHARE_DENOMINATOR,
} from './buildings';
import {
  isStudyEmail,
  personaEmail,
  slugify,
  studyEmail,
  tenantName,
} from './naming';

export type Db = NodePgDatabase<typeof schema>;
/** Accepts the root database or a transaction handle from `db.transaction`. */
export type DbLike = Pick<Db, 'select' | 'insert' | 'update' | 'delete'>;

export interface StudyContext {
  participantId: string;
  personaUserId: string;
  participant: { email: string; name: string };
  /** One bcrypt hash shared by all fictional owner accounts (they never log in). */
  fictionalPasswordHash: string;
}

export interface Voter {
  userId: string;
  membershipId: string;
}

export interface BuiltTenant {
  tenantId: string;
  tenantName: string;
  admin: Voter;
  unitIdByNo: Record<string, string>;
  /** Owners that can cast ballots (persona + fictional accounts), by plan key. */
  voterByKey: Record<string, Voter>;
  /**
   * The plan's `isParticipant` owner, or `null` for a plan without one
   * (tenant B). `voter` is `null` until the participant registers (task O1).
   */
  participant: { ownerId: string; unitId: string; voter: Voter | null } | null;
}

function ownerEmail(owner: PlanOwner, ctx: StudyContext): string | null {
  if (owner.isPersona) return personaEmail(ctx.participantId);
  if (owner.isParticipant) return ctx.participant.email;
  if (!owner.hasAccount) return null;
  return studyEmail(ctx.participantId, slugify(owner.displayName));
}

function ownerDisplayName(owner: PlanOwner, ctx: StudyContext): string {
  return owner.isParticipant ? ctx.participant.name : owner.displayName;
}

export async function buildTenant(
  db: Db,
  plan: BuildingPlan,
  ctx: StudyContext,
): Promise<BuiltTenant> {
  const name = tenantName(plan.baseName, ctx.participantId);

  const [tenant] = await db
    .insert(schema.tenants)
    .values({ name })
    .returning({ id: schema.tenants.id });

  const [adminMembership] = await db
    .insert(schema.tenantMemberships)
    .values({
      tenantId: tenant.id,
      userId: ctx.personaUserId,
      role: 'ADMIN',
      status: 'ACTIVE',
    })
    .returning({ id: schema.tenantMemberships.id });
  const admin: Voter = {
    userId: ctx.personaUserId,
    membershipId: adminMembership.id,
  };

  const ownerIdByKey: Record<string, string> = {};
  const voterByKey: Record<string, Voter> = {};

  for (const owner of plan.owners) {
    let userId: string | null = null;

    if (owner.isPersona) {
      userId = ctx.personaUserId;
      voterByKey[owner.key] = admin;
    } else if (owner.hasAccount && !owner.isParticipant) {
      const email = ownerEmail(owner, ctx) as string;
      const [user] = await db
        .insert(schema.users)
        .values({
          email,
          fullName: owner.displayName,
          isEmailVerified: true,
          isActive: true,
        })
        .returning({ id: schema.users.id });
      await db.insert(schema.authIdentities).values({
        userId: user.id,
        provider: 'LOCAL',
        providerSubject: email,
        passwordHash: ctx.fictionalPasswordHash,
      });
      const [membership] = await db
        .insert(schema.tenantMemberships)
        .values({
          tenantId: tenant.id,
          userId: user.id,
          role: 'UNIT_OWNER',
          status: 'ACTIVE',
        })
        .returning({ id: schema.tenantMemberships.id });
      userId = user.id;
      voterByKey[owner.key] = { userId: user.id, membershipId: membership.id };
    }

    const [row] = await db
      .insert(schema.owners)
      .values({
        tenantId: tenant.id,
        displayName: ownerDisplayName(owner, ctx),
        kind: owner.kind,
        email: ownerEmail(owner, ctx),
        userId,
      })
      .returning({ id: schema.owners.id });
    ownerIdByKey[owner.key] = row.id;
  }

  const unitIdByNo: Record<string, string> = {};
  for (const unit of plan.units) {
    const [row] = await db
      .insert(schema.units)
      .values({
        tenantId: tenant.id,
        unitNo: unit.unitNo,
        buildingShareNumerator: unit.shareNumerator,
        buildingShareDenominator: SHARE_DENOMINATOR,
      })
      .returning({ id: schema.units.id });
    unitIdByNo[unit.unitNo] = row.id;
  }

  for (const party of plan.parties) {
    const [ownership] = await db
      .insert(schema.unitOwnerships)
      .values({
        tenantId: tenant.id,
        unitId: unitIdByNo[party.unitNo],
        partyType: party.partyType,
        shareNumerator: party.shareNumerator,
        shareDenominator: party.shareDenominator,
      })
      .returning({ id: schema.unitOwnerships.id });
    await db.insert(schema.unitOwnershipMembers).values(
      party.ownerKeys.map((key) => ({
        tenantId: tenant.id,
        ownershipId: ownership.id,
        ownerId: ownerIdByKey[key],
      })),
    );
  }

  const participantOwner = plan.owners.find((o) => o.isParticipant);
  const participant: BuiltTenant['participant'] = participantOwner
    ? {
        ownerId: ownerIdByKey[participantOwner.key],
        unitId:
          unitIdByNo[
            plan.parties.find((p) =>
              p.ownerKeys.includes(participantOwner.key),
            )!.unitNo
          ],
        voter: voterByKey[participantOwner.key] ?? null,
      }
    : null;

  return {
    tenantId: tenant.id,
    tenantName: name,
    admin,
    unitIdByNo,
    voterByKey,
    participant,
  };
}

/**
 * Rebuilds the BuiltTenant view from the database for phase 2 and for
 * idempotency checks. Returns null when the tenant does not exist.
 */
export async function loadBuiltTenant(
  db: Db,
  plan: BuildingPlan,
  participantId: string,
): Promise<BuiltTenant | null> {
  const name = tenantName(plan.baseName, participantId);
  const [tenant] = await db
    .select({ id: schema.tenants.id })
    .from(schema.tenants)
    .where(eq(schema.tenants.name, name))
    .limit(1);
  if (!tenant) return null;

  const memberships = await db
    .select({
      id: schema.tenantMemberships.id,
      userId: schema.tenantMemberships.userId,
      role: schema.tenantMemberships.role,
    })
    .from(schema.tenantMemberships)
    .where(eq(schema.tenantMemberships.tenantId, tenant.id));
  const adminMembership = memberships.find((m) => m.role === 'ADMIN');
  if (!adminMembership) {
    throw new Error(`Tenant "${name}" has no ADMIN membership`);
  }
  const membershipByUser = new Map(memberships.map((m) => [m.userId, m.id]));

  const unitRows = await db
    .select({ id: schema.units.id, unitNo: schema.units.unitNo })
    .from(schema.units)
    .where(eq(schema.units.tenantId, tenant.id));
  const unitIdByNo = Object.fromEntries(unitRows.map((u) => [u.unitNo, u.id]));

  const ownerRows = await db
    .select({
      id: schema.owners.id,
      displayName: schema.owners.displayName,
      email: schema.owners.email,
      userId: schema.owners.userId,
    })
    .from(schema.owners)
    .where(eq(schema.owners.tenantId, tenant.id));

  const voterByKey: Record<string, Voter> = {};
  for (const owner of plan.owners) {
    if (owner.isParticipant) continue; // matched separately below, by email
    const row = ownerRows.find((r) => r.displayName === owner.displayName);
    if (!row)
      throw new Error(`Owner "${owner.displayName}" missing in "${name}"`);
    if (row.userId && membershipByUser.has(row.userId)) {
      voterByKey[owner.key] = {
        userId: row.userId,
        membershipId: membershipByUser.get(row.userId) as string,
      };
    }
  }

  // The participant's real email is the one owner row not under the study
  // domain; every fictional/persona account is seeded under @study.hoa.local.
  const nonStudyOwners = ownerRows.filter(
    (r) => r.email !== null && !isStudyEmail(r.email),
  );
  if (nonStudyOwners.length > 1) {
    throw new Error(
      `Expected at most one non-study owner email in "${name}", found ${nonStudyOwners.length}`,
    );
  }
  const participantRow = nonStudyOwners[0];

  let participant: BuiltTenant['participant'] = null;
  if (participantRow) {
    const [membershipRow] = await db
      .select({ unitId: schema.unitOwnerships.unitId })
      .from(schema.unitOwnershipMembers)
      .innerJoin(
        schema.unitOwnerships,
        eq(schema.unitOwnershipMembers.ownershipId, schema.unitOwnerships.id),
      )
      .where(
        and(
          eq(schema.unitOwnershipMembers.ownerId, participantRow.id),
          eq(schema.unitOwnerships.partyType, OwnershipPartyType.SOLE),
        ),
      )
      .limit(1);
    if (!membershipRow) {
      throw new Error(
        `Participant owner has no SOLE unit ownership in "${name}"`,
      );
    }
    participant = {
      ownerId: participantRow.id,
      unitId: membershipRow.unitId,
      voter:
        participantRow.userId && membershipByUser.has(participantRow.userId)
          ? {
              userId: participantRow.userId,
              membershipId: membershipByUser.get(
                participantRow.userId,
              ) as string,
            }
          : null,
    };
  }

  return {
    tenantId: tenant.id,
    tenantName: name,
    admin: { userId: adminMembership.userId, membershipId: adminMembership.id },
    unitIdByNo,
    voterByKey,
    participant,
  };
}

/** Used by cleanup to find every tenant the persona belongs to. */
export async function findTenantIdsOfUser(
  db: DbLike,
  userId: string,
): Promise<string[]> {
  const rows = await db
    .select({ tenantId: schema.tenantMemberships.tenantId })
    .from(schema.tenantMemberships)
    .where(eq(schema.tenantMemberships.userId, userId));
  return rows.map((r) => r.tenantId);
}

export async function deleteTenants(
  db: DbLike,
  tenantIds: string[],
): Promise<number> {
  if (tenantIds.length === 0) return 0;
  const deleted = await db
    .delete(schema.tenants)
    .where(inArray(schema.tenants.id, tenantIds))
    .returning({ id: schema.tenants.id });
  return deleted.length;
}
