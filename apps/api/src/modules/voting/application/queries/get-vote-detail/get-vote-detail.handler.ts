import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';

import { GetVoteDetailQuery } from './get-vote-detail.query';
import {
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '../../ports/vote-write.repository.port';

@QueryHandler(GetVoteDetailQuery)
export class GetVoteDetailHandler implements IQueryHandler<GetVoteDetailQuery> {
  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly repository: VoteWriteRepository,
  ) {}

  async execute(query: GetVoteDetailQuery) {
    const vote = await this.repository.findById(query.tenantId, query.id);

    if (!vote) {
      throw new VoteNotFoundException();
    }

    return {
      id: vote.id,
      title: vote.title,
      description: vote.description,
      scheduledFrom: vote.scheduledFrom,
      scheduledTo: vote.scheduledTo,
      status: vote.status,
      ruleset: vote.ruleset
        ? {
            weightBasis: vote.ruleset.weightBasis,
            quorumMeasure: vote.ruleset.quorumMeasure,
            quorumElectorateBasis: vote.ruleset.quorumElectorateBasis,
            quorumThreshold: vote.ruleset.quorumThreshold,
            majorityRuleType: vote.ruleset.majorityRuleType,
            majorityThreshold: vote.ruleset.majorityThreshold,
            allowAbstain: vote.ruleset.allowAbstain,
            abstainExcludedFromMajorityDenominator:
              vote.ruleset.abstainExcludedFromMajorityDenominator,
          }
        : null,
      questions: vote.questions.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        type: q.type,
        sortOrder: q.sortOrder,
        options: q.options.map((o) => ({
          id: o.id,
          label: o.label,
          sortOrder: o.sortOrder,
          optionKey: o.optionKey,
        })),
      })),
    };
  }
}
