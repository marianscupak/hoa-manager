import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';

import { VotesController } from './api/votes.controller';
import { AuthModule } from '../core/auth/auth.module';
import { IdentityModule } from '../core/identity/identity.module';
import { TenancyModule } from '../core/tenancy/tenancy.module';
import { CreateVoteHandler } from './application/commands/create-vote/create-vote.handler';
import { CreateVoteConsentHandler } from './application/commands/create-vote-consent/create-vote-consent.handler';
import { CreateVoteQuestionHandler } from './application/commands/create-vote-question/create-vote-question.handler';
import { DeleteVoteQuestionHandler } from './application/commands/delete-vote-question/delete-vote-question.handler';
import { RevokeConsentHandler } from './application/commands/revoke-consent/revoke-consent.handler';
import { ScheduleVoteHandler } from './application/commands/schedule-vote/schedule-vote.handler';
import { SetVoteRulesetHandler } from './application/commands/set-vote-ruleset/set-vote-ruleset.handler';
import { UpdateVoteHandler } from './application/commands/update-vote/update-vote.handler';
import { UpdateVoteQuestionHandler } from './application/commands/update-vote-question/update-vote-question.handler';
import { VOTE_CONSENT_WRITE_REPOSITORY } from './application/ports/vote-consent-write.repository.port';
import { VOTE_READ_REPOSITORY } from './application/ports/vote-read.repository.port';
import { VOTE_WRITE_REPOSITORY } from './application/ports/vote-write.repository.port';
import { GetConsentsHandler } from './application/queries/get-consents/get-consents.handler';
import { GetDelegationCandidatesHandler } from './application/queries/get-delegation-candidates/get-delegation-candidates.handler';
import { GetVoteDetailHandler } from './application/queries/get-vote-detail/get-vote-detail.handler';
import { GetVoterStatusHandler } from './application/queries/get-voter-status/get-voter-status.handler';
import { GetVotesHandler } from './application/queries/get-votes/get-votes.handler';
import { DrizzleVoteConsentWriteRepository } from './infrastructure/persistence/drizzle-vote-consent-write.repository';
import { DrizzleVoteReadRepository } from './infrastructure/persistence/drizzle-vote-read.repository';
import { DrizzleVoteWriteRepository } from './infrastructure/persistence/drizzle-vote-write.repository';

const COMMAND_HANDLERS = [
  CreateVoteHandler,
  SetVoteRulesetHandler,
  CreateVoteQuestionHandler,
  UpdateVoteQuestionHandler,
  DeleteVoteQuestionHandler,
  UpdateVoteHandler,
  ScheduleVoteHandler,
  CreateVoteConsentHandler,
  RevokeConsentHandler,
];
const QUERY_HANDLERS = [
  GetVoteDetailHandler,
  GetVotesHandler,
  GetVoterStatusHandler,
  GetDelegationCandidatesHandler,
  GetConsentsHandler,
];
const REPOSITORIES = [
  { provide: VOTE_WRITE_REPOSITORY, useClass: DrizzleVoteWriteRepository },
  { provide: VOTE_READ_REPOSITORY, useClass: DrizzleVoteReadRepository },
  {
    provide: VOTE_CONSENT_WRITE_REPOSITORY,
    useClass: DrizzleVoteConsentWriteRepository,
  },
  DrizzleUnitOfWork,
];

@Module({
  imports: [CqrsModule, IdentityModule, AuthModule, TenancyModule],
  controllers: [VotesController],
  providers: [...COMMAND_HANDLERS, ...QUERY_HANDLERS, ...REPOSITORIES],
})
export class VotingModule {}
