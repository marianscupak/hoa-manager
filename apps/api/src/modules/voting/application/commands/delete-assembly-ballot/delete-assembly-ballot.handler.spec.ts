import { type VoteWriteRepository } from '@/modules/voting/application/ports/vote-write.repository.port';
import { type VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';
import { VoteMode, VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import { type UnitOfWork } from '@/shared/application/ports/unit-of-work.port';

import { DeleteAssemblyBallotCommand } from './delete-assembly-ballot.command';
import { DeleteAssemblyBallotHandler } from './delete-assembly-ballot.handler';

function build(options?: { mode?: VoteMode; status?: VoteStatus }) {
  const vote = {
    id: 'vote-1',
    tenantId: 'tenant-1',
    mode: options?.mode ?? VoteMode.ASSEMBLY_RECORD,
    status: options?.status ?? VoteStatus.DRAFT,
  } as unknown as VoteAggregate;

  const deleted: string[] = [];

  const handler = new DeleteAssemblyBallotHandler(
    {
      execute: jest.fn((work: () => Promise<unknown>) => work()),
    } as unknown as UnitOfWork,
    {
      findById: jest.fn().mockResolvedValue(vote),
      deleteBallotForUnit: jest.fn(
        async (_t: string, _v: string, u: string) => {
          deleted.push(u);
        },
      ),
    } as unknown as VoteWriteRepository,
  );

  return { handler, deleted };
}

describe('DeleteAssemblyBallotHandler', () => {
  it('removes the ballot for a unit', async () => {
    const { handler, deleted } = build();

    await handler.execute(
      new DeleteAssemblyBallotCommand(
        'tenant-1',
        'vote-1',
        'member-1',
        'unit-1',
      ),
    );

    expect(deleted).toEqual(['unit-1']);
  });

  it('refuses to delete a ballot from a per rollam vote', async () => {
    // A cast ballot is final everywhere else. This command exists only so the
    // board can flip a unit back to absent while writing up a meeting.
    const { handler, deleted } = build({ mode: VoteMode.PER_ROLLAM });

    await expect(
      handler.execute(
        new DeleteAssemblyBallotCommand(
          'tenant-1',
          'vote-1',
          'member-1',
          'unit-1',
        ),
      ),
    ).rejects.toMatchObject({ code: 'NOT_AN_ASSEMBLY_RECORD' });
    expect(deleted).toEqual([]);
  });

  it('refuses to delete a ballot from a published record', async () => {
    const { handler, deleted } = build({ status: VoteStatus.CLOSED });

    await expect(
      handler.execute(
        new DeleteAssemblyBallotCommand(
          'tenant-1',
          'vote-1',
          'member-1',
          'unit-1',
        ),
      ),
    ).rejects.toMatchObject({ code: 'VOTE_NOT_DRAFT' });
    expect(deleted).toEqual([]);
  });
});
