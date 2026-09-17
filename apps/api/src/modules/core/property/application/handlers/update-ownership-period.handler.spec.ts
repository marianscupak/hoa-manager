import { UpdateOwnershipPeriodCommand } from '@/modules/core/property/application/commands/update-ownership-period.command';

import { UpdateOwnershipPeriodHandler } from './update-ownership-period.handler';

const TENANT = 't1';
const UNIT = 'u1';
const d = (iso: string) => new Date(iso);

const CURRENT = d('2026-01-01');
const OTHER_PERIOD = { validFrom: d('2024-01-01'), validTo: d('2026-01-01') };

function buildHandler(overrides?: {
  parties?: { id: string; validFrom: Date; validTo: Date | null }[];
  votes?: unknown[];
}) {
  const parties = overrides?.parties ?? [
    { id: 'p1', validFrom: CURRENT, validTo: null },
    { id: 'p2', validFrom: CURRENT, validTo: null },
    {
      id: 'p0',
      validFrom: OTHER_PERIOD.validFrom,
      validTo: OTHER_PERIOD.validTo,
    },
  ];
  const ownershipRepo = {
    listByUnit: jest.fn().mockResolvedValue(parties),
    setPeriodBounds: jest.fn(),
  };
  const voteLookup = {
    findVotes: jest.fn().mockResolvedValue(overrides?.votes ?? []),
  };
  const unitRepo = {
    findById: jest.fn().mockResolvedValue({ id: UNIT, unitNo: '1' }),
  };
  const uow = { execute: jest.fn((fn: () => Promise<void>) => fn()) };
  const clock = { now: () => d('2026-09-17T10:00:00Z') };
  const auditService = { append: jest.fn() };
  const auditContext = {
    requireActor: jest.fn().mockReturnValue({ type: 'USER', userId: 'admin' }),
  };
  const labelResolver = {
    resolveActorLabel: jest.fn().mockResolvedValue('Admin'),
  };
  const handler = new UpdateOwnershipPeriodHandler(
    ownershipRepo as never,
    unitRepo as never,
    voteLookup as never,
    clock as never,
    uow as never,
    auditService as never,
    auditContext as never,
    labelResolver as never,
  );
  return { handler, ownershipRepo, auditService };
}

const command = (
  over?: Partial<{
    validFrom: Date;
    validTo: Date | null;
    acknowledged: boolean;
  }>,
) =>
  new UpdateOwnershipPeriodCommand(
    TENANT,
    UNIT,
    CURRENT,
    over?.validFrom ?? d('2026-03-01'),
    over?.validTo === undefined ? null : over.validTo,
    over?.acknowledged ?? false,
  );

describe('UpdateOwnershipPeriodHandler', () => {
  it('moves every party of the period, not just one of them', async () => {
    const { handler, ownershipRepo } = buildHandler();

    await handler.execute(command());

    // p1 and p2 share the period; p0 belongs to the one before it.
    expect(ownershipRepo.setPeriodBounds).toHaveBeenCalledWith(
      TENANT,
      ['p1', 'p2'],
      d('2026-03-01'),
      null,
    );
  });

  it('closes an open period when an end is given', async () => {
    const { handler, ownershipRepo } = buildHandler();

    await handler.execute(
      command({ validFrom: CURRENT, validTo: d('2026-08-01') }),
    );

    expect(ownershipRepo.setPeriodBounds).toHaveBeenCalledWith(
      TENANT,
      ['p1', 'p2'],
      CURRENT,
      d('2026-08-01'),
    );
  });

  it('rejects bounds that overlap the period before it', async () => {
    const { handler, ownershipRepo } = buildHandler();

    await expect(
      handler.execute(command({ validFrom: d('2025-06-01') })),
    ).rejects.toMatchObject({ code: 'OWNERSHIP_PERIOD_OVERLAPS' });
    expect(ownershipRepo.setPeriodBounds).not.toHaveBeenCalled();
  });

  it('rejects an end that is not after the start', async () => {
    const { handler, ownershipRepo } = buildHandler();

    await expect(
      handler.execute(
        command({ validFrom: d('2026-03-01'), validTo: d('2026-03-01') }),
      ),
    ).rejects.toMatchObject({ code: 'OWNERSHIP_PERIOD_END_BEFORE_START' });
    expect(ownershipRepo.setPeriodBounds).not.toHaveBeenCalled();
  });

  it('refuses until the board acknowledges the votes the move reaches', async () => {
    const { handler, ownershipRepo } = buildHandler({
      votes: [
        {
          voteId: 'v1',
          title: 'Shromáždění 2026',
          mode: 'ASSEMBLY_RECORD',
          published: false,
          relevantAt: d('2026-05-05'),
        },
      ],
    });

    await expect(handler.execute(command())).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'OWNERSHIP_PERIOD_AFFECTS_VOTES',
        votes: [expect.objectContaining({ voteId: 'v1', impact: 'LIVE' })],
      }),
    });
    expect(ownershipRepo.setPeriodBounds).not.toHaveBeenCalled();
  });

  it('goes ahead once acknowledged, and says so in the audit trail', async () => {
    const { handler, ownershipRepo, auditService } = buildHandler({
      votes: [
        {
          voteId: 'v1',
          title: 'Shromáždění 2026',
          mode: 'ASSEMBLY_RECORD',
          published: false,
          relevantAt: d('2026-05-05'),
        },
      ],
    });

    await handler.execute(command({ acknowledged: true }));

    expect(ownershipRepo.setPeriodBounds).toHaveBeenCalled();
    expect(auditService.append).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          affectedVoteCount: 1,
        }),
      }),
    );
  });
});
