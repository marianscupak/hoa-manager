import { parseStudySeedArgs } from './cli';

describe('parseStudySeedArgs', () => {
  it('parses a seed run and normalizes id and email', () => {
    expect(
      parseStudySeedArgs([
        '--participant',
        'p3',
        '--email',
        ' Jan.Novak@Example.com ',
        '--name',
        'Jan Novák',
      ]),
    ).toEqual({
      mode: 'seed',
      participantId: 'P3',
      email: 'jan.novak@example.com',
      name: 'Jan Novák',
      force: false,
    });
  });

  it('defaults the participant name and honours --force', () => {
    expect(
      parseStudySeedArgs(['--participant', 'P4', '--email', 'a@b.cz', '--force']),
    ).toEqual({
      mode: 'seed',
      participantId: 'P4',
      email: 'a@b.cz',
      name: 'Účastník P4',
      force: true,
    });
  });

  it('parses phase two', () => {
    expect(parseStudySeedArgs(['--open', 'p2'])).toEqual({
      mode: 'open',
      participantId: 'P2',
    });
  });

  it('parses cleanup with and without the participant email', () => {
    expect(parseStudySeedArgs(['--cleanup', 'P5'])).toEqual({
      mode: 'cleanup',
      participantId: 'P5',
      email: null,
    });
    expect(parseStudySeedArgs(['--cleanup', 'P5', '--email', 'X@Y.cz'])).toEqual(
      { mode: 'cleanup', participantId: 'P5', email: 'x@y.cz' },
    );
  });

  it('parses --help', () => {
    expect(parseStudySeedArgs(['--help'])).toEqual({ mode: 'help' });
  });

  it('rejects a seed run without --email', () => {
    expect(() => parseStudySeedArgs(['--participant', 'P1'])).toThrow(
      /--email is required/,
    );
  });

  it('rejects an invalid email', () => {
    expect(() =>
      parseStudySeedArgs(['--participant', 'P1', '--email', 'nope']),
    ).toThrow(/not a valid email/);
  });

  it('rejects more than one mode', () => {
    expect(() =>
      parseStudySeedArgs(['--participant', 'P1', '--cleanup', 'P1']),
    ).toThrow(/exactly one of/);
  });

  it('rejects no mode and unknown flags', () => {
    expect(() => parseStudySeedArgs([])).toThrow(/exactly one of/);
    expect(() => parseStudySeedArgs(['--bogus'])).toThrow();
  });
});
