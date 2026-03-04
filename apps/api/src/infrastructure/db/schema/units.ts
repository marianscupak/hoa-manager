import {
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
  unique,
} from 'drizzle-orm/pg-core';

import { tenants } from '@/infrastructure/db/schema/tenants';

export const units = pgTable(
  'units',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    unitNo: text('unit_no').notNull(),
    buildingShare: numeric('building_share', {
      precision: 12,
      scale: 8,
    }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    uniqueTenantUnit: unique('units_tenant_unit_no_unique').on(
      table.tenantId,
      table.unitNo,
    ),
  }),
);
