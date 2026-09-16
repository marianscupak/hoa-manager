import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { PersonResponseDto } from '@/modules/core/tenancy/api/dto/person-response.dto';
import { ListPeopleQuery } from '@/modules/core/tenancy/application/queries/list-people.query';
import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';
import { Tenant } from '@/shared/api/decorators/auth.decorators';
import { ApiErrorResponses } from '@/shared/api/decorators/error.decorators';
import { AccessTokenAuthGuard } from '@/shared/api/guards/access-token-auth.guard';
import { RolesGuard } from '@/shared/api/guards/roles.guard';
import { TenantContextGuard } from '@/shared/api/guards/tenant-context.guard';
import type { TenantContext } from '@/shared/domain/tenant-context';

/**
 * Its own controller rather than another route on `MemberController`, because
 * the two differ in exactly the thing a reader needs to see at a glance: who
 * may call them.
 */
@ApiTags('People')
@ApiErrorResponses()
@Controller('people')
@UseGuards(AccessTokenAuthGuard, TenantContextGuard, RolesGuard)
export class PeopleController {
  constructor(private readonly queryBus: QueryBus) {}

  /**
   * No `@Roles`: every member of the association may read the register. Who
   * owns which unit, and in what share, is public in the cadastre and in the
   * prohlášení vlastníka. What `canSeeAccounts` withholds is the part that is
   * not — contact addresses, roles and account state.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [PersonResponseDto] })
  async getPeople(
    @Tenant() tenantCtx: TenantContext,
  ): Promise<PersonResponseDto[]> {
    const canSeeAccounts =
      tenantCtx.roles.includes(TenantMembershipRole.ADMIN) ||
      tenantCtx.roles.includes(TenantMembershipRole.BOARD_MEMBER);

    return this.queryBus.execute(
      new ListPeopleQuery(tenantCtx.tenantId, canSeeAccounts),
    );
  }
}
