import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { PropertyOverviewResponseDto } from '@/modules/core/property/api/dto/property-overview-response.dto';
import { GetPropertyOverviewQuery } from '@/modules/core/property/application/queries/get-property-overview/get-property-overview.query';
import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';
import { Roles, Tenant } from '@/shared/api/decorators/auth.decorators';
import { ApiErrorResponses } from '@/shared/api/decorators/error.decorators';
import { AccessTokenAuthGuard } from '@/shared/api/guards/access-token-auth.guard';
import { RolesGuard } from '@/shared/api/guards/roles.guard';
import { TenantContextGuard } from '@/shared/api/guards/tenant-context.guard';
import type { TenantContext } from '@/shared/domain/tenant-context';

@ApiTags('Property')
@ApiErrorResponses()
@Controller('property')
@UseGuards(AccessTokenAuthGuard, TenantContextGuard, RolesGuard)
export class PropertyController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('overview')
  @Roles(
    TenantMembershipRole.ADMIN,
    TenantMembershipRole.BOARD_MEMBER,
    TenantMembershipRole.AUDITOR,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Aggregated configuration metrics for the current tenant',
    type: PropertyOverviewResponseDto,
  })
  async getOverview(
    @Tenant() tenantCtx: TenantContext,
  ): Promise<PropertyOverviewResponseDto> {
    return this.queryBus.execute<
      GetPropertyOverviewQuery,
      PropertyOverviewResponseDto
    >(new GetPropertyOverviewQuery(tenantCtx.tenantId));
  }
}
