import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';

import { VotesController } from './api/votes.controller';
import { CreateVoteHandler } from './application/commands/create-vote/create-vote.handler';
import { SetVoteRulesetHandler } from './application/commands/set-vote-ruleset/set-vote-ruleset.handler';
import { VOTE_WRITE_REPOSITORY } from './application/ports/vote-write.repository.port';
import { DrizzleVoteWriteRepository } from './infrastructure/persistence/drizzle-vote-write.repository';
import { AuthModule } from '../core/auth/auth.module';
import { IdentityModule } from '../core/identity/identity.module';
import { TenancyModule } from '../core/tenancy/tenancy.module';

const COMMAND_HANDLERS = [CreateVoteHandler, SetVoteRulesetHandler];
const REPOSITORIES = [
  { provide: VOTE_WRITE_REPOSITORY, useClass: DrizzleVoteWriteRepository },
  DrizzleUnitOfWork,
];

@Module({
  imports: [CqrsModule, IdentityModule, AuthModule, TenancyModule],
  controllers: [VotesController],
  providers: [...COMMAND_HANDLERS, ...REPOSITORIES],
})
export class VotingModule {}
