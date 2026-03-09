import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';
import { CreateVoteCommand } from '@/modules/voting/application/commands/create-vote/create-vote.command';
import { SetVoteRulesetCommand } from '@/modules/voting/application/commands/set-vote-ruleset/set-vote-ruleset.command';
import { Roles, Tenant } from '@/shared/api/decorators/auth.decorators';
import { AccessTokenAuthGuard } from '@/shared/api/guards/access-token-auth.guard';
import { RolesGuard } from '@/shared/api/guards/roles.guard';
import { TenantContextGuard } from '@/shared/api/guards/tenant-context.guard';
import { type TenantContext } from '@/shared/domain/tenant-context';

import {
  CreateVoteDto,
  CreateVoteResponseDto,
  SetVoteRulesetDto,
  SetVoteRulesetResponseDto,
} from './dto/vote.dto';

@ApiTags('Votes')
@Controller('votes')
export class VotesController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({
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
}
