export type AuditActor =
  | { type: 'USER'; userId: string; membershipId: string | null }
  | { type: 'SYSTEM'; reason: string };
