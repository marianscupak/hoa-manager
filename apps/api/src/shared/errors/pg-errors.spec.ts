import { DrizzleQueryError } from 'drizzle-orm/errors';
import { DatabaseError } from 'pg';

import { isUniqueViolation } from '@/shared/errors/pg-errors';

/**
 * Builds the real `pg` error rather than a hand-rolled `{ code }` shape, so
 * these tests keep working against the driver rather than against our idea of
 * it.
 */
function pgError(code: string): DatabaseError {
  const error = new DatabaseError(
    'duplicate key value violates unique constraint',
    1,
    'error',
  );
  error.code = code;
  return error;
}

describe('isUniqueViolation', () => {
  it('detects a unique violation that drizzle has wrapped', () => {
    // Drizzle >= 0.44 wraps every driver error and puts the original on
    // `.cause`, which is why a shallow `err.code` check never matched.
    const wrapped = new DrizzleQueryError(
      'insert into "units" ...',
      [],
      pgError('23505'),
    );

    expect(isUniqueViolation(wrapped)).toBe(true);
  });

  it('detects a unique violation that reaches us unwrapped', () => {
    expect(isUniqueViolation(pgError('23505'))).toBe(true);
  });

  it('ignores a foreign key violation drizzle has wrapped', () => {
    const wrapped = new DrizzleQueryError(
      'insert into "units" ...',
      [],
      pgError('23503'),
    );

    expect(isUniqueViolation(wrapped)).toBe(false);
  });

  it('ignores an unrelated error', () => {
    expect(isUniqueViolation(new Error('connection terminated'))).toBe(false);
  });

  it('ignores a value that is not an error at all', () => {
    expect(isUniqueViolation(undefined)).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation('23505')).toBe(false);
  });
});
