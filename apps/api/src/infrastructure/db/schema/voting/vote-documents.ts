import { bigint, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { tenantMemberships } from '@/infrastructure/db/schema/core/tenant-memberships';
import { tenants } from '@/infrastructure/db/schema/core/tenants';
import { voteDocumentStatusEnum } from '@/infrastructure/db/schema/voting/enums';
import { votes } from '@/infrastructure/db/schema/voting/votes';

export const voteDocuments = pgTable(
  'vote_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    voteId: uuid('vote_id')
      .notNull()
      .references(() => votes.id, { onDelete: 'cascade' }),
    uploadedByMembershipId: uuid('uploaded_by_membership_id')
      .notNull()
      .references(() => tenantMemberships.id),
    fileName: text('file_name').notNull(),
    contentType: text('content_type').notNull(),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
    objectKey: text('object_key').notNull(),
    status: voteDocumentStatusEnum('status').notNull().default('PENDING'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (_table) => ({}),
);
