import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { MemberResponseDto } from '@/modules/core/tenancy/api/dto/member-response.dto';
import { TenantContactResponseDto } from '@/modules/core/tenancy/api/dto/tenant-contact-response.dto';
import { UpdateMemberRoleDto } from '@/modules/core/tenancy/api/dto/update-member-role.dto';
import { UpdateMemberRoleCommand } from '@/modules/core/tenancy/application/commands/update-member-role.command';
import { ListTenantContactsQuery } from '@/modules/core/tenancy/application/queries/list-tenant-contacts.query';
import { ListTenantMembersQuery } from '@/modules/core/tenancy/application/queries/list-tenant-members.query';
import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';
import { Roles, Tenant } from '@/shared/api/decorators/auth.decorators';
import { ApiErrorResponses } from '@/shared/api/decorators/error.decorators';
import { AccessTokenAuthGuard } from '@/shared/api/guards/access-token-auth.guard';
import { RolesGuard } from '@/shared/api/guards/roles.guard';
import { TenantContextGuard } from '@/shared/api/guards/tenant-context.guard';
import type { TenantContext } from '@/shared/domain/tenant-context';

@ApiTags('Tenant Members')
@ApiErrorResponses()
@Controller('members')
@UseGuards(AccessTokenAuthGuard, TenantContextGuard, RolesGuard)
export class MemberController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  @Roles(TenantMembershipRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [MemberResponseDto] })
  async getMembers(
    @Tenant() tenantCtx: TenantContext,
  ): Promise<MemberResponseDto[]> {
    return this.queryBus.execute(
      new ListTenantMembersQuery(tenantCtx.tenantId),
    );
  }

  /**
   * Any active member may look up whom to contact about the association
   * (the "Kontaktovat předsedu" link in the portal), hence no @Roles here —
   * only active ADMIN members' name and email are ever returned.
   */
  @Get('contacts')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [TenantContactResponseDto] })
  async getContacts(
    @Tenant() tenantCtx: TenantContext,
  ): Promise<TenantContactResponseDto[]> {
    return this.queryBus.execute(
      new ListTenantContactsQuery(tenantCtx.tenantId),
    );
  }

  @Patch(':id/role')
  @Roles(TenantMembershipRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponse({ description: 'Member role updated successfully' })
  async updateMemberRole(
    @Tenant() tenantCtx: TenantContext,
    @Param('id') membershipId: string,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateMemberRoleCommand(tenantCtx.tenantId, membershipId, dto.role),
    );
  }
}
