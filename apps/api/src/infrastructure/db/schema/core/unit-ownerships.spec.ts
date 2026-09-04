import { PgDialect } from 'drizzle-orm/pg-core';

import { ownershipActiveAt, ownershipActiveAtSql } from './unit-ownerships';

const dialect = new PgDialect();
const NOW = new Date('2026-10-01T00:00:00Z');

describe('ownershipActiveAt', () => {
  it('requires valid_from at or before now and valid_to null or after now', () => {
    const q = dialect.sqlToQuery(ownershipActiveAt(NOW));
    expect(q.sql).toMatch(/"valid_from" <= \$1/);
    expect(q.sql).toMatch(/"valid_to" is null/);
    expect(q.sql).toMatch(/"valid_to" > \$2/);
    expect(q.params).toEqual([NOW, NOW]);
  });
});

describe('ownershipActiveAtSql', () => {
  it('spells the same predicate with an explicit table prefix for correlated subqueries', () => {
    const q = dialect.sqlToQuery(ownershipActiveAtSql(NOW));
    expect(q.sql).toMatch(/"unit_ownerships"\.valid_from <= \$1/);
    expect(q.sql).toMatch(/"unit_ownerships"\.valid_to IS NULL/);
    expect(q.sql).toMatch(/"unit_ownerships"\.valid_to > \$2/);
    expect(q.params).toEqual([NOW, NOW]);
  });
});
