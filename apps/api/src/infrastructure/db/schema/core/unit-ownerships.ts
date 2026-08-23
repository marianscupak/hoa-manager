import {
  pgTable,
  timestamp,
  uuid,
  integer,
  index,
  pgEnum,
  unique,
} from 'drizzle-orm/pg-core';

import { owners } from '@/infrastructure/db/schema/core/owners';
import { tenants } from '@/infrastructure/db/schema/core/tenants';
import { units } from '@/infrastructure/db/schema/core/units';

export const ownershipPartyTypeEnum = pgEnum('ownership_party_type', [
  'SOLE',
  'SJM',
]);

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
    partyType: ownershipPartyTypeEnum('party_type').notNull(),
    shareNumerator: integer('share_numerator').notNull(),
    shareDenominator: integer('share_denominator').notNull(),
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
  }),
);

export const unitOwnershipMembers = pgTable(
  'unit_ownership_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    ownershipId: uuid('ownership_id')
      .notNull()
      .references(() => unitOwnerships.id, { onDelete: 'cascade' }),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => owners.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    unqOwnershipOwner: unique('unq_unit_ownership_members_ownership_owner').on(
      table.ownershipId,
      table.ownerId,
    ),
    tenantOwnerIdx: index('unit_ownership_members_tenant_owner_idx').on(
      table.tenantId,
      table.ownerId,
    ),
  }),
);
