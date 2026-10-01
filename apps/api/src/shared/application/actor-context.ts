/**
 * Request-scoped (CLS) slot holding who is acting: the guards record the
 * signed-in user, `SystemActorRunner` a system job. The audit trail reads it
 * when a module records an event.
 */
export const ACTOR_CLS_KEY = 'audit.actor';
