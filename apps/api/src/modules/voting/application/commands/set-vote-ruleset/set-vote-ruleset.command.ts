import { type SetVoteRulesetDto } from '@/modules/voting/api/dto/vote.dto';
import { VoteRuleset } from '@/modules/voting/domain/vote/vote.types';

export class SetVoteRulesetCommand {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly data: SetVoteRulesetDto,
  ) {}
}

export type SetVoteRulesetResult = VoteRuleset;
