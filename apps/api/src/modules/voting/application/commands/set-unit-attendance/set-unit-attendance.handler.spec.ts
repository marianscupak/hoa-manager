import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { type ElectorateService } from '@/modules/voting/application/ports/electorate-service.port';
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
  VoteMode,
  VoteStatus,
} from '@/modules/voting/domain/vote/vote.types';
import { type Clock } from '@/shared/application/ports/clock.port';
import { type UnitOfWork } from '@/shared/application/ports/unit-of-work.port';
import type { AuditActor } from '@/shared/domain/actor';

import { SetUnitAttendanceCommand } from './set-unit-attendance.command';
import { SetUnitAttendanceHandler } from './set-unit-attendance.handler';

const ACTOR: AuditActor = {
  type: 'USER',
  userId: 'user-1',
  membershipId: 'member-1',
};

function electorateRow(
  unitId: string,
  ineligibleReason: ElectorateIneligibleReason | null = null,
) {
  return {
    unitId,
    eligibilityStatus: ineligibleReason
      ? ElectorateEligibilityStatus.INELIGIBLE
      : ElectorateEligibilityStatus.ELIGIBLE,
    ineligibleReason,
    weightNum: 1,
    weightDen: 4,
    representativeMembershipId: null,
  };
}

function build(options?: {
  mode?: VoteMode;
  status?: VoteStatus;
  ineligible?: Partial<Record<string, ElectorateIneligibleReason>>;
}) {
  const vote = {
    id: 'vote-1',
    tenantId: 'tenant-1',
    title: 'Assembly',
    mode: options?.mode ?? VoteMode.ASSEMBLY_RECORD,
    status: options?.status ?? VoteStatus.DRAFT,
  } as unknown as VoteAggregate;

  // The double stores rows rather than recording calls, so the tests assert on
  // what was written — including the fields the handler is meant to clear.
  const rows = new Map<string, AttendanceRow>();
  const deletedBallots: string[] = [];

  const attendanceRepo = {
    upsert: jest.fn(async (_t: string, _v: string, row: AttendanceRow) => {
      rows.set(row.unitId, row);
    }),
    findByVote: jest.fn(async () => [...rows.values()]),
  } as unknown as VoteAttendanceRepository;

  const voteRepository = {
    findById: jest.fn().mockResolvedValue(vote),
    deleteBallotForUnit: jest.fn(async (_t: string, _v: string, u: string) => {
      deletedBallots.push(u);
    }),
  } as unknown as VoteWriteRepository;

  const electorateService = {
    resolveAssemblyElectorate: jest.fn(async () => [
      electorateRow('unit-1', options?.ineligible?.['unit-1'] ?? null),
      electorateRow('unit-9', options?.ineligible?.['unit-9'] ?? null),
    ]),
  } as unknown as ElectorateService;

  const handler = new SetUnitAttendanceHandler(
    {
      execute: jest.fn((work: () => Promise<unknown>) => work()),
    } as unknown as UnitOfWork,
    voteRepository,
    attendanceRepo,
    electorateService,
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

  return { handler, rows, deletedBallots };
}

describe('SetUnitAttendanceHandler', () => {
  it('records a present unit with the owner who voted for it', async () => {
    const { handler, rows } = build();

    await handler.execute(
      new SetUnitAttendanceCommand(
        'tenant-1',
        'vote-1',
        'member-1',
        'unit-1',
        'PRESENT',
        'owner-1',
        null,
      ),
    );

    expect(rows.get('unit-1')).toMatchObject({
      status: 'PRESENT',
      voterOwnerId: 'owner-1',
      voterNote: null,
    });
  });

  it('records a proxy holder who is not an owner as a note', async () => {
    // An owner may hand a power of attorney to anyone. The name is provenance;
    // entitlement still belongs to the unit's owner.
    const { handler, rows } = build();

    await handler.execute(
      new SetUnitAttendanceCommand(
        'tenant-1',
        'vote-1',
        'member-1',
        'unit-1',
        'PRESENT',
        null,
        'Petr Svoboda',
      ),
    );

    expect(rows.get('unit-1')).toMatchObject({
      voterOwnerId: null,
      voterNote: 'Petr Svoboda',
    });
  });

  it('clears the voter and deletes the ballot when a unit becomes absent', async () => {
    const { handler, rows, deletedBallots } = build();

    await handler.execute(
      new SetUnitAttendanceCommand(
        'tenant-1',
        'vote-1',
        'member-1',
        'unit-1',
        'PRESENT',
        'owner-1',
        null,
      ),
    );
    await handler.execute(
      new SetUnitAttendanceCommand(
        'tenant-1',
        'vote-1',
        'member-1',
        'unit-1',
        'ABSENT',
        'owner-1',
        'ignored',
      ),
    );

    expect(rows.get('unit-1')).toMatchObject({
      status: 'ABSENT',
      voterOwnerId: null,
      voterNote: null,
    });
    expect(deletedBallots).toEqual(['unit-1']);
  });

  it('refuses to mark an association-owned unit present', async () => {
    const { handler } = build({
      ineligible: { 'unit-9': ElectorateIneligibleReason.ASSOCIATION_OWNED },
    });

    await expect(
      handler.execute(
        new SetUnitAttendanceCommand(
          'tenant-1',
          'vote-1',
          'member-1',
          'unit-9',
          'PRESENT',
          null,
          null,
        ),
      ),
    ).rejects.toMatchObject({ code: 'UNIT_NOT_ELIGIBLE_FOR_ATTENDANCE' });
  });

  it('refuses to mark a unit with no ownership on record present', async () => {
    const { handler } = build({
      ineligible: { 'unit-9': ElectorateIneligibleReason.MISSING_OWNERSHIP },
    });

    await expect(
      handler.execute(
        new SetUnitAttendanceCommand(
          'tenant-1',
          'vote-1',
          'member-1',
          'unit-9',
          'PRESENT',
          null,
          null,
        ),
      ),
    ).rejects.toMatchObject({ code: 'UNIT_NOT_ELIGIBLE_FOR_ATTENDANCE' });
  });

  it('allows a unit that is only missing a common representative', async () => {
    // The board settles representation in the room, so this is the one
    // ineligibility the recording session is expected to resolve.
    const { handler, rows } = build({
      ineligible: { 'unit-1': ElectorateIneligibleReason.NO_REPRESENTATIVE },
    });

    await handler.execute(
      new SetUnitAttendanceCommand(
        'tenant-1',
        'vote-1',
        'member-1',
        'unit-1',
        'PRESENT',
        'owner-1',
        null,
      ),
    );

    expect(rows.get('unit-1')?.status).toBe('PRESENT');
  });

  it('refuses to touch a per rollam vote', async () => {
    const { handler } = build({ mode: VoteMode.PER_ROLLAM });

    await expect(
      handler.execute(
        new SetUnitAttendanceCommand(
          'tenant-1',
          'vote-1',
          'member-1',
          'unit-1',
          'PRESENT',
          'owner-1',
          null,
        ),
      ),
    ).rejects.toMatchObject({ code: 'NOT_AN_ASSEMBLY_RECORD' });
  });

  it('refuses to touch a published record', async () => {
    const { handler } = build({ status: VoteStatus.CLOSED });

    await expect(
      handler.execute(
        new SetUnitAttendanceCommand(
          'tenant-1',
          'vote-1',
          'member-1',
          'unit-1',
          'PRESENT',
          'owner-1',
          null,
        ),
      ),
    ).rejects.toMatchObject({ code: 'VOTE_NOT_DRAFT' });
  });
});
