import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';

import {
  CreateTenantDto,
  CreateTenantResponseDto,
} from '@/modules/core/tenancy/api/dto/create-tenant.dto';
import { TenantResponseDto } from '@/modules/core/tenancy/api/dto/tenant-response.dto';
import { CreateTenantCommand } from '@/modules/core/tenancy/application/commands/create-tenant.command';
import { GetUserTenantsQuery } from '@/modules/core/tenancy/application/queries/get-user-tenants.query';
import { CurrentAuthUser } from '@/shared/api/decorators/auth.decorators';
import { AccessTokenAuthGuard } from '@/shared/api/guards/access-token-auth.guard';
import type { AuthPrincipal } from '@/shared/domain/auth-principal';

@Controller('tenants')
@UseGuards(AccessTokenAuthGuard)
export class TenancyController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'Tenant created successfully',
    type: CreateTenantResponseDto,
  })
  async createTenant(
    @CurrentAuthUser() user: AuthPrincipal,
    @Body() dto: CreateTenantDto,
  ): Promise<CreateTenantResponseDto> {
    return this.commandBus.execute<CreateTenantCommand, { tenantId: string }>(
      new CreateTenantCommand(dto.name, user.userId),
    );
  }
}
