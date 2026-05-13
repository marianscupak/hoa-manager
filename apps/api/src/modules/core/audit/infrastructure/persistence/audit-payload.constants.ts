/**
 * Reserved key inside audit_events.payload. The write adapter stashes the
 * SYSTEM actor's `reason` under this key (since the schema has no dedicated
 * column for it); the read adapter strips it before returning the payload to
 * consumers. The key MUST NOT appear in any consumer-facing payload.
 */
export const RESERVED_PAYLOAD_KEY = '__actor';
