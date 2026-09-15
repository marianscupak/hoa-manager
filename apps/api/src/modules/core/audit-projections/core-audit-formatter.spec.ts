import type { AuditEventReadRecord } from '@/modules/core/audit/application/ports/audit-event-read.repository.port';
import { AuditFormatterRegistry } from '@/modules/core/audit/application/services/audit-formatter-registry';
import type { AuditEventType } from '@/modules/core/audit/domain/audit-event-types';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';

import { CoreAuditFormatter } from './core-audit-formatter';
import { CoreEventType } from './core-event-types';

function ev(partial: Partial<AuditEventReadRecord>): AuditEventReadRecord {
  return {
    id: 'event-1',
    occurredAt: new Date('2026-05-17T10:00:00Z'),
    tenantId: 'tenant-1',
    module: 'CORE',
    eventType: CoreEventType.TENANT_CREATED,
    actor: { type: 'USER', userId: 'user-1', membershipId: 'm-1' },
    aggregate: { type: 'TENANT', id: 'tenant-1' },
    entity: null,
    visibility: Visibility.TENANT_PUBLIC,
    payload: {},
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

const PAYLOADS: Record<CoreEventType, Record<string, unknown>> = {
  [CoreEventType.TENANT_CREATED]: {
    tenantName: 'Acme HOA',
    labels: { createdBy: 'Alice Admin' },
  },
  [CoreEventType.MEMBERSHIP_CREATED]: {
    userId: '11111111-1111-1111-1111-111111111111',
    role: 'UNIT_OWNER',
    status: 'ACTIVE',
    labels: { memberName: 'Bob Owner', addedBy: 'Alice Admin' },
  },
  [CoreEventType.MEMBERSHIP_ROLE_UPDATED]: {
    userId: '11111111-1111-1111-1111-111111111111',
    previousRole: 'UNIT_OWNER',
    newRole: 'BOARD_MEMBER',
    labels: { memberName: 'Bob Owner', changedBy: 'Alice Admin' },
  },
  [CoreEventType.MEMBERSHIP_STATUS_UPDATED]: {
    userId: '11111111-1111-1111-1111-111111111111',
    previousStatus: 'ACTIVE',
    newStatus: 'SUSPENDED',
    labels: { memberName: 'Bob Owner', changedBy: 'Alice Admin' },
  },
  [CoreEventType.UNIT_CREATED]: {
    unitNo: '12',
    buildingShareNumerator: 1,
    buildingShareDenominator: 10,
    labels: { unitLabel: '12', createdBy: 'Alice Admin' },
  },
  [CoreEventType.UNIT_UPDATED]: {
    previous: {
      unitNo: '11',
      buildingShareNumerator: 1,
      buildingShareDenominator: 10,
    },
    next: {
      unitNo: '12',
      buildingShareNumerator: 1,
      buildingShareDenominator: 10,
    },
    labels: { unitLabel: '12', updatedBy: 'Alice Admin' },
  },
  [CoreEventType.UNIT_DELETED]: {
    unitNo: '12',
    labels: { unitLabel: '12', deletedBy: 'Alice Admin' },
  },
  [CoreEventType.OWNER_CREATED]: {
    displayName: 'Bob Owner',
    hasEmail: true,
    linkedToUserId: null,
    labels: { ownerName: 'Bob Owner', createdBy: 'Alice Admin' },
  },
  [CoreEventType.OWNER_DELETED]: {
    labels: { ownerName: 'Bob Owner', deletedBy: 'Alice Admin' },
  },
  [CoreEventType.UNIT_OWNERSHIP_REPLACED]: {
    ownerships: [
      { ownerId: '22222222-2222-2222-2222-222222222222', share: '1.0' },
    ],
    effectiveFrom: '2026-10-01',
    labels: {
      unitLabel: '12',
      changedBy: 'Alice Admin',
      owners: ['Bob Owner'],
    },
  },
  [CoreEventType.UNIT_OWNERSHIP_TRANSFER_CANCELLED]: {
    effectiveFrom: '2026-10-01',
    ownerships: [
      {
        partyType: 'SOLE',
        share: '1/1',
        memberOwnerIds: ['22222222-2222-2222-2222-222222222222'],
      },
    ],
    labels: {
      unitLabel: '12',
      cancelledBy: 'Alice Admin',
      owners: ['Bob Owner'],
    },
  },
  [CoreEventType.OWNER_USER_LINKED]: {
    userId: '11111111-1111-1111-1111-111111111111',
    source: 'INVITE_ACCEPT',
    labels: {
      ownerName: 'Bob Owner',
      userName: 'Bob User',
      linkedBy: 'Alice Admin',
    },
  },
  [CoreEventType.OWNER_EMAIL_ADDED]: {
    labels: { ownerName: 'Bob Owner', addedBy: 'Alice Admin' },
  },
  [CoreEventType.OWNER_INVITE_SENT]: {
    inviteId: '33333333-3333-3333-3333-333333333333',
    emailHash: 'a'.repeat(64),
    labels: {
      ownerName: 'Bob Owner',
      emailMasked: 'b***@example.com',
      sentBy: 'Alice Admin',
    },
  },
  [CoreEventType.OWNER_INVITE_REVOKED]: {
    inviteId: '33333333-3333-3333-3333-333333333333',
    labels: { ownerName: 'Bob Owner', revokedBy: 'Alice Admin' },
  },
  [CoreEventType.OWNER_INVITE_ACCEPTED]: {
    userId: '11111111-1111-1111-1111-111111111111',
    flow: 'NEW_REGISTRATION',
    labels: { ownerName: 'Bob Owner', userName: 'Bob User' },
  },
  [CoreEventType.KATASTR_DATA_IMPORTED]: {
    counts: {
      unitsCreated: 38,
      unitsUpdated: 0,
      unitsUnchanged: 0,
      ownersCreated: 49,
      ownersMatched: 0,
    },
    unitNumbers: ['132/1'],
    effectiveFrom: '2024-04-08',
    document: {
      lvNumber: '33',
      municipality: 'Volary',
      cadastralArea: 'Volary',
      validAt: '2024-04-08T00:15:02.000Z',
      issuedAt: '2026-09-15T14:51:26.000Z',
      fileHash: 'abc123',
    },
    warningCodes: [],
    labels: { importedBy: 'Jan Admin' },
  },
};

describe('CoreAuditFormatter', () => {
  let formatter: CoreAuditFormatter;

  beforeEach(() => {
    formatter = new CoreAuditFormatter(new AuditFormatterRegistry());
  });

  // Coverage gate: every CoreEventType must render a non-empty, non-fallback
  // message in both English and Czech. Iterates over the union so adding a new
  // event type without a formatter case fails this spec.
  describe.each(Object.values(CoreEventType))(
    'renders %s for both languages',
    (eventType) => {
      it.each(['en', 'cs'])('language=%s', (lang) => {
        const entry = formatter.format(
          ev({ eventType, payload: PAYLOADS[eventType as CoreEventType] }),
          { ...VIEWER_ADMIN, viewerLanguage: lang },
        );
        expect(entry.message.length).toBeGreaterThan(0);
        expect(entry.message).not.toMatch(
          /Activity recorded|Aktivita zaznamenána/,
        );
      });
    },
  );

  it('renders TENANT_CREATED with the actor name (en)', () => {
    const entry = formatter.format(
      ev({
        eventType: CoreEventType.TENANT_CREATED,
        payload: PAYLOADS[CoreEventType.TENANT_CREATED],
      }),
      VIEWER_OWNER,
    );
    expect(entry.message).toContain('Alice Admin');
    expect(entry.message).toContain('community');
  });

  it('renders TENANT_CREATED in Czech', () => {
    const entry = formatter.format(
      ev({
        eventType: CoreEventType.TENANT_CREATED,
        payload: PAYLOADS[CoreEventType.TENANT_CREATED],
      }),
      { ...VIEWER_OWNER, viewerLanguage: 'cs' },
    );
    expect(entry.message).toContain('Alice Admin');
    expect(entry.message).toContain('komunitu');
  });

  it('renders MEMBERSHIP_ROLE_UPDATED with previous and new role', () => {
    const entry = formatter.format(
      ev({
        eventType: CoreEventType.MEMBERSHIP_ROLE_UPDATED,
        payload: PAYLOADS[CoreEventType.MEMBERSHIP_ROLE_UPDATED],
      }),
      VIEWER_ADMIN,
    );
    expect(entry.message).toContain('UNIT_OWNER');
    expect(entry.message).toContain('BOARD_MEMBER');
  });

  it('renders OWNER_INVITE_SENT with masked email, not raw email', () => {
    const entry = formatter.format(
      ev({
        eventType: CoreEventType.OWNER_INVITE_SENT,
        payload: PAYLOADS[CoreEventType.OWNER_INVITE_SENT],
      }),
      VIEWER_ADMIN,
    );
    expect(entry.message).toContain('b***@example.com');
    expect(entry.message).not.toContain('bob@example.com');
  });

  it('renders OWNER_INVITE_ACCEPTED as a public-friendly welcome', () => {
    const entry = formatter.format(
      ev({
        eventType: CoreEventType.OWNER_INVITE_ACCEPTED,
        payload: PAYLOADS[CoreEventType.OWNER_INVITE_ACCEPTED],
      }),
      VIEWER_OWNER,
    );
    expect(entry.message).toContain('Bob User');
    expect(entry.message).toContain('joined');
  });

  it('falls through to a generic entry for unknown event types', () => {
    const unknownEv = ev({
      eventType: 'CORE.SOMETHING_NEW' as AuditEventType,
      payload: {},
    });
    const entry = formatter.format(unknownEv, VIEWER_OWNER);
    expect(entry.message).toContain('CORE.SOMETHING_NEW');
  });

  it('sets navigateTo to /admin/units for UNIT aggregates', () => {
    const entry = formatter.format(
      ev({
        eventType: CoreEventType.UNIT_CREATED,
        aggregate: { type: 'UNIT', id: 'unit-1' },
        payload: PAYLOADS[CoreEventType.UNIT_CREATED],
      }),
      VIEWER_ADMIN,
    );
    expect(entry.navigateTo).toBe('/admin/units');
  });

  it('sets navigateTo to /admin/owners for OWNER aggregates', () => {
    const entry = formatter.format(
      ev({
        eventType: CoreEventType.OWNER_CREATED,
        aggregate: { type: 'OWNER', id: 'owner-1' },
        payload: PAYLOADS[CoreEventType.OWNER_CREATED],
      }),
      VIEWER_ADMIN,
    );
    expect(entry.navigateTo).toBe('/admin/owners');
  });

  it('sets navigateTo to /admin/users for MEMBERSHIP aggregates', () => {
    const entry = formatter.format(
      ev({
        eventType: CoreEventType.MEMBERSHIP_CREATED,
        aggregate: { type: 'MEMBERSHIP', id: 'm-1' },
        payload: PAYLOADS[CoreEventType.MEMBERSHIP_CREATED],
      }),
      VIEWER_ADMIN,
    );
    expect(entry.navigateTo).toBe('/admin/users');
  });

  it('sets navigateTo to null for TENANT aggregates', () => {
    const entry = formatter.format(
      ev({
        eventType: CoreEventType.TENANT_CREATED,
        aggregate: { type: 'TENANT', id: 'tenant-1' },
        payload: PAYLOADS[CoreEventType.TENANT_CREATED],
      }),
      VIEWER_OWNER,
    );
    expect(entry.navigateTo).toBeNull();
  });

  it('renders UNIT_OWNERSHIP_REPLACED with the effective date in Czech', () => {
    const entry = formatter.format(
      ev({
        eventType: CoreEventType.UNIT_OWNERSHIP_REPLACED,
        payload: PAYLOADS[CoreEventType.UNIT_OWNERSHIP_REPLACED],
      }),
      { ...VIEWER_ADMIN, viewerLanguage: 'cs' },
    );
    expect(entry.message).toContain('s účinností od 1. 10. 2026');
  });

  it('renders UNIT_OWNERSHIP_REPLACED with the effective date in English using the d. M. yyyy format', () => {
    const entry = formatter.format(
      ev({
        eventType: CoreEventType.UNIT_OWNERSHIP_REPLACED,
        payload: PAYLOADS[CoreEventType.UNIT_OWNERSHIP_REPLACED],
      }),
      { ...VIEWER_ADMIN, viewerLanguage: 'en' },
    );
    expect(entry.message).toContain('effective 1. 10. 2026');
  });

  it('renders UNIT_OWNERSHIP_TRANSFER_CANCELLED with the effective date in English using the d. M. yyyy format', () => {
    const entry = formatter.format(
      ev({
        eventType: CoreEventType.UNIT_OWNERSHIP_TRANSFER_CANCELLED,
        payload: PAYLOADS[CoreEventType.UNIT_OWNERSHIP_TRANSFER_CANCELLED],
      }),
      { ...VIEWER_ADMIN, viewerLanguage: 'en' },
    );
    expect(entry.message).toContain('scheduled for 1. 10. 2026');
  });

  it('falls back to the non-effective message when a pre-feature payload has no effectiveFrom', () => {
    const { effectiveFrom, ...payloadWithoutEffectiveFrom } = PAYLOADS[
      CoreEventType.UNIT_OWNERSHIP_REPLACED
    ] as { effectiveFrom: string } & Record<string, unknown>;
    void effectiveFrom;

    const csEntry = formatter.format(
      ev({
        eventType: CoreEventType.UNIT_OWNERSHIP_REPLACED,
        payload: payloadWithoutEffectiveFrom,
      }),
      { ...VIEWER_ADMIN, viewerLanguage: 'cs' },
    );
    expect(csEntry.message).toContain('12');
    expect(csEntry.message).toContain('Bob Owner');
    expect(csEntry.message).not.toContain('účinností');

    const enEntry = formatter.format(
      ev({
        eventType: CoreEventType.UNIT_OWNERSHIP_REPLACED,
        payload: payloadWithoutEffectiveFrom,
      }),
      { ...VIEWER_ADMIN, viewerLanguage: 'en' },
    );
    expect(enEntry.message).toContain('12');
    expect(enEntry.message).toContain('Bob Owner');
    expect(enEntry.message).not.toContain('effective');
  });

  it('renders the katastr import event in both languages', () => {
    const csEntry = formatter.format(
      ev({
        eventType: CoreEventType.KATASTR_DATA_IMPORTED,
        payload: PAYLOADS[CoreEventType.KATASTR_DATA_IMPORTED],
      }),
      { ...VIEWER_ADMIN, viewerLanguage: 'cs' },
    );
    expect(csEntry.message).toContain('38');
    expect(csEntry.message).not.toContain('KATASTR_DATA_IMPORTED');
    expect(csEntry.message).toContain('s účinností od 8. 4. 2024');

    const enEntry = formatter.format(
      ev({
        eventType: CoreEventType.KATASTR_DATA_IMPORTED,
        payload: PAYLOADS[CoreEventType.KATASTR_DATA_IMPORTED],
      }),
      { ...VIEWER_ADMIN, viewerLanguage: 'en' },
    );
    expect(enEntry.message).toContain('38');
    expect(enEntry.message).not.toContain('KATASTR_DATA_IMPORTED');
    expect(enEntry.message).toContain('effective 8. 4. 2024');
  });
});
