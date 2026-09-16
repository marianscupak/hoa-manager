import { Test, TestingModule } from '@nestjs/testing';

import {
  OwnerKind,
  OwnershipPartyType,
} from '@/modules/core/property/domain/ownership-plan';
import { VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';
import {
  ElectorateEligibilityStatus,
  VoteWeightBasis,
} from '@/modules/voting/domain/vote/vote.types';

import { ElectorateDomainService } from './electorate.service';
import {
  ELECTORATE_DATA_REPOSITORY,
  ElectorateDataRepository,
} from '../ports/electorate-data.repository.port';

/**
 * The resolution rules themselves live in (and are covered by)
 * `electorate-resolution.spec.ts`. This service is only the wiring: repo
 * rows in, domain rows out.
 */
describe('ElectorateDomainService', () => {
  let service: ElectorateDomainService;
  let dataRepo: jest.Mocked<ElectorateDataRepository>;

  const defaultTenantId = 'tenant-1';
  const defaultVoteId = 'vote-1';
  const NOW = new Date('2026-09-04T10:00:00Z');

  const voteWith = (ruleset?: { weightBasis: VoteWeightBasis }) =>
    ({
      id: defaultVoteId,
      tenantId: defaultTenantId,
      ruleset,
    }) as VoteAggregate;

  beforeEach(async () => {
    dataRepo = {
      findAllUnits: jest.fn(),
      findOwnershipParties: jest.fn(),
      findValidConsents: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElectorateDomainService,
        { provide: ELECTORATE_DATA_REPOSITORY, useValue: dataRepo },
      ],
    }).compile();

    service = module.get<ElectorateDomainService>(ElectorateDomainService);
  });

  it('feeds repository rows through the resolver and returns domain rows', async () => {
    dataRepo.findAllUnits.mockResolvedValue([
      { id: 'u1', buildingShareNumerator: 1, buildingShareDenominator: 4 },
    ]);
    dataRepo.findOwnershipParties.mockResolvedValue([
      {
        ownershipId: 'o1',
        unitId: 'u1',
        partyType: OwnershipPartyType.SOLE,
        shareNumerator: 1,
        shareDenominator: 1,
        members: [
          { ownerId: 'own-1', ownerKind: OwnerKind.PERSON, membershipId: 'm1' },
        ],
      },
    ]);
    dataRepo.findValidConsents.mockResolvedValue([]);

    const result = await service.resolveElectorate(
      voteWith({ weightBasis: VoteWeightBasis.ONE_UNIT_ONE_VOTE }),
      NOW,
    );

    expect(dataRepo.findAllUnits).toHaveBeenCalledWith(defaultTenantId);
    expect(dataRepo.findOwnershipParties).toHaveBeenCalledWith(
      defaultTenantId,
      NOW,
    );
    expect(dataRepo.findValidConsents).toHaveBeenCalledWith(
      defaultTenantId,
      defaultVoteId,
    );
    expect(result).toEqual([
      {
        unitId: 'u1',
        representativeMembershipId: 'm1',
        eligibilityStatus: ElectorateEligibilityStatus.ELIGIBLE,
        ineligibleReason: null,
        weightNum: 1,
        weightDen: 1,
      },
    ]);
  });

  it('defaults to UNIT_SHARE weighting when the vote has no ruleset yet', async () => {
    dataRepo.findAllUnits.mockResolvedValue([
      { id: 'u1', buildingShareNumerator: 225, buildingShareDenominator: 1332 },
    ]);
    dataRepo.findOwnershipParties.mockResolvedValue([]);
    dataRepo.findValidConsents.mockResolvedValue([]);

    const result = await service.resolveElectorate(voteWith(), NOW);

    expect(result[0].weightNum).toBe(25);
    expect(result[0].weightDen).toBe(148);
  });

  it('resolves ownership as of the date it is given, not today', async () => {
    // The assembly record's "as of the meeting date" decision rests entirely
    // on this argument reaching `findOwnershipParties`. If the service ever
    // stops passing it through, a published record would quietly describe
    // today's owners instead of the ones who were in the room.
    const meetingDate = new Date('2026-09-12T18:30:00Z');
    dataRepo.findAllUnits.mockResolvedValue([]);
    dataRepo.findOwnershipParties.mockResolvedValue([]);
    dataRepo.findValidConsents.mockResolvedValue([]);

    await service.resolveElectorate(voteWith(), meetingDate);

    expect(dataRepo.findOwnershipParties).toHaveBeenCalledWith(
      defaultTenantId,
      meetingDate,
    );
  });
});
