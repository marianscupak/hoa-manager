/** Postgres SQLSTATE for a unique constraint violation. */
const UNIQUE_VIOLATION = '23505';

/** Guards against a self-referencing `cause` chain. */
const MAX_CAUSE_DEPTH = 10;

/**
 * Tells whether an error — at any depth — is a Postgres unique constraint
 * violation.
 *
 * Drizzle (>= 0.44) wraps every driver error in `DrizzleQueryError` and hangs
 * the original `pg` error off `.cause`, so the SQLSTATE has to be looked for
 * along the whole chain rather than on the error we were handed. A shallow
 * `err.code === '23505'` check silently stopped matching when that wrapping
 * landed, turning every duplicate into a generic 500.
 */
export function isUniqueViolation(err: unknown): boolean {
  let current: unknown = err;

  for (let depth = 0; current != null && depth < MAX_CAUSE_DEPTH; depth++) {
    if (typeof current !== 'object') {
      return false;
    }
    if ((current as { code?: unknown }).code === UNIQUE_VIOLATION) {
      return true;
    }
    current = (current as { cause?: unknown }).cause;
  }

  return false;
}
