import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ScheduleModule } from '@nestjs/schedule';

import { ConfigModule } from '@/infrastructure/config/config.module';
import { AuditModule } from '@/modules/core/audit/audit.module';
import { DeleteAssemblyBallotHandler } from '@/modules/voting/application/commands/delete-assembly-ballot/delete-assembly-ballot.handler';
import { PublishAssemblyRecordHandler } from '@/modules/voting/application/commands/publish-assembly-record/publish-assembly-record.handler';
import { RecordAssemblyBallotHandler } from '@/modules/voting/application/commands/record-assembly-ballot/record-assembly-ballot.handler';
import { SetUnitAttendanceHandler } from '@/modules/voting/application/commands/set-unit-attendance/set-unit-attendance.handler';
import { VOTE_ATTENDANCE_REPOSITORY } from '@/modules/voting/application/ports/vote-attendance.repository.port';
import { DrizzleVoteAttendanceRepository } from '@/modules/voting/infrastructure/persistence/drizzle-vote-attendance.repository';

import { VotesController } from './api/votes.controller';
import { VotingAuditLabelResolver } from './audit/label-resolver.service';
import { VotingAuditFormatter } from './audit/voting-audit-formatter';
import { VotingAuditRegistration } from './audit/voting-audit.registration';
import { AuthModule } from '../core/auth/auth.module';
import { IdentityModule } from '../core/identity/identity.module';
import { TenancyModule } from '../core/tenancy/tenancy.module';
import { CloseVoteCommandHandler } from './application/commands/close-vote/close-vote.handler';
import { ConfirmDocumentUploadHandler } from './application/commands/confirm-document-upload/confirm-document-upload.handler';
import { CreateVoteHandler } from './application/commands/create-vote/create-vote.handler';
import { CreateVoteConsentHandler } from './application/commands/create-vote-consent/create-vote-consent.handler';
import { CreateVoteQuestionHandler } from './application/commands/create-vote-question/create-vote-question.handler';
import { DeleteBallotAttachmentHandler } from './application/commands/delete-ballot-attachment/delete-ballot-attachment.handler';
import { DeleteVoteHandler } from './application/commands/delete-vote/delete-vote.handler';
import { DeleteVoteDocumentHandler } from './application/commands/delete-vote-document/delete-vote-document.handler';
import { DeleteVoteQuestionHandler } from './application/commands/delete-vote-question/delete-vote-question.handler';
import { OpenVoteCommandHandler } from './application/commands/open-vote/open-vote.handler';
import { RecordPaperBallotHandler } from './application/commands/record-paper-ballot/record-paper-ballot.handler';
import { RequestBallotAttachmentUploadHandler } from './application/commands/request-ballot-attachment-upload/request-ballot-attachment-upload.handler';
import { RequestDocumentUploadHandler } from './application/commands/request-document-upload/request-document-upload.handler';
import { RevokeConsentHandler } from './application/commands/revoke-consent/revoke-consent.handler';
import { ScheduleVoteHandler } from './application/commands/schedule-vote/schedule-vote.handler';
import { SetVoteRulesetHandler } from './application/commands/set-vote-ruleset/set-vote-ruleset.handler';
import { SubmitBallotHandler } from './application/commands/submit-ballot/submit-ballot.handler';
import { UpdateVoteHandler } from './application/commands/update-vote/update-vote.handler';
import { UpdateVoteQuestionHandler } from './application/commands/update-vote-question/update-vote-question.handler';
import { DOCUMENT_STORAGE } from './application/ports/document-storage.port';
import { ELECTORATE_DATA_REPOSITORY } from './application/ports/electorate-data.repository.port';
import { ELECTORATE_SERVICE } from './application/ports/electorate-service.port';
import { RESULT_CALCULATION_DATA_REPOSITORY } from './application/ports/result-calculation-data.repository.port';
import { RESULT_CALCULATION_SERVICE } from './application/ports/result-calculation.service.port';
import { VOTE_CONSENT_WRITE_REPOSITORY } from './application/ports/vote-consent-write.repository.port';
import { VOTE_DOCUMENT_REPOSITORY } from './application/ports/vote-document.repository.port';
import { VOTE_READ_REPOSITORY } from './application/ports/vote-read.repository.port';
import { VOTE_WRITE_REPOSITORY } from './application/ports/vote-write.repository.port';
import { GetBallotAttachmentDownloadUrlHandler } from './application/queries/get-ballot-attachment-download-url/get-ballot-attachment-download-url.handler';
import { GetConsentsHandler } from './application/queries/get-consents/get-consents.handler';
import { GetDelegationCandidatesHandler } from './application/queries/get-delegation-candidates/get-delegation-candidates.handler';
import { GetDocumentDownloadUrlHandler } from './application/queries/get-document-download-url/get-document-download-url.handler';
import { GetVoteActivityHandler } from './application/queries/get-vote-activity/get-vote-activity.handler';
import { GetVoteAuditExportHandler } from './application/queries/get-vote-audit-export/get-vote-audit-export.handler';
import { GetVoteDetailHandler } from './application/queries/get-vote-detail/get-vote-detail.handler';
import { GetVoteParticipationHandler } from './application/queries/get-vote-participation/get-vote-participation.handler';
import { GetVoteResultsHandler } from './application/queries/get-vote-results/get-vote-results.handler';
import { GetVoteTallyHandler } from './application/queries/get-vote-tally/get-vote-tally.handler';
import { GetVoteTurnoutHandler } from './application/queries/get-vote-turnout/get-vote-turnout.handler';
import { GetVoterStatusHandler } from './application/queries/get-voter-status/get-voter-status.handler';
import { GetVotesHandler } from './application/queries/get-votes/get-votes.handler';
import { PreviewConsentOutcomeHandler } from './application/queries/preview-consent-outcome/preview-consent-outcome.handler';
import { ElectorateDomainService } from './application/services/electorate.service';
import { ResultCalculationDomainService } from './application/services/result-calculation.service';
import { TenantLookup } from './audit/exporter/tenant.lookup';
import { VoteAuditExporterService } from './audit/exporter/vote-audit-exporter.service';
import { VoteElectorateSnapshotLookup } from './audit/exporter/vote-electorate-snapshot.lookup';
import { DrizzleElectorateDataRepository } from './infrastructure/persistence/drizzle-electorate-data.repository';
import { DrizzleResultCalculationDataRepository } from './infrastructure/persistence/drizzle-result-calculation-data.repository';
import { DrizzleVoteConsentWriteRepository } from './infrastructure/persistence/drizzle-vote-consent-write.repository';
import { DrizzleVoteDocumentRepository } from './infrastructure/persistence/drizzle-vote-document.repository';
import { DrizzleVoteReadRepository } from './infrastructure/persistence/drizzle-vote-read.repository';
import { DrizzleVoteWriteRepository } from './infrastructure/persistence/drizzle-vote-write.repository';
import { R2DocumentStorageService } from './infrastructure/storage/r2-document-storage.service';
import { VoteDocumentCleanupService } from './infrastructure/vote-document-cleanup.service';
import { VoteSchedulerService } from './infrastructure/vote-scheduler.service';

const COMMAND_HANDLERS = [
  PublishAssemblyRecordHandler,
  RecordAssemblyBallotHandler,
  DeleteAssemblyBallotHandler,
  SetUnitAttendanceHandler,
  CloseVoteCommandHandler,
  CreateVoteHandler,
  SetVoteRulesetHandler,
  CreateVoteQuestionHandler,
  UpdateVoteQuestionHandler,
  DeleteVoteQuestionHandler,
  DeleteVoteHandler,
  UpdateVoteHandler,
  ScheduleVoteHandler,
  CreateVoteConsentHandler,
  RevokeConsentHandler,
  OpenVoteCommandHandler,
  SubmitBallotHandler,
  RecordPaperBallotHandler,
  RequestDocumentUploadHandler,
  ConfirmDocumentUploadHandler,
  DeleteVoteDocumentHandler,
  RequestBallotAttachmentUploadHandler,
  DeleteBallotAttachmentHandler,
];
const QUERY_HANDLERS = [
  GetVoteDetailHandler,
  GetVotesHandler,
  GetVoterStatusHandler,
  GetDelegationCandidatesHandler,
  PreviewConsentOutcomeHandler,
  GetConsentsHandler,
  GetVoteResultsHandler,
  GetVoteActivityHandler,
  GetVoteAuditExportHandler,
  GetVoteTurnoutHandler,
  GetVoteTallyHandler,
  GetVoteParticipationHandler,
  GetDocumentDownloadUrlHandler,
  GetBallotAttachmentDownloadUrlHandler,
];
const REPOSITORIES = [
  { provide: VOTE_WRITE_REPOSITORY, useClass: DrizzleVoteWriteRepository },
  {
    provide: VOTE_ATTENDANCE_REPOSITORY,
    useClass: DrizzleVoteAttendanceRepository,
  },
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
  {
    provide: VOTE_DOCUMENT_REPOSITORY,
    useClass: DrizzleVoteDocumentRepository,
  },
  { provide: DOCUMENT_STORAGE, useClass: R2DocumentStorageService },
  VoteSchedulerService,
  VoteDocumentCleanupService,
];

@Module({
  imports: [
    CqrsModule,
    ScheduleModule,
    IdentityModule,
    AuthModule,
    TenancyModule,
    AuditModule,
    ConfigModule,
  ],
  controllers: [VotesController],
  providers: [
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
    ...REPOSITORIES,
    VotingAuditLabelResolver,
    VotingAuditRegistration,
    VotingAuditFormatter,
    VoteAuditExporterService,
    VoteElectorateSnapshotLookup,
    TenantLookup,
  ],
})
export class VotingModule {}
