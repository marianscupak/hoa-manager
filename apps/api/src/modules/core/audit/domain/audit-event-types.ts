import type { VotingEventType } from '@/modules/voting/audit/voting-event-types';

export type AuditEventType = VotingEventType;
// As future modules adopt audit, expand: | AuthEventType | TenancyEventType, etc.
