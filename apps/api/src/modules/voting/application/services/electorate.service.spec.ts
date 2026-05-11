import { Test, TestingModule } from '@nestjs/testing';

import { VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';
import {
  ElectorateEligibilityStatus,
  ElectorateIneligibleReason,
  VoteWeightBasis,
} from '@/modules/voting/domain/vote/vote.types';

import { ElectorateDomainService } from './electorate.service';
import {
  ELECTORATE_DATA_REPOSITORY,
  ElectorateDataRepository,
} from '../ports/electorate-data.repository.port';

describe('ElectorateDomainService', () => {
  let service: ElectorateDomainService;
  let dataRepo: jest.Mocked<ElectorateDataRepository>;

  const defaultTenantId = 'tenant-1';
  const defaultVoteId = 'vote-1';

  const mockVote = {
    id: defaultVoteId,
    tenantId: defaultTenantId,
    ruleset: {
      allowCoOwnerIndividualVote: false,
      weightBasis: VoteWeightBasis.UNIT_SHARE,
    },
  } as VoteAggregate;

  beforeEach(async () => {
    dataRepo = {
      findAllUnits: jest.fn(),
      findOwnershipRecords: jest.fn(),
      findValidConsents: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElectorateDomainService,
        {
          provide: ELECTORATE_DATA_REPOSITORY,
          useValue: dataRepo,
        },
      ],
    }).compile();

    service = module.get<ElectorateDomainService>(ElectorateDomainService);
  });

  describe('resolveElectorate', () => {
    it('returns empty array if no units exist', async () => {
      dataRepo.findAllUnits.mockResolvedValue([]);
      dataRepo.findOwnershipRecords.mockResolvedValue([]);
      dataRepo.findValidConsents.mockResolvedValue([]);

      const result = await service.resolveElectorate(mockVote);
      expect(result).toEqual([]);
    });

    it('assigns INELIGIBLE MISSING_OWNERSHIP if unit has no ownerships', async () => {
      dataRepo.findAllUnits.mockResolvedValue([
        { id: 'u1', buildingShareNumerator: 1, buildingShareDenominator: 10 },
      ]);
      dataRepo.findOwnershipRecords.mockResolvedValue([]);
      dataRepo.findValidConsents.mockResolvedValue([]);

      const result = await service.resolveElectorate(mockVote);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        unitId: 'u1',
        representativeMembershipId: null,
        eligibilityStatus: ElectorateEligibilityStatus.INELIGIBLE,
        ineligibleReason: ElectorateIneligibleReason.MISSING_OWNERSHIP,
        votingWeight: 0.1,
      });
    });

    it('assigns ELIGIBLE if single owner has a membership', async () => {
      dataRepo.findAllUnits.mockResolvedValue([
        { id: 'u1', buildingShareNumerator: 1, buildingShareDenominator: 10 },
      ]);
      dataRepo.findOwnershipRecords.mockResolvedValue([
        { unitId: 'u1', ownerId: 'o1', membershipId: 'm1' },
      ]);
      dataRepo.findValidConsents.mockResolvedValue([]);

      const result = await service.resolveElectorate(mockVote);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        unitId: 'u1',
        representativeMembershipId: 'm1',
        eligibilityStatus: ElectorateEligibilityStatus.ELIGIBLE,
        ineligibleReason: null,
        votingWeight: 0.1,
      });
    });

    it('assigns INELIGIBLE NO_REPRESENTATIVE if single owner has NO membership', async () => {
      dataRepo.findAllUnits.mockResolvedValue([
        { id: 'u1', buildingShareNumerator: 1, buildingShareDenominator: 10 },
      ]);
      dataRepo.findOwnershipRecords.mockResolvedValue([
        { unitId: 'u1', ownerId: 'o1', membershipId: null },
      ]);
      dataRepo.findValidConsents.mockResolvedValue([]);

      const result = await service.resolveElectorate(mockVote);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        unitId: 'u1',
        representativeMembershipId: null,
        eligibilityStatus: ElectorateEligibilityStatus.INELIGIBLE,
        ineligibleReason: ElectorateIneligibleReason.NO_REPRESENTATIVE,
        votingWeight: 0.1, // preserves weight
      });
    });

    it('uses 1.0 weight if ruleset is ONE_UNIT_ONE_VOTE', async () => {
      dataRepo.findAllUnits.mockResolvedValue([
        { id: 'u1', buildingShareNumerator: 1, buildingShareDenominator: 10 },
      ]);
      dataRepo.findOwnershipRecords.mockResolvedValue([
        { unitId: 'u1', ownerId: 'o1', membershipId: 'm1' },
      ]);
      dataRepo.findValidConsents.mockResolvedValue([]);

      const oneVote = {
        ...mockVote,
        ruleset: {
          ...mockVote.ruleset,
          weightBasis: VoteWeightBasis.ONE_UNIT_ONE_VOTE,
        },
      } as VoteAggregate;

      const result = await service.resolveElectorate(oneVote);
      expect(result[0].votingWeight).toBe(1.0);
    });

    it('correctly computes weight from arbitrary fractions', async () => {
      dataRepo.findAllUnits.mockResolvedValue([
        {
          id: 'u1',
          buildingShareNumerator: 225,
          buildingShareDenominator: 1332,
        },
      ]);
      dataRepo.findOwnershipRecords.mockResolvedValue([
        { unitId: 'u1', ownerId: 'o1', membershipId: 'm1' },
      ]);
      dataRepo.findValidConsents.mockResolvedValue([]);

      const result = await service.resolveElectorate(mockVote);
      expect(result[0].votingWeight).toBeCloseTo(225 / 1332, 10);
    });

    describe('Co-ownership (allowCoOwnerIndividualVote = false)', () => {
      it('assigns ELIGIBLE if all co-owners reach consensus on one membership via consents', async () => {
        dataRepo.findAllUnits.mockResolvedValue([
          { id: 'u1', buildingShareNumerator: 1, buildingShareDenominator: 5 },
        ]);
        dataRepo.findOwnershipRecords.mockResolvedValue([
          { unitId: 'u1', ownerId: 'o1', membershipId: 'm1' }, // Has membership
          { unitId: 'u1', ownerId: 'o2', membershipId: null }, // No membership, gave consent
        ]);
        dataRepo.findValidConsents.mockResolvedValue([
          { unitId: 'u1', fromOwnerId: 'o2', toMembershipId: 'm1' },
        ]);

        const result = await service.resolveElectorate(mockVote);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          unitId: 'u1',
          representativeMembershipId: 'm1',
          eligibilityStatus: ElectorateEligibilityStatus.ELIGIBLE,
          ineligibleReason: null,
          votingWeight: 0.2,
        });
      });

      it('assigns INELIGIBLE if co-owners lack consensus', async () => {
        dataRepo.findAllUnits.mockResolvedValue([
          { id: 'u1', buildingShareNumerator: 1, buildingShareDenominator: 5 },
        ]);
        dataRepo.findOwnershipRecords.mockResolvedValue([
          { unitId: 'u1', ownerId: 'o1', membershipId: 'm1' },
          { unitId: 'u1', ownerId: 'o2', membershipId: 'm2' }, // Has own membership, no consent given
        ]);
        dataRepo.findValidConsents.mockResolvedValue([]);

        const result = await service.resolveElectorate(mockVote);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          unitId: 'u1',
          representativeMembershipId: null,
          eligibilityStatus: ElectorateEligibilityStatus.INELIGIBLE,
          ineligibleReason: ElectorateIneligibleReason.NO_REPRESENTATIVE,
          votingWeight: 0.2,
        });
      });
    });

    describe('Co-ownership (allowCoOwnerIndividualVote = true)', () => {
      const individualVote = {
        ...mockVote,
        ruleset: {
          ...mockVote.ruleset,
          allowCoOwnerIndividualVote: true,
        },
      } as VoteAggregate;

      it('creates multiple ELIGIBLE electorate entries, one for each membership', async () => {
        dataRepo.findAllUnits.mockResolvedValue([
          {
            id: 'u1',
            buildingShareNumerator: 3,
            buildingShareDenominator: 10,
          },
        ]);
        dataRepo.findOwnershipRecords.mockResolvedValue([
          { unitId: 'u1', ownerId: 'o1', membershipId: 'm1' },
          { unitId: 'u1', ownerId: 'o2', membershipId: 'm2' },
          { unitId: 'u1', ownerId: 'o3', membershipId: null }, // won't get a vote
        ]);
        dataRepo.findValidConsents.mockResolvedValue([]);

        const result = await service.resolveElectorate(individualVote);
        expect(result).toHaveLength(2); // m1 and m2
        expect(result).toEqual(
          expect.arrayContaining([
            {
              unitId: 'u1',
              representativeMembershipId: 'm1',
              eligibilityStatus: ElectorateEligibilityStatus.ELIGIBLE,
              ineligibleReason: null,
              votingWeight: 0.3,
            },
            {
              unitId: 'u1',
              representativeMembershipId: 'm2',
              eligibilityStatus: ElectorateEligibilityStatus.ELIGIBLE,
              ineligibleReason: null,
              votingWeight: 0.3,
            },
          ]),
        );
      });

      it('assigns INELIGIBLE if NO co-owner has a membership', async () => {
        dataRepo.findAllUnits.mockResolvedValue([
          {
            id: 'u1',
            buildingShareNumerator: 3,
            buildingShareDenominator: 10,
          },
        ]);
        dataRepo.findOwnershipRecords.mockResolvedValue([
          { unitId: 'u1', ownerId: 'o1', membershipId: null },
          { unitId: 'u1', ownerId: 'o2', membershipId: null },
        ]);
        dataRepo.findValidConsents.mockResolvedValue([]);

        const result = await service.resolveElectorate(individualVote);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          unitId: 'u1',
          representativeMembershipId: null,
          eligibilityStatus: ElectorateEligibilityStatus.INELIGIBLE,
          ineligibleReason: ElectorateIneligibleReason.NO_REPRESENTATIVE,
          votingWeight: 0.3,
        });
      });
    });
  });
});
