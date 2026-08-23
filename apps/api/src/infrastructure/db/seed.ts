import * as bcrypt from 'bcrypt';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from '@/infrastructure/db/schema';

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set.');
  }

  console.log('🌱 Starting seeder against:', connectionString);

  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });

  try {
    console.log('🧹 Clearing existing data...');
    await db.execute(sql`ALTER TABLE audit_events DISABLE TRIGGER USER;`);
    await db.execute(sql`TRUNCATE TABLE users, tenants, audit_events CASCADE;`);
    await db.execute(sql`ALTER TABLE audit_events ENABLE TRIGGER USER;`);
    console.log('✅ Database cleared.');

    const adminEmail = 'admin@hoa.local';
    const adminPassword = 'AdminPassword123!';

    // 1. Ensure User exists
    const [user] = await db
      .insert(schema.users)
      .values({
        email: adminEmail,
        fullName: 'System Admin',
        isEmailVerified: true,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: schema.users.email,
        set: { fullName: 'System Admin' },
      })
      .returning();
    console.log('✅ User ensured:', user.email);

    // 2. Ensure Local AuthIdentity exists
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await db
      .insert(schema.authIdentities)
      .values({
        userId: user.id,
        provider: 'LOCAL',
        providerSubject: adminEmail,
        passwordHash: passwordHash,
      })
      .onConflictDoUpdate({
        target: [
          schema.authIdentities.provider,
          schema.authIdentities.providerSubject,
        ],
        set: { passwordHash },
      });
    console.log('✅ AuthIdentity (LOCAL) ensured.');

    // 3. Ensure a Tenant exists
    const tenantName = 'Default Community';
    const [tenant] = await db
      .insert(schema.tenants)
      .values({ name: tenantName })
      .returning();
    console.log('✅ Tenant created/inserted:', tenant.name);

    // 4. Ensure TenantMembership exists
    const [membership] = await db
      .insert(schema.tenantMemberships)
      .values({
        tenantId: tenant.id,
        userId: user.id,
        role: 'ADMIN',
        status: 'ACTIVE',
      })
      .onConflictDoUpdate({
        target: [
          schema.tenantMemberships.tenantId,
          schema.tenantMemberships.userId,
        ],
        set: { role: 'ADMIN', status: 'ACTIVE' },
      })
      .returning();

    console.log(
      `✅ TenantMembership ensured for ${user.email} in ${tenant.name}.`,
    );

    // 5. Ensure Unit Owner User exists
    const ownerEmail = 'owner@hoa.local';
    const ownerPassword = 'OwnerPassword123!';

    const [ownerUser] = await db
      .insert(schema.users)
      .values({
        email: ownerEmail,
        fullName: 'Unit Owner',
        isEmailVerified: true,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: schema.users.email,
        set: { fullName: 'Unit Owner' },
      })
      .returning();
    console.log('✅ User ensured:', ownerUser.email);

    // 6. Ensure Local AuthIdentity exists for Unit Owner
    const ownerPasswordHash = await bcrypt.hash(ownerPassword, 10);
    await db
      .insert(schema.authIdentities)
      .values({
        userId: ownerUser.id,
        provider: 'LOCAL',
        providerSubject: ownerEmail,
        passwordHash: ownerPasswordHash,
      })
      .onConflictDoUpdate({
        target: [
          schema.authIdentities.provider,
          schema.authIdentities.providerSubject,
        ],
        set: { passwordHash: ownerPasswordHash },
      });
    console.log('✅ AuthIdentity (LOCAL) ensured for owner.');

    // 7. Ensure Tenants for Unit Owner
    const [hoa1] = await db
      .insert(schema.tenants)
      .values({ name: 'Sunset Valley HOA' })
      .returning();

    const [hoa2] = await db
      .insert(schema.tenants)
      .values({ name: 'Pine Ridge HOA' })
      .returning();

    console.log('✅ Additional HOAs created:', hoa1.name, 'and', hoa2.name);

    // 8. Ensure Memberships for Unit Owner
    const ownerMemberships = [
      {
        tenantId: hoa1.id,
        userId: ownerUser.id,
        role: 'UNIT_OWNER' as const,
        status: 'ACTIVE' as const,
      },
      {
        tenantId: hoa2.id,
        userId: ownerUser.id,
        role: 'UNIT_OWNER' as const,
        status: 'ACTIVE' as const,
      },
    ];

    for (const membership of ownerMemberships) {
      await db
        .insert(schema.tenantMemberships)
        .values(membership)
        .onConflictDoUpdate({
          target: [
            schema.tenantMemberships.tenantId,
            schema.tenantMemberships.userId,
          ],
          set: { role: 'UNIT_OWNER', status: 'ACTIVE' },
        });
    }
    console.log('✅ TenantMemberships ensured for owner.');

    console.log('🏢 Creating SVJ Slunečná 12 building structure...');

    // 5. Owners — SVJ Slunečná 12
    const insertOwner = async (displayName: string, kind: 'PERSON' | 'LEGAL_ENTITY' | 'ASSOCIATION', email?: string) => {
      const [owner] = await db
        .insert(schema.owners)
        .values({ tenantId: tenant.id, displayName, kind, email: email ?? null })
        .returning();
      return owner;
    };

    const jana = await insertOwner('Jana Dvořáková', 'PERSON', 'jana@hoa.local');   // SJM spouse A
    const petr = await insertOwner('Petr Dvořák', 'PERSON');                         // SJM spouse B
    const alena = await insertOwner('Alena Svobodová', 'PERSON', 'alena@hoa.local'); // 2/3 co-owner
    const tomas = await insertOwner('Tomáš Novák', 'PERSON');                        // 1/3 co-owner
    const mesto = await insertOwner('Město Příbram', 'LEGAL_ENTITY');
    const svjOwner = await insertOwner('SVJ Slunečná 12', 'ASSOCIATION');
    const soloOwners = [] as (typeof jana)[];
    for (const name of ['Karel Malý', 'Eva Horáková', 'Josef Beneš', 'Marie Vlková']) {
      soloOwners.push(await insertOwner(name, 'PERSON'));
    }
    console.log('✅ Created 10 owners (1 SJM pair, 1 co-ownership, 1 legal entity, 1 association, 4 solo owners)');

    // Owner accounts for QA (Jana + Alena can log in as UNIT_OWNERs)
    const qaSvjOwnerPasswordHash = await bcrypt.hash('OwnerPassword123!', 10);
    for (const person of [jana, alena]) {
      const [ownerUser] = await db
        .insert(schema.users)
        .values({ email: person.email!, fullName: person.displayName, isEmailVerified: true, isActive: true })
        .returning();
      await db.insert(schema.authIdentities).values({
        userId: ownerUser.id, provider: 'LOCAL', providerSubject: person.email!, passwordHash: qaSvjOwnerPasswordHash,
      });
      await db.insert(schema.tenantMemberships).values({
        tenantId: tenant.id, userId: ownerUser.id, role: 'UNIT_OWNER', status: 'ACTIVE',
      });
      await db.update(schema.owners).set({ userId: ownerUser.id }).where(sql`${schema.owners.id} = ${person.id}`);
    }
    console.log('✅ Created QA user accounts for Jana and Alena (UNIT_OWNER role)');

    // 6. Units — building shares over /10000, summing to exactly 1/1
    const unitShares: [string, number][] = [
      ['1', 1712], ['2', 1650], ['3', 1500], ['4', 1288],
      ['5', 1200], ['6', 1100], ['7', 950], ['8', 600],
    ];
    const units: Record<string, { id: string }> = {};
    for (const [unitNo, num] of unitShares) {
      const [unit] = await db
        .insert(schema.units)
        .values({ tenantId: tenant.id, unitNo, buildingShareNumerator: num, buildingShareDenominator: 10000 })
        .returning();
      units[unitNo] = unit;
    }
    console.log('✅ Created 8 units with building shares summing to exactly 10000/10000');

    // 7. Ownership parties
    const insertParty = async (
      unitId: string,
      partyType: 'SOLE' | 'SJM',
      shareNumerator: number,
      shareDenominator: number,
      memberIds: string[],
    ) => {
      const [party] = await db
        .insert(schema.unitOwnerships)
        .values({ tenantId: tenant.id, unitId, partyType, shareNumerator, shareDenominator })
        .returning();
      await db.insert(schema.unitOwnershipMembers).values(
        memberIds.map((ownerId) => ({ tenantId: tenant.id, ownershipId: party.id, ownerId })),
      );
    };

    await insertParty(units['1'].id, 'SJM', 1, 1, [jana.id, petr.id]);          // spouses, whole unit
    await insertParty(units['2'].id, 'SOLE', 2, 3, [alena.id]);                 // 2/3 — decimals can't say this
    await insertParty(units['2'].id, 'SOLE', 1, 3, [tomas.id]);
    await insertParty(units['3'].id, 'SOLE', 1, 1, [mesto.id]);                 // legal entity
    await insertParty(units['8'].id, 'SOLE', 1, 1, [svjOwner.id]);              // association-owned (§ 1206/1)
    for (let i = 0; i < soloOwners.length; i++) {
      await insertParty(units[String(4 + i)].id, 'SOLE', 1, 1, [soloOwners[i].id]);
    }
    console.log('✅ Created 9 ownership parties: 1 SJM, 2 co-ownership (2/3 + 1/3), 1 legal entity, 1 association, 4 sole owners');

    // 8. Votes — one per mode, both SCHEDULED (open/close them through the app)
    const day = 86_400_000;
    const now = Date.now();
    const insertVote = async (
      title: string,
      mode: 'PER_ROLLAM' | 'ASSEMBLY_RECORD',
      from: Date,
      to: Date,
      ruleset: Omit<typeof schema.voteRulesets.$inferInsert, 'tenantId' | 'voteId' | 'id'>,
    ) => {
      const [vote] = await db
        .insert(schema.votes)
        .values({
          tenantId: tenant.id, createdByMembershipId: membership.id, title,
          description: null, status: 'SCHEDULED', mode, scheduledFrom: from, scheduledTo: to,
        })
        .returning();
      await db.insert(schema.voteRulesets).values({ ...ruleset, tenantId: tenant.id, voteId: vote.id });
      const [question] = await db
        .insert(schema.voteQuestions)
        .values({ tenantId: tenant.id, voteId: vote.id, questionType: 'YES_NO', title: `${title} — otázka 1`, sortOrder: 1 })
        .returning();
      await db.insert(schema.voteOptions).values([
        { tenantId: tenant.id, questionId: question.id, label: 'YES', optionKey: 'YES', sortOrder: 1 },
        { tenantId: tenant.id, questionId: question.id, label: 'NO', optionKey: 'NO', sortOrder: 2 },
        { tenantId: tenant.id, questionId: question.id, label: 'ABSTAIN', optionKey: 'ABSTAIN', sortOrder: 3 },
      ]);
      return vote;
    };

    await insertVote('Oprava střechy (per rollam)', 'PER_ROLLAM', new Date(now + day), new Date(now + 17 * day), {
      weightBasis: 'UNIT_SHARE', quorumMeasure: null, quorumThresholdNum: null, quorumThresholdDen: null,
      quorumComparator: null, majorityRuleType: 'SIMPLE_MAJORITY', majorityDenominatorBasis: 'ALL_VOTES',
      majorityThresholdNum: 1, majorityThresholdDen: 2, majorityComparator: 'STRICT_GREATER',
      allowAbstain: true, acknowledgedNonStatutory: false,
    });
    await insertVote('Zápis ze shromáždění 2026-09', 'ASSEMBLY_RECORD', new Date(now + 2 * day), new Date(now + 3 * day), {
      weightBasis: 'UNIT_SHARE', quorumMeasure: 'UNIT_SHARE', quorumThresholdNum: 1, quorumThresholdDen: 2,
      quorumComparator: 'STRICT_GREATER', majorityRuleType: 'SIMPLE_MAJORITY', majorityDenominatorBasis: 'VOTES_CAST',
      majorityThresholdNum: 1, majorityThresholdDen: 2, majorityComparator: 'STRICT_GREATER',
      allowAbstain: true, acknowledgedNonStatutory: false,
    });
    console.log('✅ Created 2 votes: 1 PER_ROLLAM + 1 ASSEMBLY_RECORD (both SCHEDULED)');

    console.log('\n🎉 Seed complete! You can now log in with:');
    console.log('--- ADMIN ---');
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('--- MULTI-TENANT OWNER ---');
    console.log(`Email:    ${ownerEmail}`);
    console.log(`Password: ${ownerPassword}\n`);
  } catch (error) {
    console.error('❌ Seeder failed:', error);
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
