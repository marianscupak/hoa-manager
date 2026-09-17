import {
  classifyVotesInRange,
  validatePeriodBounds,
} from './ownership-period-bounds';

const d = (iso: string) => new Date(iso);

describe('validatePeriodBounds', () => {
  it('accepts an open-ended period that starts after every other one', () => {
    expect(
      validatePeriodBounds({ validFrom: d('2026-06-01'), validTo: null }, [
        { validFrom: d('2025-01-01'), validTo: d('2026-06-01') },
      ]),
    ).toBeNull();
  });

  it('rejects an end that is not after the start', () => {
    expect(
      validatePeriodBounds(
        { validFrom: d('2026-06-01'), validTo: d('2026-06-01') },
        [],
      ),
    ).toBe('END_BEFORE_START');
  });

  it('accepts periods that meet exactly, because the interval excludes its end', () => {
    // [2025-01-01, 2026-06-01) and [2026-06-01, ∞) share no instant.
    expect(
      validatePeriodBounds({ validFrom: d('2026-06-01'), validTo: null }, [
        { validFrom: d('2025-01-01'), validTo: d('2026-06-01') },
      ]),
    ).toBeNull();
  });

  it('rejects a start that falls inside another period', () => {
    expect(
      validatePeriodBounds({ validFrom: d('2025-06-01'), validTo: null }, [
        { validFrom: d('2025-01-01'), validTo: d('2026-01-01') },
      ]),
    ).toBe('OVERLAPS_ANOTHER_PERIOD');
  });

  it('rejects an open end that swallows a later period', () => {
    expect(
      validatePeriodBounds({ validFrom: d('2024-01-01'), validTo: null }, [
        { validFrom: d('2025-01-01'), validTo: d('2026-01-01') },
      ]),
    ).toBe('OVERLAPS_ANOTHER_PERIOD');
  });
});

describe('classifyVotesInRange', () => {
  const range = { from: d('2026-01-01'), to: d('2026-12-31') };

  it('flags a draft assembly record inside the range as live', () => {
    const [vote] = classifyVotesInRange(range, [
      {
        voteId: 'v1',
        title: 'Shromáždění 2026',
        mode: 'ASSEMBLY_RECORD',
        published: false,
        relevantAt: d('2026-05-05'),
      },
    ]);

    // Its electorate is read from the register as of the meeting date, so it
    // moves the moment the register does.
    expect(vote).toMatchObject({ voteId: 'v1', impact: 'LIVE' });
  });

  it('flags a published vote inside the range as frozen', () => {
    const [vote] = classifyVotesInRange(range, [
      {
        voteId: 'v2',
        title: 'Oprava střechy',
        mode: 'PER_ROLLAM',
        published: true,
        relevantAt: d('2026-05-05'),
      },
    ]);

    // The electorate was snapshotted, so the result stands; only the register
    // and the snapshot stop agreeing.
    expect(vote).toMatchObject({ voteId: 'v2', impact: 'FROZEN' });
  });

  it('leaves out votes whose date falls outside the range', () => {
    expect(
      classifyVotesInRange(range, [
        {
          voteId: 'v3',
          title: 'Loňské hlasování',
          mode: 'PER_ROLLAM',
          published: true,
          relevantAt: d('2025-05-05'),
        },
      ]),
    ).toEqual([]);
  });

  it('treats an open-ended range as reaching into the future', () => {
    const votes = classifyVotesInRange({ from: d('2026-01-01'), to: null }, [
      {
        voteId: 'v4',
        title: 'Budoucí shromáždění',
        mode: 'ASSEMBLY_RECORD',
        published: false,
        relevantAt: d('2030-01-01'),
      },
    ]);

    expect(votes).toHaveLength(1);
  });
});
