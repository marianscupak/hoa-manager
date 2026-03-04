import { pgTable, timestamp, uuid, numeric, index } from 'drizzle-orm/pg-core';

import { owners } from '@/infrastructure/db/schema/owners';
import { tenants } from '@/infrastructure/db/schema/tenants';
import { units } from '@/infrastructure/db/schema/units';

export const unitOwnerships = pgTable(
  'unit_ownerships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    unitId: uuid('unit_id')
      .notNull()
      .references(() => units.id, { onDelete: 'cascade' }),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => owners.id, { onDelete: 'cascade' }),
    share: numeric('share', { precision: 12, scale: 8 }).notNull(),
    validFrom: timestamp('valid_from', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    validTo: timestamp('valid_to', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tenantUnitIdx: index('unit_ownerships_tenant_unit_idx').on(
      table.tenantId,
      table.unitId,
    ),
    tenantOwnerIdx: index('unit_ownerships_tenant_owner_idx').on(
      table.tenantId,
      table.ownerId,
    ),
  }),
);
