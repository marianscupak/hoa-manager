import { BallotCastDirectAuditEvent } from './events/ballot-cast-direct.event';
import { BallotCastProxyAuditEvent } from './events/ballot-cast-proxy.event';
import { VoteClosedAuditEvent } from './events/vote-closed.event';
import { VoteCreatedAuditEvent } from './events/vote-created.event';
import { VoteElectorateSnapshottedAuditEvent } from './events/vote-electorate-snapshotted.event';
import { VoteOpenedAuditEvent } from './events/vote-opened.event';
import { VoteResultsComputedAuditEvent } from './events/vote-results-computed.event';
import { VoteRulesetSetAuditEvent } from './events/vote-ruleset-set.event';
import { VoteScheduledAuditEvent } from './events/vote-scheduled.event';

export const VOTING_AUDIT_EVENTS = [
  VoteCreatedAuditEvent,
  VoteRulesetSetAuditEvent,
  VoteScheduledAuditEvent,
  VoteOpenedAuditEvent,
  VoteElectorateSnapshottedAuditEvent,
  BallotCastDirectAuditEvent,
  BallotCastProxyAuditEvent,
  VoteClosedAuditEvent,
  VoteResultsComputedAuditEvent,
];
