import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';
import { TenantMembershipRole } from '@/shared/domain/membership';

import { GetVoteParticipationHandler } from './get-vote-participation.handler';
import { GetVoteParticipationQuery } from './get-vote-participation.query';

describe('GetVoteParticipationHandler', () => {
  const readRepo = { findParticipation: jest.fn() };
  let handler: GetVoteParticipationHandler;

  const query = (roles: TenantMembershipRole[]) =>
    new GetVoteParticipationQuery('tenant-1', 'vote-1', 'mem-1', roles);

  const votedRow = {
    unitId: 'u1',
    unitNo: 'A1',
    ownerNames: ['Jana Nováková'],
    share: '5/100',
    status: 'VOTED',
    castMethod: 'BOARD_PROXY',
    castAt: new Date('2026-08-15T09:12:00Z'),
    recordedBy: 'Petr Svoboda',
    ineligibleReason: undefined,
    isOwnUnit: false,
    ownsUnit: true,
    isProxy: false,
    canVoteInApp: true,
    representative: {
      ownerId: 'o1',
      membershipId: null,
      name: 'Jana Nováková',
      isUnitOwner: true,
    },
    owners: [
      {
        ownerId: 'o1',
        displayName: 'Jana Nováková',
        share: '1/1',
        isRepresentative: true,
      },
    ],
    answers: [
      {
        questionId: 'q1',
        optionId: 'opt-yes',
        optionLabel: 'Ano',
        optionKey: 'YES',
      },
    ],
  };

  const noRepresentativeRow = {
    ...votedRow,
    unitId: 'u2',
    unitNo: 'A2',
    status: 'INELIGIBLE',
    ineligibleReason: 'NO_REPRESENTATIVE',
    castMethod: undefined,
    castAt: undefined,
    recordedBy: undefined,
    answers: undefined,
    ownsUnit: false,
    canVoteInApp: false,
    representative: null,
  };

  const missingOwnershipRow = {
    ...noRepresentativeRow,
    unitId: 'u3',
    unitNo: 'A3',
    ineligibleReason: 'MISSING_OWNERSHIP',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new GetVoteParticipationHandler(readRepo as never, {
      now: () => new Date('2026-09-15T10:00:00Z'),
    });
  });

  describe.each([
    TenantMembershipRole.ADMIN,
    TenantMembershipRole.BOARD_MEMBER,
    TenantMembershipRole.AUDITOR,
  ])('for a %s', (role) => {
    it('returns the full board shape', async () => {
      readRepo.findParticipation.mockResolvedValue([votedRow]);

      const result = await handler.execute(query([role]));

      expect(result.units[0]).toEqual(votedRow);
    });

    it('keeps a unit with no common representative ineligible for the board, with its reason', async () => {
      readRepo.findParticipation.mockResolvedValue([noRepresentativeRow]);

      const result = await handler.execute(query([role]));

      expect(result.units[0]).toEqual(noRepresentativeRow);
    });

    it('keeps a unit with no owner on record ineligible', async () => {
      readRepo.findParticipation.mockResolvedValue([missingOwnershipRow]);

      const result = await handler.execute(query([role]));

      expect(result.units[0].status).toBe('INELIGIBLE');
    });
  });

  describe('for a UNIT_OWNER', () => {
    const ownerQuery = () => query([TenantMembershipRole.UNIT_OWNER]);

    it('returns exactly the permitted keys and nothing else', async () => {
      readRepo.findParticipation.mockResolvedValue([votedRow]);

      const result = await handler.execute(ownerQuery());

      // An exact key set, deliberately: asserting only that today's
      // sensitive fields are absent would silently pass any field added
      // later without a redaction rule.
      expect(Object.keys(result.units[0]).sort()).toEqual([
        'isProxy',
        'ownsUnit',
        'share',
        'status',
        'unitId',
        'unitNo',
      ]);
    });

    it('keeps the participation facts an owner is allowed to see', async () => {
      readRepo.findParticipation.mockResolvedValue([votedRow]);

      const result = await handler.execute(ownerQuery());

      expect(result.units[0]).toEqual({
        unitId: 'u1',
        unitNo: 'A1',
        share: '5/100',
        status: 'VOTED',
        ownsUnit: true,
        isProxy: false,
      });
    });

    it('reports a unit with no common representative as simply not voted', async () => {
      readRepo.findParticipation.mockResolvedValue([noRepresentativeRow]);

      const result = await handler.execute(ownerQuery());

      expect(result.units[0].status).toBe('NOT_VOTED');
    });

    it('still reports a unit with no owner on record as ineligible', async () => {
      readRepo.findParticipation.mockResolvedValue([missingOwnershipRow]);

      const result = await handler.execute(ownerQuery());

      expect(result.units[0].status).toBe('INELIGIBLE');
    });
  });

  it('gives the board shape to a member holding both owner and board roles', async () => {
    readRepo.findParticipation.mockResolvedValue([votedRow]);

    const result = await handler.execute(
      query([
        TenantMembershipRole.UNIT_OWNER,
        TenantMembershipRole.BOARD_MEMBER,
      ]),
    );

    expect(result.units[0].answers).toHaveLength(1);
  });

  it('throws VoteNotFoundException when the vote has no electorate snapshot', async () => {
    readRepo.findParticipation.mockResolvedValue([]);

    await expect(
      handler.execute(query([TenantMembershipRole.UNIT_OWNER])),
    ).rejects.toThrow(VoteNotFoundException);
  });
});
