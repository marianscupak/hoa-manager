import {
  Body,
  Controller,
  Delete,
  Get,
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
  ApiTags,
} from '@nestjs/swagger';

import {
  CreateVoteDto,
  CreateVoteQuestionDto,
  CreateVoteResponseDto,
  SetVoteRulesetDto,
  SetVoteRulesetResponseDto,
  UpdateVoteQuestionDto,
  VoteDetailResponseDto,
  VoteListItemResponseDto,
  VoterStatusResponseDto,
  UpdateVoteDto,
  DelegationCandidateDto,
  CreateVoteConsentDto,
} from './dto/vote.dto';
import { Roles, Tenant } from '../../../shared/api/decorators/auth.decorators';
import { AccessTokenAuthGuard } from '../../../shared/api/guards/access-token-auth.guard';
import { RolesGuard } from '../../../shared/api/guards/roles.guard';
import { TenantContextGuard } from '../../../shared/api/guards/tenant-context.guard';
import { type TenantContext } from '../../../shared/domain/tenant-context';
import { TenantMembershipRole } from '../../core/tenancy/domain/tenant.entity';
import { CreateVoteCommand } from '../application/commands/create-vote/create-vote.command';
import { CreateVoteConsentCommand } from '../application/commands/create-vote-consent/create-vote-consent.command';
import { CreateVoteQuestionCommand } from '../application/commands/create-vote-question/create-vote-question.command';
import { DeleteVoteQuestionCommand } from '../application/commands/delete-vote-question/delete-vote-question.command';
import { ScheduleVoteCommand } from '../application/commands/schedule-vote/schedule-vote.command';
import { SetVoteRulesetCommand } from '../application/commands/set-vote-ruleset/set-vote-ruleset.command';
import { UpdateVoteCommand } from '../application/commands/update-vote/update-vote.command';
import { UpdateVoteQuestionCommand } from '../application/commands/update-vote-question/update-vote-question.command';
import { GetDelegationCandidatesQuery } from '../application/queries/get-delegation-candidates/get-delegation-candidates.query';
import { GetVoteDetailQuery } from '../application/queries/get-vote-detail/get-vote-detail.query';
import { GetVoterStatusQuery } from '../application/queries/get-voter-status/get-voter-status.query';
import { GetVotesQuery } from '../application/queries/get-votes/get-votes.query';

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
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard)
  getVotes(@Tenant() tenantCtx: TenantContext) {
    return this.queryBus.execute(
      new GetVotesQuery(
        tenantCtx.tenantId,
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
    description: 'Returns a list of memberships eligible for delegation for this unit',
    type: [DelegationCandidateDto],
  })
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard)
  getDelegationCandidates(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('unitId', ParseUUIDPipe) unitId: string,
    @Tenant() tenantCtx: TenantContext,
  ) {
    return this.queryBus.execute(
      new GetDelegationCandidatesQuery(
        tenantCtx.tenantId,
        id,
        unitId,
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
      ),
    );
  }
}
