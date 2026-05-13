import type { AuditEventReadRecord } from '@/modules/core/audit/application/ports/audit-event-read.repository.port';
import { VisibilityPolicyService } from '@/modules/core/audit/application/services/visibility-policy.service';
import type { AuditEventType } from '@/modules/core/audit/domain/audit-event-types';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';
import { VotingEventType } from '@/modules/voting/audit/voting-event-types';

import { VotingTimelineProjector } from './voting-timeline.projector';

function ev(partial: Partial<AuditEventReadRecord>): AuditEventReadRecord {
  return {
    id: 'event-1',
    occurredAt: new Date('2026-05-13T10:00:00Z'),
    tenantId: 'tenant-1',
    module: 'VOTING',
    eventType: VotingEventType.VOTE_OPENED,
    actor: { type: 'USER', userId: 'user-1', membershipId: 'm-1' },
    aggregate: { type: 'VOTE', id: 'vote-1' },
    entity: null,
    visibility: Visibility.TENANT_PUBLIC,
    payload: {
      openedAt: '2026-05-13T10:00:00Z',
      electorateSize: 5,
      labels: { voteTitle: 'Bylaws change', openedBy: 'John Doe' },
    },
    correlationId: null,
    ipAddress: null,
    userAgent: null,
    ...partial,
  };
}

const VIEWER_OWNER = {
  viewerUserId: 'viewer-1',
  viewerRoles: [TenantMembershipRole.UNIT_OWNER],
  viewerLanguage: 'en',
};

const VIEWER_ADMIN = {
  viewerUserId: 'admin-1',
  viewerRoles: [TenantMembershipRole.ADMIN],
  viewerLanguage: 'en',
};

describe('VotingTimelineProjector', () => {
  let projector: VotingTimelineProjector;

  beforeEach(() => {
    projector = new VotingTimelineProjector(new VisibilityPolicyService());
  });

  it('renders VOTE_OPENED for any viewer (public event)', () => {
    const entries = projector.project([ev({})], VIEWER_OWNER);
    expect(entries).toHaveLength(1);
    expect(entries[0].message).toContain('Bylaws change');
  });

  it('renders messages in Czech when viewer language is cs', () => {
    const entries = projector.project([ev({})], {
      ...VIEWER_OWNER,
      viewerLanguage: 'cs',
    });
    expect(entries[0].message).toContain('Hlasování');
    expect(entries[0].message).toContain('Bylaws change');
  });

  it('renders BALLOT_CAST as self-message when viewer is the actor', () => {
    const ballotEv = ev({
      eventType: VotingEventType.BALLOT_CAST_DIRECT,
      visibility: Visibility.TENANT_PRIVILEGED,
      actor: { type: 'USER', userId: 'voter-1', membershipId: 'm-1' },
      payload: {
        unitId: 'u-1',
        answers: [],
        labels: {
          voteTitle: 'Bylaws',
          unitLabel: '12',
          castBy: 'Voter Name',
          answers: [],
        },
      },
    });
    const entries = projector.project([ballotEv], {
      ...VIEWER_OWNER,
      viewerUserId: 'voter-1',
    });
    expect(entries[0].message).toBe('Your ballot was recorded.');
    expect(entries[0].details).toBeUndefined();
  });

  it('renders BALLOT_CAST as privileged-message for ADMIN viewer', () => {
    const ballotEv = ev({
      eventType: VotingEventType.BALLOT_CAST_DIRECT,
      visibility: Visibility.TENANT_PRIVILEGED,
      actor: { type: 'USER', userId: 'voter-1', membershipId: 'm-1' },
      payload: {
        unitId: 'u-1',
        answers: [{ questionId: 'q-1', optionId: 'o-1' }],
        labels: {
          voteTitle: 'Bylaws',
          unitLabel: '12',
          castBy: 'Voter Name',
          answers: [{ questionText: 'Q1?', optionText: 'Yes' }],
        },
      },
    });
    const entries = projector.project([ballotEv], VIEWER_ADMIN);
    expect(entries[0].message).toContain('Voter Name');
    expect(entries[0].message).toContain('12');
    expect(entries[0].details).toEqual({
      answers: [{ questionText: 'Q1?', optionText: 'Yes' }],
    });
  });

  it('falls through to a generic entry for unknown event types', () => {
    const unknownEv = ev({
      eventType: 'VOTING.SOMETHING_NEW' as AuditEventType,
      payload: {},
    });
    const entries = projector.project([unknownEv], VIEWER_OWNER);
    expect(entries[0].message).toContain('VOTING.SOMETHING_NEW');
  });

  // Smoke test: every defined event type renders a non-empty message for a
  // privileged viewer with sensible payload labels. Guards against future
  // additions to VotingEventType that someone forgets to add a switch case for.
  describe.each([
    [
      VotingEventType.VOTE_CREATED,
      { title: 'X', description: null, labels: { voteTitle: 'X', createdBy: 'Author' } },
    ],
    [
      VotingEventType.VOTE_RULESET_SET,
      { ruleset: {}, labels: { voteTitle: 'X', setBy: 'Author' } },
    ],
    [
      VotingEventType.VOTE_SCHEDULED,
      {
        scheduledFrom: '2026-05-13T10:00:00Z',
        scheduledTo: '2026-05-14T10:00:00Z',
        labels: { voteTitle: 'X', scheduledBy: 'Author' },
      },
    ],
    [
      VotingEventType.VOTE_OPENED,
      { openedAt: '2026-05-13T10:00:00Z', electorateSize: 1, labels: { voteTitle: 'X', openedBy: 'Author' } },
    ],
    [
      VotingEventType.VOTE_ELECTORATE_SNAPSHOTTED,
      { totalUnits: 1, totalWeight: 1, labels: { voteTitle: 'X' } },
    ],
    [
      VotingEventType.BALLOT_CAST_PROXY,
      {
        unitId: 'u-1',
        representedMembershipId: 'm-2',
        answers: [],
        labels: {
          voteTitle: 'X',
          unitLabel: '1',
          castBy: 'Author',
          representedLabel: 'Other',
          answers: [],
        },
      },
    ],
    [
      VotingEventType.VOTE_CLOSED,
      { closedAt: '2026-05-13T10:00:00Z', labels: { voteTitle: 'X', closedBy: 'Author' } },
    ],
    [
      VotingEventType.VOTE_RESULTS_COMPUTED,
      {
        quorumReached: true,
        questions: [],
        labels: { voteTitle: 'X', questions: [] },
      },
    ],
  ])('every event type renders a non-empty message: %s', (eventType, payload) => {
    it('renders', () => {
      const entry = projector.project(
        [ev({ eventType, payload })],
        VIEWER_ADMIN,
      )[0];
      expect(entry.message.length).toBeGreaterThan(0);
      expect(entry.message).not.toContain('Activity recorded'); // i.e. it took a typed branch, not the unknown fallback
    });
  });

  describe('VOTE_CONSENT_CREATED', () => {
    const basePayload = {
      consentId: 'c-1',
      unitId: 'u-1',
      ownerMembershipId: 'owner-m-1',
      delegateMembershipId: 'delegate-m-1',
      labels: {
        voteTitle: 'Bylaws',
        unitLabel: '12',
        owner: 'Bob',
        delegate: 'Carol',
        actor: 'Alice (board)',
      },
    };

    it('renders self variant when actor recorded their own consent (en)', () => {
      const e = ev({
        eventType: VotingEventType.VOTE_CONSENT_CREATED,
        visibility: Visibility.TENANT_PRIVILEGED,
        payload: { ...basePayload, recordedByMembershipId: 'owner-m-1' },
      });
      const entry = projector.project([e], VIEWER_ADMIN)[0];
      expect(entry.message).toBe('Bob delegated unit 12 to Carol.');
    });

    it('renders byRecorder variant when admin recorded on behalf (en)', () => {
      const e = ev({
        eventType: VotingEventType.VOTE_CONSENT_CREATED,
        visibility: Visibility.TENANT_PRIVILEGED,
        payload: { ...basePayload, recordedByMembershipId: 'admin-m-1' },
      });
      const entry = projector.project([e], VIEWER_ADMIN)[0];
      expect(entry.message).toBe(
        'Alice (board) recorded a delegation of unit 12 from Bob to Carol.',
      );
    });

    it('renders byRecorder variant in Czech', () => {
      const e = ev({
        eventType: VotingEventType.VOTE_CONSENT_CREATED,
        visibility: Visibility.TENANT_PRIVILEGED,
        payload: { ...basePayload, recordedByMembershipId: 'admin-m-1' },
      });
      const entry = projector.project([e], { ...VIEWER_ADMIN, viewerLanguage: 'cs' })[0];
      expect(entry.message).toBe(
        'Alice (board) zaznamenal/a delegaci jednotky 12 z Bob na Carol.',
      );
    });

    it('falls back to legacy privileged string when recordedByMembershipId is absent (historic event)', () => {
      const e = ev({
        eventType: VotingEventType.VOTE_CONSENT_CREATED,
        visibility: Visibility.TENANT_PRIVILEGED,
        payload: basePayload,
      });
      const entry = projector.project([e], VIEWER_ADMIN)[0];
      expect(entry.message).toBe('Bob delegated unit 12 to Carol.');
    });
  });

  describe('VOTE_CONSENT_REVOKED', () => {
    const basePayload = {
      consentId: 'c-1',
      unitId: 'u-1',
      ownerMembershipId: 'owner-m-1',
      delegateMembershipId: 'delegate-m-1',
      labels: {
        voteTitle: 'Bylaws',
        unitLabel: '12',
        owner: 'Bob',
        delegate: 'Carol',
        actor: 'Alice (board)',
      },
    };

    it('renders self variant when owner revoked their own delegation (en)', () => {
      const e = ev({
        eventType: VotingEventType.VOTE_CONSENT_REVOKED,
        visibility: Visibility.TENANT_PRIVILEGED,
        payload: { ...basePayload, revokedByMembershipId: 'owner-m-1' },
      });
      const entry = projector.project([e], VIEWER_ADMIN)[0];
      expect(entry.message).toBe('Bob revoked the delegation of unit 12 to Carol.');
    });

    it('renders byRecorder variant when admin revoked on behalf (en)', () => {
      const e = ev({
        eventType: VotingEventType.VOTE_CONSENT_REVOKED,
        visibility: Visibility.TENANT_PRIVILEGED,
        payload: { ...basePayload, revokedByMembershipId: 'admin-m-1' },
      });
      const entry = projector.project([e], VIEWER_ADMIN)[0];
      expect(entry.message).toBe(
        'Alice (board) revoked the delegation of unit 12 from Bob to Carol.',
      );
    });

    it('renders byRecorder variant in Czech', () => {
      const e = ev({
        eventType: VotingEventType.VOTE_CONSENT_REVOKED,
        visibility: Visibility.TENANT_PRIVILEGED,
        payload: { ...basePayload, revokedByMembershipId: 'admin-m-1' },
      });
      const entry = projector.project([e], { ...VIEWER_ADMIN, viewerLanguage: 'cs' })[0];
      expect(entry.message).toBe(
        'Alice (board) zrušil/a delegaci jednotky 12 z Bob na Carol.',
      );
    });

    it('falls back to legacy privileged string when revokedByMembershipId is absent (historic event)', () => {
      const e = ev({
        eventType: VotingEventType.VOTE_CONSENT_REVOKED,
        visibility: Visibility.TENANT_PRIVILEGED,
        payload: basePayload,
      });
      const entry = projector.project([e], VIEWER_ADMIN)[0];
      expect(entry.message).toBe('Alice (board) revoked the delegation for unit 12.');
    });
  });
});
