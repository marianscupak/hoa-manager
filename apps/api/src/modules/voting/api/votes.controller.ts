import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { VoteActivityResponseDto } from './dto/vote-activity.dto';
import { VoteAuditExportDto } from './dto/vote-audit-export.dto';
import {
  CreateVoteDto,
  CreateVoteQuestionDto,
  CreateVoteResponseDto,
  DocumentDownloadUrlResponseDto,
  RequestDocumentUploadDto,
  RequestDocumentUploadResponseDto,
  SetVoteRulesetDto,
  SetVoteRulesetResponseDto,
  UpdateVoteQuestionDto,
  VoteDetailResponseDto,
  VoteListItemResponseDto,
  VoterStatusResponseDto,
  UpdateVoteDto,
  DelegationCandidateDto,
  ConsentPreviewResponseDto,
  CreateVoteConsentDto,
  VoteConsentResponseDto,
  SubmitBallotDto,
  SubmitBallotResponseDto,
  VoteResultsResponseDto,
  VoteTurnoutResponseDto,
} from './dto/vote.dto';
import {
  CurrentAuthUser,
  Roles,
  Tenant,
} from '../../../shared/api/decorators/auth.decorators';
import { AccessTokenAuthGuard } from '../../../shared/api/guards/access-token-auth.guard';
import { RolesGuard } from '../../../shared/api/guards/roles.guard';
import { TenantContextGuard } from '../../../shared/api/guards/tenant-context.guard';
import { type AuthPrincipal } from '../../../shared/domain/auth-principal';
import { type TenantContext } from '../../../shared/domain/tenant-context';
import { TenantMembershipRole } from '../../core/tenancy/domain/tenant.entity';
import { CloseVoteCommand } from '../application/commands/close-vote/close-vote.command';
import { ConfirmDocumentUploadCommand } from '../application/commands/confirm-document-upload/confirm-document-upload.command';
import { CreateVoteCommand } from '../application/commands/create-vote/create-vote.command';
import { CreateVoteConsentCommand } from '../application/commands/create-vote-consent/create-vote-consent.command';
import { CreateVoteQuestionCommand } from '../application/commands/create-vote-question/create-vote-question.command';
import { DeleteVoteCommand } from '../application/commands/delete-vote/delete-vote.command';
import { DeleteVoteDocumentCommand } from '../application/commands/delete-vote-document/delete-vote-document.command';
import { DeleteVoteQuestionCommand } from '../application/commands/delete-vote-question/delete-vote-question.command';
import { RequestDocumentUploadCommand } from '../application/commands/request-document-upload/request-document-upload.command';
import { RevokeConsentCommand } from '../application/commands/revoke-consent/revoke-consent.command';
import { ScheduleVoteCommand } from '../application/commands/schedule-vote/schedule-vote.command';
import { SetVoteRulesetCommand } from '../application/commands/set-vote-ruleset/set-vote-ruleset.command';
import { SubmitBallotCommand } from '../application/commands/submit-ballot/submit-ballot.command';
import { UpdateVoteCommand } from '../application/commands/update-vote/update-vote.command';
import { UpdateVoteQuestionCommand } from '../application/commands/update-vote-question/update-vote-question.command';
import { GetConsentsQuery } from '../application/queries/get-consents/get-consents.query';
import { GetDelegationCandidatesQuery } from '../application/queries/get-delegation-candidates/get-delegation-candidates.query';
import { GetDocumentDownloadUrlQuery } from '../application/queries/get-document-download-url/get-document-download-url.query';
import { GetVoteActivityQuery } from '../application/queries/get-vote-activity/get-vote-activity.query';
import { GetVoteAuditExportQuery } from '../application/queries/get-vote-audit-export/get-vote-audit-export.query';
import { GetVoteDetailQuery } from '../application/queries/get-vote-detail/get-vote-detail.query';
import { GetVoteResultsQuery } from '../application/queries/get-vote-results/get-vote-results.query';
import { GetVoteTurnoutQuery } from '../application/queries/get-vote-turnout/get-vote-turnout.query';
import { GetVoterStatusQuery } from '../application/queries/get-voter-status/get-voter-status.query';
import { GetVotesQuery } from '../application/queries/get-votes/get-votes.query';
import { PreviewConsentOutcomeQuery } from '../application/queries/preview-consent-outcome/preview-consent-outcome.query';

function parsePrimaryLanguage(header: string | undefined): string | undefined {
  if (!header) return undefined;
  const primary = header
    .split(',')[0]
    ?.split(';')[0]
    ?.split('-')[0]
    ?.trim()
    .toLowerCase();
  return primary || undefined;
}

@ApiTags('Votes')
@Controller('votes')
export class VotesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Returns a list of votes',
    type: [VoteListItemResponseDto],
  })
  @ApiQuery({ name: 'status', required: false, isArray: true, type: String })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard)
  getVotes(
    @Tenant() tenantCtx: TenantContext,
    @Query('status') status?: string | string[],
  ) {
    const statuses = Array.isArray(status)
      ? status
      : status
        ? [status]
        : undefined;

    return this.queryBus.execute(
      new GetVotesQuery(
        tenantCtx.tenantId,
        tenantCtx.roles,
        tenantCtx.membershipId,
        statuses,
      ),
    );
  }

  @Get('consents')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Returns a list of delegation consents',
    type: [VoteConsentResponseDto],
  })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard)
  getConsents(@Tenant() tenantCtx: TenantContext) {
    return this.queryBus.execute(
      new GetConsentsQuery(
        tenantCtx.tenantId,
        tenantCtx.roles,
        tenantCtx.membershipId,
      ),
    );
  }

  @Patch('consents/:id/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Consent revoked' })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard)
  revokeConsent(
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant() tenantCtx: TenantContext,
  ) {
    return this.commandBus.execute(
      new RevokeConsentCommand(
        tenantCtx.tenantId,
        id,
        tenantCtx.roles,
        tenantCtx.membershipId,
      ),
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Returns the vote detail',
    type: VoteDetailResponseDto,
  })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard)
  getVoteDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant() tenantCtx: TenantContext,
  ) {
    return this.queryBus.execute(
      new GetVoteDetailQuery(tenantCtx.tenantId, id, tenantCtx.roles),
    );
  }

  @Get(':id/voter-status')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Returns the voter status for the given vote',
    type: VoterStatusResponseDto,
  })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard)
  getVoterStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant() tenantCtx: TenantContext,
  ) {
    return this.queryBus.execute(
      new GetVoterStatusQuery(tenantCtx.tenantId, id, tenantCtx.membershipId),
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'Returns the created vote',
    type: CreateVoteResponseDto,
  })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard, RolesGuard)
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  createVote(@Body() body: CreateVoteDto, @Tenant() tenantCtx: TenantContext) {
    return this.commandBus.execute(
      new CreateVoteCommand(tenantCtx.tenantId, tenantCtx.membershipId, body),
    );
  }

  @Put(':id/ruleset')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Returns the configured vote ruleset',
    type: SetVoteRulesetResponseDto,
  })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard, RolesGuard)
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  setVoteRuleset(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SetVoteRulesetDto,
    @Tenant() tenantCtx: TenantContext,
  ) {
    return this.commandBus.execute(
      new SetVoteRulesetCommand(tenantCtx.tenantId, id, body),
    );
  }

  @Post(':id/questions')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Question created' })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard, RolesGuard)
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  createVoteQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateVoteQuestionDto,
    @Tenant() tenantCtx: TenantContext,
  ) {
    return this.commandBus.execute(
      new CreateVoteQuestionCommand(
        tenantCtx.tenantId,
        id,
        tenantCtx.membershipId,
        body,
      ),
    );
  }

  @Patch(':id/questions/:questionId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Question updated' })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard, RolesGuard)
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  updateVoteQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() body: UpdateVoteQuestionDto,
    @Tenant() tenantCtx: TenantContext,
  ) {
    return this.commandBus.execute(
      new UpdateVoteQuestionCommand(tenantCtx.tenantId, id, questionId, body),
    );
  }

  @Delete(':id/questions/:questionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Question deleted' })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard, RolesGuard)
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  deleteVoteQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Tenant() tenantCtx: TenantContext,
  ) {
    return this.commandBus.execute(
      new DeleteVoteQuestionCommand(tenantCtx.tenantId, id, questionId),
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Returns the updated vote',
    type: CreateVoteResponseDto,
  })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard, RolesGuard)
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  updateVote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateVoteDto,
    @Tenant() tenantCtx: TenantContext,
  ) {
    return this.commandBus.execute(
      new UpdateVoteCommand(tenantCtx.tenantId, id, body),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Draft vote deleted' })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard, RolesGuard)
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  deleteVote(
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant() tenantCtx: TenantContext,
  ) {
    return this.commandBus.execute(
      new DeleteVoteCommand(tenantCtx.tenantId, id),
    );
  }

  @Post(':id/schedule')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Returns the scheduled vote',
    type: CreateVoteResponseDto,
  })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard, RolesGuard)
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  scheduleVote(
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant() tenantCtx: TenantContext,
  ) {
    return this.commandBus.execute(
      new ScheduleVoteCommand(tenantCtx.tenantId, id),
    );
  }

  @Get(':id/delegation-candidates')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Returns a list of memberships eligible for delegation for this unit',
    type: [DelegationCandidateDto],
  })
  @ApiQuery({ name: 'forMembershipId', required: false, type: String })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard)
  getDelegationCandidates(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('unitId', ParseUUIDPipe) unitId: string,
    @Query('forMembershipId', new ParseUUIDPipe({ optional: true }))
    forMembershipId: string | undefined,
    @Tenant() tenantCtx: TenantContext,
  ) {
    return this.queryBus.execute(
      new GetDelegationCandidatesQuery(
        tenantCtx.tenantId,
        id,
        unitId,
        tenantCtx.membershipId,
        forMembershipId,
      ),
    );
  }

  @Get(':id/consents/preview')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Previews what recording this consent would do to the unit, so the ' +
      'delegation flow can warn before it is saved',
    type: ConsentPreviewResponseDto,
  })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard)
  previewConsentOutcome(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('unitId', ParseUUIDPipe) unitId: string,
    @Query('delegateMembershipId', ParseUUIDPipe) delegateMembershipId: string,
    @Tenant() tenantCtx: TenantContext,
  ) {
    return this.queryBus.execute(
      new PreviewConsentOutcomeQuery(
        tenantCtx.tenantId,
        id,
        unitId,
        delegateMembershipId,
        tenantCtx.membershipId,
      ),
    );
  }

  @Post(':id/consents')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Records a delegation consent for a specific unit',
  })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard)
  createVoteConsent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateVoteConsentDto,
    @Tenant() tenantCtx: TenantContext,
  ) {
    return this.commandBus.execute(
      new CreateVoteConsentCommand(
        tenantCtx.tenantId,
        id,
        body.unitId,
        tenantCtx.membershipId,
        body.delegateMembershipId,
        tenantCtx.roles,
        body.fromOwnerId,
      ),
    );
  }

  @Post(':id/ballots')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Submits ballots for the authenticated user',
    type: SubmitBallotResponseDto,
  })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard)
  submitBallot(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SubmitBallotDto,
    @Tenant() tenantCtx: TenantContext,
  ) {
    return this.commandBus.execute(
      new SubmitBallotCommand(
        tenantCtx.tenantId,
        id,
        tenantCtx.membershipId,
        body.ballots,
      ),
    );
  }

  @Get(':id/results')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Returns the computed results for a closed vote',
    type: VoteResultsResponseDto,
  })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard)
  getVoteResults(
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant() tenantCtx: TenantContext,
  ) {
    return this.queryBus.execute(
      new GetVoteResultsQuery(tenantCtx.tenantId, id),
    );
  }

  @Get(':id/turnout')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Turnout for an open or closed vote',
    type: VoteTurnoutResponseDto,
  })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard, RolesGuard)
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  getVoteTurnout(
    @Tenant() tenantCtx: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<VoteTurnoutResponseDto> {
    return this.queryBus.execute(
      new GetVoteTurnoutQuery(tenantCtx.tenantId, id),
    );
  }

  @Get(':id/activity')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard)
  @ApiOkResponse({ type: VoteActivityResponseDto })
  getActivity(
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant() tenantCtx: TenantContext,
    @CurrentAuthUser() user: AuthPrincipal,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<VoteActivityResponseDto> {
    const language =
      parsePrimaryLanguage(acceptLanguage) ?? user.preferredLanguage ?? 'cs';

    return this.queryBus.execute(
      new GetVoteActivityQuery(
        tenantCtx.tenantId,
        id,
        user.userId,
        tenantCtx.roles,
        language,
      ),
    );
  }

  @Get(':id/audit-export')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard, RolesGuard)
  @Roles(
    TenantMembershipRole.ADMIN,
    TenantMembershipRole.BOARD_MEMBER,
    TenantMembershipRole.AUDITOR,
  )
  @ApiOkResponse({ type: VoteAuditExportDto })
  getAuditExport(
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant() tenantCtx: TenantContext,
  ): Promise<VoteAuditExportDto> {
    return this.queryBus.execute(
      new GetVoteAuditExportQuery(
        tenantCtx.tenantId,
        id,
        tenantCtx.membershipId,
        tenantCtx.roles,
      ),
    );
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Vote closed manually' })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard, RolesGuard)
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  closeVote(
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant() tenantCtx: TenantContext,
  ) {
    return this.commandBus.execute(
      new CloseVoteCommand(tenantCtx.tenantId, id, tenantCtx.membershipId),
    );
  }

  @Post(':id/documents')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'Returns the document id and a presigned upload URL',
    type: RequestDocumentUploadResponseDto,
  })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard, RolesGuard)
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  requestDocumentUpload(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RequestDocumentUploadDto,
    @Tenant() tenantCtx: TenantContext,
  ) {
    return this.commandBus.execute(
      new RequestDocumentUploadCommand(
        tenantCtx.tenantId,
        id,
        tenantCtx.membershipId,
        body,
      ),
    );
  }

  @Post(':id/documents/:documentId/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Upload confirmed' })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard, RolesGuard)
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  confirmDocumentUpload(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Tenant() tenantCtx: TenantContext,
  ) {
    return this.commandBus.execute(
      new ConfirmDocumentUploadCommand(tenantCtx.tenantId, id, documentId),
    );
  }

  @Delete(':id/documents/:documentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Document deleted' })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard, RolesGuard)
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  deleteVoteDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Tenant() tenantCtx: TenantContext,
  ) {
    return this.commandBus.execute(
      new DeleteVoteDocumentCommand(tenantCtx.tenantId, id, documentId),
    );
  }

  @Get(':id/documents/:documentId/download-url')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Returns a short-lived presigned download URL',
    type: DocumentDownloadUrlResponseDto,
  })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard)
  getDocumentDownloadUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Tenant() tenantCtx: TenantContext,
  ) {
    return this.queryBus.execute(
      new GetDocumentDownloadUrlQuery(
        tenantCtx.tenantId,
        id,
        documentId,
        tenantCtx.roles,
      ),
    );
  }
}
