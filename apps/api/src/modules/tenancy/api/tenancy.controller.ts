import {
  Controller,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse } from '@nestjs/swagger';

import { TenantResponseDto } from './dto/tenant-response.dto';
import { CurrentAuthUser } from '../../../shared/api/decorators/auth.decorators';
import { AccessTokenAuthGuard } from '../../../shared/api/guards/access-token-auth.guard';
import type { AuthPrincipal } from '../../../shared/domain/auth-principal';
import { GetUserTenantsQuery } from '../application/queries/get-user-tenants.query';

@Controller('tenants')
@UseGuards(AccessTokenAuthGuard)
export class TenancyController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [TenantResponseDto] })
  async getUserTenants(
    @CurrentAuthUser() user: AuthPrincipal,
  ): Promise<TenantResponseDto[]> {
    return this.queryBus.execute<GetUserTenantsQuery, TenantResponseDto[]>(
      new GetUserTenantsQuery(user.userId),
    );
  }
}
