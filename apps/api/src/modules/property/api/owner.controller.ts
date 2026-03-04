import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';

import {
  CreateOwnerDto,
  CreateOwnerResponseDto,
  OwnerResponseDto,
} from './dto/owner.dto';
import {
  Roles,
  Tenant,
  CurrentAuthUser,
} from '../../../shared/api/decorators/auth.decorators';
import { AccessTokenAuthGuard } from '../../../shared/api/guards/access-token-auth.guard';
import { RolesGuard } from '../../../shared/api/guards/roles.guard';
import { TenantContextGuard } from '../../../shared/api/guards/tenant-context.guard';
import type { AuthPrincipal } from '../../../shared/domain/auth-principal';
import type { TenantContext } from '../../../shared/domain/tenant-context';
import { SendOwnerInviteCommand } from '../../invitation/application/commands/send-owner-invite.command';
import { TenantMembershipRole } from '../../tenancy/domain/tenant.entity';
import { CreateOwnerCommand } from '../application/commands/create-owner.command';
import { ListOwnersQuery } from '../application/queries/list-owners.query';
import { Owner } from '../domain/property.entity';

@ApiTags('Property Owners')
@Controller('owners')
@UseGuards(AccessTokenAuthGuard, TenantContextGuard, RolesGuard)
export class OwnerController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'List of all owners within the current tenant',
    type: [OwnerResponseDto],
  })
  async getOwners(
    @Tenant() tenantCtx: TenantContext,
  ): Promise<OwnerResponseDto[]> {
    return this.queryBus.execute<ListOwnersQuery, Owner[]>(
      new ListOwnersQuery(tenantCtx.tenantId),
    );
  }

  @Post()
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'Owner created successfully',
    type: CreateOwnerResponseDto,
  })
  async createOwner(
    @Tenant() tenantCtx: TenantContext,
    @Body() dto: CreateOwnerDto,
  ): Promise<CreateOwnerResponseDto> {
    return this.commandBus.execute<CreateOwnerCommand, { ownerId: string }>(
      new CreateOwnerCommand(
        tenantCtx.tenantId,
        dto.displayName,
        dto.userId ?? null,
        dto.email ?? null,
      ),
    );
  }

  @Post(':ownerId/invite')
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Send an invitation email to the owner',
  })
  async sendInvite(
    @Tenant() tenantCtx: TenantContext,
    @CurrentAuthUser() user: AuthPrincipal,
    @Param('ownerId') ownerId: string,
  ): Promise<{ success: boolean }> {
    return this.commandBus.execute<
      SendOwnerInviteCommand,
      { success: boolean }
    >(new SendOwnerInviteCommand(tenantCtx.tenantId, ownerId, user.userId));
  }
}
