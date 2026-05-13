import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  AUDIT_EVENT_READ_REPOSITORY,
  type AuditEventReadRepository,
} from '@/modules/core/audit/application/ports/audit-event-read.repository.port';
import { VisibilityPolicyService } from '@/modules/core/audit/application/services/visibility-policy.service';
import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';

import { GetVoteActivityQuery } from './get-vote-activity.query';
import type { VoteActivityResponseDto } from '../../../api/dto/vote-activity.dto';
import { VotingTimelineProjector } from '../../../audit/projections/voting-timeline.projector';
import {
  VOTE_READ_REPOSITORY,
  type VoteReadRepository,
} from '../../ports/vote-read.repository.port';


@QueryHandler(GetVoteActivityQuery)
export class GetVoteActivityHandler
  implements IQueryHandler<GetVoteActivityQuery, VoteActivityResponseDto>
{
  constructor(
    @Inject(VOTE_READ_REPOSITORY)
    private readonly voteReadRepo: VoteReadRepository,
    @Inject(AUDIT_EVENT_READ_REPOSITORY)
    private readonly auditReadRepo: AuditEventReadRepository,
    private readonly visibilityPolicy: VisibilityPolicyService,
    private readonly projector: VotingTimelineProjector,
  ) {}

  async execute(query: GetVoteActivityQuery): Promise<VoteActivityResponseDto> {
    const vote = await this.voteReadRepo.findDetailById(
      query.tenantId,
      query.voteId,
    );
    if (!vote) {
      throw new VoteNotFoundException();
    }

    const events = await this.auditReadRepo.findByAggregate({
      tenantId: query.tenantId,
      aggregateType: 'VOTE',
      aggregateId: query.voteId,
      scope: {
        allowedVisibilities: this.visibilityPolicy.fromRoles(query.viewerRoles),
        alwaysIncludeForActorUserId: query.viewerUserId,
      },
    });

    const entries = this.projector.project(events, {
      viewerUserId: query.viewerUserId,
      viewerRoles: query.viewerRoles,
      viewerLanguage: query.viewerLanguage,
    });

    return { entries };
  }
}
