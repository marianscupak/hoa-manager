import { bigint, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { tenantMemberships } from '@/infrastructure/db/schema/core/tenant-memberships';
import { tenants } from '@/infrastructure/db/schema/core/tenants';
import {
  voteDocumentKindEnum,
  voteDocumentStatusEnum,
} from '@/infrastructure/db/schema/voting/enums';
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
    /**
     * `VOTE` documents are the vote's public attachments, listed on the
     * detail page for every owner. `BALLOT` documents are scans of signed
     * paper ballots — privileged, and deliberately excluded from that list
     * and from the per-vote document budget.
     */
    kind: voteDocumentKindEnum('kind').notNull().default('VOTE'),
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
