import { inet, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const auditEvents = pgTable(
  'audit_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id'),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    module: text('module').notNull(),
    eventType: text('event_type').notNull(),
    actorType: text('actor_type').notNull(),
    actorUserId: uuid('actor_user_id'),
    actorMembershipId: uuid('actor_membership_id'),
    aggregateType: text('aggregate_type'),
    aggregateId: uuid('aggregate_id'),
    entityType: text('entity_type'),
    entityId: uuid('entity_id'),
    visibility: text('visibility').notNull(),
    payload: jsonb('payload').notNull(),
    correlationId: text('correlation_id'),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
  },
  (table) => ({
    idxTenantOccurred: index('idx_audit_events_tenant_occurred').on(table.tenantId, table.occurredAt.desc()),
    idxAggregate: index('idx_audit_events_aggregate').on(
      table.tenantId,
      table.aggregateType,
      table.aggregateId,
      table.occurredAt.desc(),
    ),
    idxActorUser: index('idx_audit_events_actor_user').on(table.tenantId, table.actorUserId, table.occurredAt.desc()),
    idxEventType: index('idx_audit_events_event_type').on(table.eventType, table.occurredAt.desc()),
  }),
);
