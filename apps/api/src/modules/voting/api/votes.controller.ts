import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';
import { CreateVoteCommand } from '@/modules/voting/application/commands/create-vote/create-vote.command';
import { Roles, Tenant } from '@/shared/api/decorators/auth.decorators';
import { AccessTokenAuthGuard } from '@/shared/api/guards/access-token-auth.guard';
import { RolesGuard } from '@/shared/api/guards/roles.guard';
import { TenantContextGuard } from '@/shared/api/guards/tenant-context.guard';
import { type TenantContext } from '@/shared/domain/tenant-context';

import { CreateVoteDto, CreateVoteResponseDto } from './dto/vote.dto';

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
}
