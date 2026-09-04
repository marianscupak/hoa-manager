import {
  ASSOCIATION_TIME_ZONE,
  formatAssociationDate,
  parseAssociationDate,
} from './association-date';

describe('parseAssociationDate', () => {
  it('is Europe/Prague', () => {
    expect(ASSOCIATION_TIME_ZONE).toBe('Europe/Prague');
  });

  it('maps a summer date to Prague midnight (UTC+2)', () => {
    expect(parseAssociationDate('2026-10-01')?.toISOString()).toBe(
      '2026-09-30T22:00:00.000Z',
    );
  });

  it('maps a winter date to Prague midnight (UTC+1)', () => {
    expect(parseAssociationDate('2026-01-15')?.toISOString()).toBe(
      '2026-01-14T23:00:00.000Z',
    );
  });

  it('rejects impossible calendar dates', () => {
    expect(parseAssociationDate('2026-02-30')).toBeNull();
    expect(parseAssociationDate('2026-13-01')).toBeNull();
  });

  it('rejects anything that is not YYYY-MM-DD', () => {
    expect(parseAssociationDate('01.10.2026')).toBeNull();
    expect(parseAssociationDate('2026-10-01T00:00:00Z')).toBeNull();
    expect(parseAssociationDate('')).toBeNull();
  });
});

describe('formatAssociationDate', () => {
  it('is the inverse of parseAssociationDate', () => {
    expect(formatAssociationDate(new Date('2026-09-30T22:00:00.000Z'))).toBe(
      '2026-10-01',
    );
    expect(formatAssociationDate(new Date('2026-01-14T23:00:00.000Z'))).toBe(
      '2026-01-15',
    );
  });

  it('reports the Prague calendar day, not the UTC one', () => {
    expect(formatAssociationDate(new Date('2026-06-30T23:30:00.000Z'))).toBe(
      '2026-07-01',
    );
  });
});
