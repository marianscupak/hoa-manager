import * as bcrypt from 'bcrypt';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';

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
    await db.execute(sql`TRUNCATE TABLE users, tenants CASCADE;`);
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
    await db
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
      });

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
