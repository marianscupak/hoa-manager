import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  unique,
} from 'drizzle-orm/pg-core';

import { tenants } from '@/infrastructure/db/schema/core/tenants';

export const units = pgTable(
  'units',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    unitNo: text('unit_no').notNull(),
    buildingShareNumerator: integer('building_share_numerator').notNull(),
    buildingShareDenominator: integer('building_share_denominator').notNull(),
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
