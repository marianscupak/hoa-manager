import { BallotCastDirectAuditEvent } from './events/ballot-cast-direct.event';
import { BallotCastProxyAuditEvent } from './events/ballot-cast-proxy.event';
import { VoteClosedAuditEvent } from './events/vote-closed.event';
import { VoteConsentCreatedAuditEvent } from './events/vote-consent-created.event';
import { VoteConsentRevokedAuditEvent } from './events/vote-consent-revoked.event';
import { VoteCreatedAuditEvent } from './events/vote-created.event';
import { VoteElectorateSnapshottedAuditEvent } from './events/vote-electorate-snapshotted.event';
import { VoteOpenedAuditEvent } from './events/vote-opened.event';
import { VoteQuestionCreatedAuditEvent } from './events/vote-question-created.event';
import { VoteQuestionDeletedAuditEvent } from './events/vote-question-deleted.event';
import { VoteQuestionUpdatedAuditEvent } from './events/vote-question-updated.event';
import { VoteResultsComputedAuditEvent } from './events/vote-results-computed.event';
import { VoteRulesetSetAuditEvent } from './events/vote-ruleset-set.event';
import { VoteScheduledAuditEvent } from './events/vote-scheduled.event';
import { VoteUpdatedAuditEvent } from './events/vote-updated.event';

export const VOTING_AUDIT_EVENTS = [
  VoteCreatedAuditEvent,
  VoteUpdatedAuditEvent,
  VoteRulesetSetAuditEvent,
  VoteScheduledAuditEvent,
  VoteOpenedAuditEvent,
  VoteElectorateSnapshottedAuditEvent,
  VoteQuestionCreatedAuditEvent,
  VoteQuestionUpdatedAuditEvent,
  VoteQuestionDeletedAuditEvent,
  VoteConsentCreatedAuditEvent,
  VoteConsentRevokedAuditEvent,
  BallotCastDirectAuditEvent,
  BallotCastProxyAuditEvent,
  VoteClosedAuditEvent,
  VoteResultsComputedAuditEvent,
];
