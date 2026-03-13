import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GetVoterStatusQuery } from './get-voter-status.query';
import { VoterStatusResponseDto } from '../../../api/dto/vote.dto';

@QueryHandler(GetVoterStatusQuery)
export class GetVoterStatusHandler
  implements IQueryHandler<GetVoterStatusQuery, VoterStatusResponseDto>
{
  async execute(_query: GetVoterStatusQuery): Promise<VoterStatusResponseDto> {
    // TODO: This is currently mocked for membershipId: ${_query.membershipId}.
    // In a real implementation, we would query the read models to determine
    // the true units owned by `query.membershipId`, calculate their shares,
    // and ascertain if delegation is required for any co-owned units.

    return {
      canVote: true,
      totalVotingPower: {
        value: 50,
        maximum: 1000,
      },
      owningUnits: [
        {
          id: '1',
          name: 'Unit A12',
          share: '50/1000',
          status: 'READY',
        },
        {
          id: '2',
          name: 'Garage G04',
          share: '20/1000',
          status: 'REQUIRES_DELEGATION',
          statusMessage:
            'Garage G04 is co-owned. A delegation form is required.',
        },
      ],
    };
  }
}
