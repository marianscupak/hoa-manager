import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import {
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiTags,
} from '@nestjs/swagger';

import { RevokeOwnerInviteCommand } from '@/modules/core/invitation/application/commands/revoke-owner-invite.command';
import { SendOwnerInviteCommand } from '@/modules/core/invitation/application/commands/send-owner-invite.command';
import {
  CreateOwnerDto,
  CreateOwnerResponseDto,
  OwnerResponseDto,
  LinkOwnerAccountDto,
  SetOwnerEmailDto,
} from '@/modules/core/property/api/dto/owner.dto';
import { CreateOwnerCommand } from '@/modules/core/property/application/commands/create-owner.command';
import { DeleteOwnerCommand } from '@/modules/core/property/application/commands/delete-owner.command';
import { LinkOwnerToAccountCommand } from '@/modules/core/property/application/commands/link-owner-to-account.command';
import { SetOwnerEmailCommand } from '@/modules/core/property/application/commands/set-owner-email.command';
import { UnlinkOwnerFromAccountCommand } from '@/modules/core/property/application/commands/unlink-owner-from-account.command';
import { ListOwnersQuery } from '@/modules/core/property/application/queries/list-owners.query';
import type { OwnerKind } from '@/modules/core/property/domain/ownership-plan';
import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';
import {
  Roles,
  Tenant,
  CurrentAuthUser,
} from '@/shared/api/decorators/auth.decorators';
import { ApiErrorResponses } from '@/shared/api/decorators/error.decorators';
import { AccessTokenAuthGuard } from '@/shared/api/guards/access-token-auth.guard';
import { RolesGuard } from '@/shared/api/guards/roles.guard';
import { TenantContextGuard } from '@/shared/api/guards/tenant-context.guard';
import type { AuthPrincipal } from '@/shared/domain/auth-principal';
import type { TenantContext } from '@/shared/domain/tenant-context';

@ApiTags('Property Owners')
@ApiErrorResponses()
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
    return this.queryBus.execute<ListOwnersQuery, OwnerResponseDto[]>(
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
    @CurrentAuthUser() user: AuthPrincipal,
    @Body() dto: CreateOwnerDto,
  ): Promise<CreateOwnerResponseDto> {
    return this.commandBus.execute<CreateOwnerCommand, { ownerId: string }>(
      new CreateOwnerCommand(
        tenantCtx.tenantId,
        dto.displayName,
        dto.userId ?? null,
        dto.email ?? null,
        user.userId,
        dto.kind as OwnerKind,
      ),
    );
  }

  @Patch(':ownerId/email')
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'Email address set on an owner that had none',
  })
  async setOwnerEmail(
    @Tenant() tenantCtx: TenantContext,
    @Param('ownerId') ownerId: string,
    @Body() dto: SetOwnerEmailDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new SetOwnerEmailCommand(tenantCtx.tenantId, ownerId, dto.email),
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

  @Delete(':ownerId/invite')
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Revoke a pending invitation for the owner',
  })
  async revokeInvite(
    @Tenant() tenantCtx: TenantContext,
    @Param('ownerId') ownerId: string,
  ): Promise<void> {
    return this.commandBus.execute<RevokeOwnerInviteCommand, void>(
      new RevokeOwnerInviteCommand(tenantCtx.tenantId, ownerId),
    );
  }

  /**
   * Board members maintain the owner register already — adding e-mails and
   * sending invites — and linking an account is the same kind of work.
   * Deleting an owner and changing a role stay with ADMIN.
   */
  @Put(':ownerId/account')
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Account linked to the owner' })
  async linkAccount(
    @Tenant() tenantCtx: TenantContext,
    @Param('ownerId') ownerId: string,
    @Body() dto: LinkOwnerAccountDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new LinkOwnerToAccountCommand(
        tenantCtx.tenantId,
        ownerId,
        dto.membershipId,
      ),
    );
  }

  @Delete(':ownerId/account')
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Account unlinked from the owner' })
  async unlinkAccount(
    @Tenant() tenantCtx: TenantContext,
    @Param('ownerId') ownerId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new UnlinkOwnerFromAccountCommand(tenantCtx.tenantId, ownerId),
    );
  }

  @Delete(':ownerId')
  @Roles(TenantMembershipRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'Owner deleted successfully',
  })
  async deleteOwner(
    @Tenant() tenantCtx: TenantContext,
    @Param('ownerId') ownerId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new DeleteOwnerCommand(tenantCtx.tenantId, ownerId),
    );
  }
}
