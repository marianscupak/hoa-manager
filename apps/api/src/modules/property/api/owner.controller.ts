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
import { ApiOkResponse, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';

import {
  CreateOwnerDto,
  CreateOwnerResponseDto,
  OwnerResponseDto,
} from './dto/owner.dto';
import { Tenant } from '../../../shared/api/decorators/auth.decorators';
import { AccessTokenAuthGuard } from '../../../shared/api/guards/access-token-auth.guard';
import { TenantContextGuard } from '../../../shared/api/guards/tenant-context.guard';
import type { TenantContext } from '../../../shared/domain/tenant-context';
import { CreateOwnerCommand } from '../application/commands/create-owner.command';
import { ListOwnersQuery } from '../application/queries/list-owners.query';
import { Owner } from '../domain/property.entity';

@ApiTags('Property Owners')
@Controller('owners')
@UseGuards(AccessTokenAuthGuard, TenantContextGuard)
export class OwnerController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
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
      ),
    );
  }
}
