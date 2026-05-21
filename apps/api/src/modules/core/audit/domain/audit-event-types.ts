import type { VotingEventType } from '@/modules/voting/audit/voting-event-types';
import type { CoreEventType } from '@/modules/core/audit-projections/core-event-types';

export type AuditEventType = VotingEventType | CoreEventType;
