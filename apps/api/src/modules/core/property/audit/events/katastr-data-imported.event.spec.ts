import { KatastrDataImportedAuditEvent } from './katastr-data-imported.event';

function validPayload(): Record<string, unknown> {
  return {
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
  };
}

describe('KatastrDataImportedAuditEvent payload contract', () => {
  it('accepts a well-formed payload', () => {
    expect(() =>
      KatastrDataImportedAuditEvent.descriptor.payloadSchema.parse(
        validPayload(),
      ),
    ).not.toThrow();
  });

  // audit.service.ts calls payloadSchema.parse(event.payload) but discards
  // the return value — the object that reaches the repository is the
  // *original* payload, not a stripped one. Without `.strict()`, an
  // accidental extra field (e.g. document text that slipped in during
  // parsing) would validate cleanly and be persisted into the audit trail
  // forever. `.strict()` is what turns that into a thrown error instead.
  it('rejects a payload with an extra field inside document', () => {
    const payload = validPayload();
    (payload.document as Record<string, unknown>).ownerName = 'Jana Nováková';

    expect(() =>
      KatastrDataImportedAuditEvent.descriptor.payloadSchema.parse(payload),
    ).toThrow();
  });

  it('rejects a payload with an extra top-level field', () => {
    const payload = { ...validPayload(), fileName: 'extract.xml' };

    expect(() =>
      KatastrDataImportedAuditEvent.descriptor.payloadSchema.parse(payload),
    ).toThrow();
  });

  it('rejects a warning code outside the three the differ/parser can produce', () => {
    const payload = { ...validPayload(), warningCodes: ['SOMETHING_NEW'] };

    expect(() =>
      KatastrDataImportedAuditEvent.descriptor.payloadSchema.parse(payload),
    ).toThrow();
  });

  it('accepts the three known warning codes', () => {
    const payload = {
      ...validPayload(),
      warningCodes: ['IMPLIED_FULL_SHARE', 'NAME_MATCH', 'KIND_MISMATCH'],
    };

    expect(() =>
      KatastrDataImportedAuditEvent.descriptor.payloadSchema.parse(payload),
    ).not.toThrow();
  });
});
