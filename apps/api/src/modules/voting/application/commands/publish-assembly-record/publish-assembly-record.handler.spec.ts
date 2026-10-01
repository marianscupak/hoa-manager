import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { type ElectorateService } from '@/modules/voting/application/ports/electorate-service.port';
import { type ResultCalculationService } from '@/modules/voting/application/ports/result-calculation.service.port';
import {
  type AttendanceRow,
  type VoteAttendanceRepository,
} from '@/modules/voting/application/ports/vote-attendance.repository.port';
import { type VoteWriteRepository } from '@/modules/voting/application/ports/vote-write.repository.port';
import { VotingAuditLabelResolver } from '@/modules/voting/audit/label-resolver.service';
import { type VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';
import {
  ElectorateEligibilityStatus,
  ElectorateIneligibleReason,
  type ElectorateUnit,
  VoteMode,
  VoteStatus,
} from '@/modules/voting/domain/vote/vote.types';
import { type Clock } from '@/shared/application/ports/clock.port';
import { type UnitOfWork } from '@/shared/application/ports/unit-of-work.port';
import type { AuditActor } from '@/shared/domain/actor';

import { PublishAssemblyRecordCommand } from './publish-assembly-record.command';
import { PublishAssemblyRecordHandler } from './publish-assembly-record.handler';

const ACTOR: AuditActor = {
  type: 'USER',
  userId: 'user-1',
  membershipId: 'member-1',
};

const MEETING_DATE = new Date('2026-09-12T18:30:00Z');
const NOW = new Date('2026-09-16T12:00:00Z');
const UNITS: ElectorateUnit[] = [
  {
    unitId: 'u1',
    representativeOwnerId: null,
    representativeMembershipId: 'member-9',
    eligibilityStatus: ElectorateEligibilityStatus.ELIGIBLE,
    ineligibleReason: null,
    weightNum: 1,
    weightDen: 2,
  },
  {
    unitId: 'u2',
    representativeOwnerId: null,
    representativeMembershipId: null,
    eligibilityStatus: ElectorateEligibilityStatus.INELIGIBLE,
    ineligibleReason: ElectorateIneligibleReason.ASSOCIATION_OWNED,
    weightNum: 1,
    weightDen: 2,
  },
];

function build(options?: {
  mode?: VoteMode;
  status?: VoteStatus;
  scheduledFrom?: Date;
  attendance?: AttendanceRow[];
  ballotUnitIds?: string[];
  quorumMet?: boolean;
}) {
  const closed = { value: false };
  const vote = {
    id: 'vote-1',
    tenantId: 'tenant-1',
    title: 'Assembly 12 Sep',
    mode: options?.mode ?? VoteMode.ASSEMBLY_RECORD,
    status: options?.status ?? VoteStatus.DRAFT,
    scheduledFrom: options?.scheduledFrom ?? MEETING_DATE,
    questions: [],
    close: jest.fn(() => {
      closed.value = true;
    }),
  } as unknown as VoteAggregate;

  const attendance = options?.attendance ?? [
    { unitId: 'u1', status: 'PRESENT', voterOwnerId: 'o1', voterNote: null },
  ];
  const ballotUnitIds = options?.ballotUnitIds ?? ['u1'];

  const calls = {
    resolvedAt: null as Date | null,
    snapshotted: null as ElectorateUnit[] | null,
    resultsSaved: false,
  };

  const handler = new PublishAssemblyRecordHandler(
    {
      execute: jest.fn((work: () => Promise<unknown>) => work()),
    } as unknown as UnitOfWork,
    {
      findById: jest.fn().mockResolvedValue(vote),
      findUnitIdsWithBallot: jest.fn(async () => ballotUnitIds),
      saveElectorateUnits: jest.fn(async (_t, _v, units: ElectorateUnit[]) => {
        calls.snapshotted = units;
      }),
      save: jest.fn(),
      saveResults: jest.fn(async () => {
        calls.resultsSaved = true;
      }),
    } as unknown as VoteWriteRepository,
    {
      findByVote: jest.fn(async () => attendance),
    } as unknown as VoteAttendanceRepository,
    {
      resolveAssemblyElectorate: jest.fn(async () => {
        calls.resolvedAt = MEETING_DATE;
        return UNITS;
      }),
    } as unknown as ElectorateService,
    {
      calculate: jest.fn(async () => ({
        quorumMet: options?.quorumMet ?? true,
        questionResults: [],
      })),
    } as unknown as ResultCalculationService,
    { now: () => NOW } as Clock,
    { append: jest.fn() } as unknown as AuditService,
    {
      requireActor: jest.fn().mockReturnValue(ACTOR),
    } as unknown as AuditContextService,
    {
      resolveActorLabel: jest.fn().mockResolvedValue('Board Member'),
    } as unknown as VotingAuditLabelResolver,
  );

  return { handler, vote, calls, closed };
}

const command = () =>
  new PublishAssemblyRecordCommand('tenant-1', 'vote-1', 'member-1');

describe('PublishAssemblyRecordHandler', () => {
  it('refuses to publish while a present unit has no ballot', async () => {
    // The gate is what makes "votes cast" equal "present shares", which the
    // statutory denominator relies on. The screen disables the button, but the
    // rule belongs here.
    const { handler, calls } = build({
      attendance: [
        {
          unitId: 'u1',
          status: 'PRESENT',
          voterOwnerId: 'o1',
          voterNote: null,
        },
        {
          unitId: 'u2',
          status: 'PRESENT',
          voterOwnerId: 'o2',
          voterNote: null,
        },
      ],
      ballotUnitIds: ['u1'],
    });

    await expect(handler.execute(command())).rejects.toMatchObject({
      code: 'ASSEMBLY_RECORD_INCOMPLETE',
    });
    expect(calls.snapshotted).toBeNull();
  });

  it('ignores absent units when checking the gate', async () => {
    const { handler } = build({
      attendance: [
        {
          unitId: 'u1',
          status: 'PRESENT',
          voterOwnerId: 'o1',
          voterNote: null,
        },
        { unitId: 'u2', status: 'ABSENT', voterOwnerId: null, voterNote: null },
      ],
      ballotUnitIds: ['u1'],
    });

    await expect(handler.execute(command())).resolves.toBeUndefined();
  });

  it('snapshots exactly the electorate the recording screen resolved', async () => {
    // Publishing used to resolve the electorate itself, as of the meeting
    // date, while the roster resolved its own. The board entered the record
    // against one set of units and it was computed against another: in a
    // building whose register did not reach back that far, the association's
    // own unit came back MISSING_OWNERSHIP instead of ASSOCIATION_OWNED,
    // counted toward "all votes" it has no vote in (§ 1206 odst. 1), and a
    // quorate assembly published as inquorate. Both now go through one entry
    // point, and `CreateVote` refuses a meeting the register cannot reach.
    const { handler, calls } = build();

    await handler.execute(command());

    expect(calls.snapshotted).toEqual(UNITS);
    expect(calls.snapshotted).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          unitId: 'u2',
          ineligibleReason: ElectorateIneligibleReason.ASSOCIATION_OWNED,
        }),
      ]),
    );
  });

  it('snapshots the electorate, closes the vote and persists results', async () => {
    const { handler, calls, closed } = build();

    await handler.execute(command());

    expect(calls.snapshotted).not.toBeNull();
    expect(closed.value).toBe(true);
    expect(calls.resultsSaved).toBe(true);
  });

  it('publishes an inquorate assembly', async () => {
    // Recording that nothing could be adopted is a valid outcome, not an error.
    const { handler, closed } = build({ quorumMet: false });

    await expect(handler.execute(command())).resolves.toBeUndefined();
    expect(closed.value).toBe(true);
  });

  it('refuses a per rollam vote', async () => {
    const { handler } = build({ mode: VoteMode.PER_ROLLAM });

    await expect(handler.execute(command())).rejects.toMatchObject({
      code: 'NOT_AN_ASSEMBLY_RECORD',
    });
  });

  it('refuses a record that is already published', async () => {
    const { handler } = build({ status: VoteStatus.CLOSED });

    await expect(handler.execute(command())).rejects.toMatchObject({
      code: 'VOTE_NOT_DRAFT',
    });
  });

  it('refuses to publish a record nobody has worked on', async () => {
    // Zero attendance rows means the board never started, not that nobody
    // came — an inquorate meeting still has every unit marked absent. The gate
    // passes vacuously here, and publishing is irreversible, so this is caught
    // separately.
    const { handler, calls } = build({ attendance: [], ballotUnitIds: [] });

    await expect(handler.execute(command())).rejects.toMatchObject({
      code: 'ASSEMBLY_RECORD_INCOMPLETE',
    });
    expect(calls.snapshotted).toBeNull();
  });

  it('publishes a meeting where every unit was marked absent', async () => {
    const { handler, closed } = build({
      attendance: [
        { unitId: 'u1', status: 'ABSENT', voterOwnerId: null, voterNote: null },
      ],
      ballotUnitIds: [],
    });

    await expect(handler.execute(command())).resolves.toBeUndefined();
    expect(closed.value).toBe(true);
  });
});
