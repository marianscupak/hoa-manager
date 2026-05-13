import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ScheduleModule } from '@nestjs/schedule';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import { AuditModule } from '@/modules/core/audit/audit.module';

import { VotesController } from './api/votes.controller';
import { VotingAuditLabelResolver } from './audit/label-resolver.service';
import { VotingTimelineProjector } from './audit/projections/voting-timeline.projector';
import { VotingAuditRegistration } from './audit/voting-audit.registration';
import { AuthModule } from '../core/auth/auth.module';
import { IdentityModule } from '../core/identity/identity.module';
import { TenancyModule } from '../core/tenancy/tenancy.module';
import { CloseVoteCommandHandler } from './application/commands/close-vote/close-vote.handler';
import { CreateVoteHandler } from './application/commands/create-vote/create-vote.handler';
import { CreateVoteConsentHandler } from './application/commands/create-vote-consent/create-vote-consent.handler';
import { CreateVoteQuestionHandler } from './application/commands/create-vote-question/create-vote-question.handler';
import { DeleteVoteQuestionHandler } from './application/commands/delete-vote-question/delete-vote-question.handler';
import { OpenVoteCommandHandler } from './application/commands/open-vote/open-vote.handler';
import { RevokeConsentHandler } from './application/commands/revoke-consent/revoke-consent.handler';
import { ScheduleVoteHandler } from './application/commands/schedule-vote/schedule-vote.handler';
import { SetVoteRulesetHandler } from './application/commands/set-vote-ruleset/set-vote-ruleset.handler';
import { SubmitBallotHandler } from './application/commands/submit-ballot/submit-ballot.handler';
import { UpdateVoteHandler } from './application/commands/update-vote/update-vote.handler';
import { UpdateVoteQuestionHandler } from './application/commands/update-vote-question/update-vote-question.handler';
import { ELECTORATE_DATA_REPOSITORY } from './application/ports/electorate-data.repository.port';
import { ELECTORATE_SERVICE } from './application/ports/electorate-service.port';
import { RESULT_CALCULATION_DATA_REPOSITORY } from './application/ports/result-calculation-data.repository.port';
import { RESULT_CALCULATION_SERVICE } from './application/ports/result-calculation.service.port';
import { VOTE_CONSENT_WRITE_REPOSITORY } from './application/ports/vote-consent-write.repository.port';
import { VOTE_READ_REPOSITORY } from './application/ports/vote-read.repository.port';
import { VOTE_WRITE_REPOSITORY } from './application/ports/vote-write.repository.port';
import { GetConsentsHandler } from './application/queries/get-consents/get-consents.handler';
import { GetDelegationCandidatesHandler } from './application/queries/get-delegation-candidates/get-delegation-candidates.handler';
import { GetVoteActivityHandler } from './application/queries/get-vote-activity/get-vote-activity.handler';
import { GetVoteAuditExportHandler } from './application/queries/get-vote-audit-export/get-vote-audit-export.handler';
import { GetVoteDetailHandler } from './application/queries/get-vote-detail/get-vote-detail.handler';
import { GetVoteResultsHandler } from './application/queries/get-vote-results/get-vote-results.handler';
import { GetVoterStatusHandler } from './application/queries/get-voter-status/get-voter-status.handler';
import { GetVotesHandler } from './application/queries/get-votes/get-votes.handler';
import { ElectorateDomainService } from './application/services/electorate.service';
import { ResultCalculationDomainService } from './application/services/result-calculation.service';
import { TenantLookup } from './audit/exporter/tenant.lookup';
import { VoteAuditExporterService } from './audit/exporter/vote-audit-exporter.service';
import { VoteElectorateSnapshotLookup } from './audit/exporter/vote-electorate-snapshot.lookup';
import { DrizzleElectorateDataRepository } from './infrastructure/persistence/drizzle-electorate-data.repository';
import { DrizzleResultCalculationDataRepository } from './infrastructure/persistence/drizzle-result-calculation-data.repository';
import { DrizzleVoteConsentWriteRepository } from './infrastructure/persistence/drizzle-vote-consent-write.repository';
import { DrizzleVoteReadRepository } from './infrastructure/persistence/drizzle-vote-read.repository';
import { DrizzleVoteWriteRepository } from './infrastructure/persistence/drizzle-vote-write.repository';
import { VoteSchedulerService } from './infrastructure/vote-scheduler.service';

const COMMAND_HANDLERS = [
  CloseVoteCommandHandler,
  CreateVoteHandler,
  SetVoteRulesetHandler,
  CreateVoteQuestionHandler,
  UpdateVoteQuestionHandler,
  DeleteVoteQuestionHandler,
  UpdateVoteHandler,
  ScheduleVoteHandler,
  CreateVoteConsentHandler,
  RevokeConsentHandler,
  OpenVoteCommandHandler,
  SubmitBallotHandler,
];
const QUERY_HANDLERS = [
  GetVoteDetailHandler,
  GetVotesHandler,
  GetVoterStatusHandler,
  GetDelegationCandidatesHandler,
  GetConsentsHandler,
  GetVoteResultsHandler,
  GetVoteActivityHandler,
  GetVoteAuditExportHandler,
];
const REPOSITORIES = [
  { provide: VOTE_WRITE_REPOSITORY, useClass: DrizzleVoteWriteRepository },
  { provide: VOTE_READ_REPOSITORY, useClass: DrizzleVoteReadRepository },
  {
    provide: VOTE_CONSENT_WRITE_REPOSITORY,
    useClass: DrizzleVoteConsentWriteRepository,
  },
  {
    provide: ELECTORATE_DATA_REPOSITORY,
    useClass: DrizzleElectorateDataRepository,
  },
  { provide: ELECTORATE_SERVICE, useClass: ElectorateDomainService },
  {
    provide: RESULT_CALCULATION_DATA_REPOSITORY,
    useClass: DrizzleResultCalculationDataRepository,
  },
  {
    provide: RESULT_CALCULATION_SERVICE,
    useClass: ResultCalculationDomainService,
  },
  DrizzleUnitOfWork,
  VoteSchedulerService,
];

@Module({
  imports: [
    CqrsModule,
    ScheduleModule,
    IdentityModule,
    AuthModule,
    TenancyModule,
    AuditModule,
  ],
  controllers: [VotesController],
  providers: [
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
    ...REPOSITORIES,
    VotingAuditLabelResolver,
    VotingAuditRegistration,
    VotingTimelineProjector,
    VoteAuditExporterService,
    VoteElectorateSnapshotLookup,
    TenantLookup,
  ],
})
export class VotingModule {}
