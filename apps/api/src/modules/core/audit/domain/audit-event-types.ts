/**
 * Event types are defined and registered by the module that owns them
 * (CoreEventType, VotingEventType, …); the audit core only knows their
 * shape, `MODULE.EVENT`.
 */
export type AuditEventType = `${string}.${string}`;
