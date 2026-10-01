import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import {
  type AttendanceRow,
  type VoteAttendanceRepository,
} from '@/modules/voting/application/ports/vote-attendance.repository.port';
import { type VoteReadRepository } from '@/modules/voting/application/ports/vote-read.repository.port';
import {
  type BallotInput,
  type VoteWriteRepository,
} from '@/modules/voting/application/ports/vote-write.repository.port';
import { VotingAuditLabelResolver } from '@/modules/voting/audit/label-resolver.service';
import { VoteMode, VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import { type Clock } from '@/shared/application/ports/clock.port';
import { type UnitOfWork } from '@/shared/application/ports/unit-of-work.port';
import type { AuditActor } from '@/shared/domain/actor';

import { RecordAssemblyBallotCommand } from './record-assembly-ballot.command';
import { RecordAssemblyBallotHandler } from './record-assembly-ballot.handler';

const ACTOR: AuditActor = {
  type: 'USER',
  userId: 'user-1',
  membershipId: 'member-1',
};

const YES = { questionId: 'q1', optionId: 'o-yes-1' };
const YES_Q2 = { questionId: 'q2', optionId: 'o-yes-2' };

function build(options?: {
  mode?: VoteMode;
  status?: VoteStatus;
  attendance?: Partial<AttendanceRow> | null;
  questionIds?: string[];
}) {
  const questionIds = options?.questionIds ?? ['q1'];
  const vote = {
    id: 'vote-1',
    tenantId: 'tenant-1',
    title: 'Assembly',
    mode: options?.mode ?? VoteMode.ASSEMBLY_RECORD,
    status: options?.status ?? VoteStatus.DRAFT,
    questions: questionIds.map((id) => ({
      id,
      title: `Question ${id}`,
      options: [
        { id: `o-yes-${id.slice(1)}`, optionKey: 'YES', label: 'Ano' },
        { id: `o-no-${id.slice(1)}`, optionKey: 'NO', label: 'Ne' },
      ],
    })),
  };

  const attendanceRow: AttendanceRow | null =
    options?.attendance === null
      ? null
      : {
          unitId: 'unit-1',
          status: 'PRESENT',
          voterOwnerId: 'owner-1',
          voterNote: null,
          ...options?.attendance,
        };

  const saved: BallotInput[] = [];
  const deleted: string[] = [];

  const handler = new RecordAssemblyBallotHandler(
    {
      execute: jest.fn((work: () => Promise<unknown>) => work()),
    } as unknown as UnitOfWork,
    {
      findDetailById: jest.fn().mockResolvedValue(vote),
    } as unknown as VoteReadRepository,
    {
      // Mirrors the real unique (vote, unit) constraint, so a second ballot
      // for the same unit only lands if the first was removed.
      saveBallots: jest.fn(async (_t: string, _v: string, b: BallotInput[]) => {
        for (const ballot of b) {
          if (saved.some((s) => s.unitId === ballot.unitId)) {
            throw Object.assign(new Error('duplicate'), {
              code: 'BALLOT_ALREADY_CAST',
            });
          }
          saved.push(ballot);
        }
        return b.map((x, i) => ({ ballotId: `ballot-${i}`, unitId: x.unitId }));
      }),
      deleteBallotForUnit: jest.fn(
        async (_t: string, _v: string, u: string) => {
          deleted.push(u);
          const at = saved.findIndex((s) => s.unitId === u);
          if (at >= 0) saved.splice(at, 1);
        },
      ),
    } as unknown as VoteWriteRepository,
    {
      findByVote: jest.fn(async () => (attendanceRow ? [attendanceRow] : [])),
    } as unknown as VoteAttendanceRepository,
    { now: () => new Date('2026-09-16T12:00:00Z') } as Clock,
    { append: jest.fn() } as unknown as AuditService,
    {
      requireActor: jest.fn().mockReturnValue(ACTOR),
    } as unknown as AuditContextService,
    {
      resolveActorLabel: jest.fn().mockResolvedValue('Board Member'),
      resolveOwnerLabel: jest.fn().mockResolvedValue('Jana Nováková'),
      resolveUnitLabel: jest.fn().mockResolvedValue('A-101'),
    } as unknown as VotingAuditLabelResolver,
  );

  return { handler, saved, deleted };
}

describe('RecordAssemblyBallotHandler', () => {
  it("records a ballot attributed to the unit's recorded voter", async () => {
    const { handler, saved } = build();

    await handler.execute(
      new RecordAssemblyBallotCommand(
        'tenant-1',
        'vote-1',
        'member-1',
        'unit-1',
        [YES],
      ),
    );

    expect(saved[0]).toMatchObject({
      unitId: 'unit-1',
      castMethod: 'BOARD_PROXY',
      attributionOwnerId: 'owner-1',
      attachmentDocumentId: null,
    });
  });

  it('records a ballot for a unit voted by a proxy holder who is not an owner', async () => {
    // `signerOwnsUnit`, which the paper-ballot path enforces, is wrong here: a
    // co-owned unit is voted by its common representative, who need not own
    // that unit, and a proxy holder may own nothing at all.
    const { handler, saved } = build({
      attendance: { voterOwnerId: null, voterNote: 'Petr Svoboda' },
    });

    await handler.execute(
      new RecordAssemblyBallotCommand(
        'tenant-1',
        'vote-1',
        'member-1',
        'unit-1',
        [YES],
      ),
    );

    expect(saved[0]).toMatchObject({ attributionOwnerId: null });
  });

  it('refuses a unit that is not marked present', async () => {
    const { handler } = build({ attendance: { status: 'ABSENT' } });

    await expect(
      handler.execute(
        new RecordAssemblyBallotCommand(
          'tenant-1',
          'vote-1',
          'member-1',
          'unit-1',
          [YES],
        ),
      ),
    ).rejects.toMatchObject({ code: 'UNIT_NOT_PRESENT' });
  });

  it('refuses a unit with no attendance recorded at all', async () => {
    const { handler } = build({ attendance: null });

    await expect(
      handler.execute(
        new RecordAssemblyBallotCommand(
          'tenant-1',
          'vote-1',
          'member-1',
          'unit-1',
          [YES],
        ),
      ),
    ).rejects.toMatchObject({ code: 'UNIT_NOT_PRESENT' });
  });

  it('refuses a present unit whose voter has not been chosen yet', async () => {
    // Recording how a unit voted without recording who voted would leave the
    // audit trail naming nobody. The UI asks for the voter first; the domain
    // is what makes that order binding.
    const { handler } = build({
      attendance: { voterOwnerId: null, voterNote: null },
    });

    await expect(
      handler.execute(
        new RecordAssemblyBallotCommand(
          'tenant-1',
          'vote-1',
          'member-1',
          'unit-1',
          [YES],
        ),
      ),
    ).rejects.toMatchObject({ code: 'ASSEMBLY_VOTER_NOT_RECORDED' });
  });

  it('refuses a partial ballot', async () => {
    const { handler } = build({ questionIds: ['q1', 'q2'] });

    await expect(
      handler.execute(
        new RecordAssemblyBallotCommand(
          'tenant-1',
          'vote-1',
          'member-1',
          'unit-1',
          [YES],
        ),
      ),
    ).rejects.toMatchObject({ code: 'INVALID_BALLOT_ANSWERS' });
  });

  it('accepts a ballot answering every question', async () => {
    const { handler, saved } = build({ questionIds: ['q1', 'q2'] });

    await handler.execute(
      new RecordAssemblyBallotCommand(
        'tenant-1',
        'vote-1',
        'member-1',
        'unit-1',
        [YES, YES_Q2],
      ),
    );

    expect(saved[0].answers).toHaveLength(2);
  });

  it('refuses a per rollam vote', async () => {
    const { handler } = build({ mode: VoteMode.PER_ROLLAM });

    await expect(
      handler.execute(
        new RecordAssemblyBallotCommand(
          'tenant-1',
          'vote-1',
          'member-1',
          'unit-1',
          [YES],
        ),
      ),
    ).rejects.toMatchObject({ code: 'NOT_AN_ASSEMBLY_RECORD' });
  });

  it('refuses a published record', async () => {
    const { handler } = build({ status: VoteStatus.CLOSED });

    await expect(
      handler.execute(
        new RecordAssemblyBallotCommand(
          'tenant-1',
          'vote-1',
          'member-1',
          'unit-1',
          [YES],
        ),
      ),
    ).rejects.toMatchObject({ code: 'VOTE_NOT_DRAFT' });
  });

  it('replaces an answer the board already entered for the unit', async () => {
    // Transcribing minutes means typos. A recorded ballot has to be
    // correctable while the record is still a draft, which the unique
    // (vote, unit) constraint would otherwise refuse.
    const { handler, saved, deleted } = build();

    await handler.execute(
      new RecordAssemblyBallotCommand(
        'tenant-1',
        'vote-1',
        'member-1',
        'unit-1',
        [YES],
      ),
    );
    await handler.execute(
      new RecordAssemblyBallotCommand(
        'tenant-1',
        'vote-1',
        'member-1',
        'unit-1',
        [{ questionId: 'q1', optionId: 'o-no-1' }],
      ),
    );

    // The delete runs before every save, so the first one is a no-op; what
    // matters is that the unit ends up with exactly one, corrected ballot.
    expect(deleted).toContain('unit-1');
    expect(saved).toHaveLength(1);
    expect(saved[0].answers).toEqual([
      { questionId: 'q1', optionId: 'o-no-1' },
    ]);
  });
});
