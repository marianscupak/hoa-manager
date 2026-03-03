import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';

import {
  CreateUnitDto,
  CreateUnitResponseDto,
  ReplaceOwnershipsDto,
  UnitResponseDto,
  UnitDetailResponseDto,
} from './dto/unit.dto';
import { Roles, Tenant } from '../../../shared/api/decorators/auth.decorators';
import { AccessTokenAuthGuard } from '../../../shared/api/guards/access-token-auth.guard';
import { RolesGuard } from '../../../shared/api/guards/roles.guard';
import { TenantContextGuard } from '../../../shared/api/guards/tenant-context.guard';
import type { TenantContext } from '../../../shared/domain/tenant-context';
import { TenantMembershipRole } from '../../tenancy/domain/tenant.entity';
import { CreateUnitCommand } from '../application/commands/create-unit.command';
import { ReplaceUnitOwnershipCommand } from '../application/commands/replace-unit-ownership.command';
import { GetUnitDetailQuery } from '../application/queries/get-unit-detail.query';
import { ListUnitsQuery } from '../application/queries/list-units.query';

@ApiTags('Property Units')
@Controller('units')
@UseGuards(AccessTokenAuthGuard, TenantContextGuard, RolesGuard)
export class UnitController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'List of all units within the current tenant',
    type: [UnitResponseDto],
  })
  async getUnits(
    @Tenant() tenantCtx: TenantContext,
  ): Promise<UnitResponseDto[]> {
    return this.queryBus.execute(new ListUnitsQuery(tenantCtx.tenantId));
  }

  @Post()
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'Unit created successfully',
    type: CreateUnitResponseDto,
  })
  async createUnit(
    @Tenant() tenantCtx: TenantContext,
    @Body() dto: CreateUnitDto,
  ): Promise<CreateUnitResponseDto> {
    return this.commandBus.execute<CreateUnitCommand, { unitId: string }>(
      new CreateUnitCommand(tenantCtx.tenantId, dto.unitNo, dto.buildingShare),
    );
  }

  @Get(':id')
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Details of a specific unit including active ownerships',
    type: UnitDetailResponseDto,
  })
  async getUnitDetail(
    @Tenant() tenantCtx: TenantContext,
    @Param('id') unitId: string,
  ): Promise<UnitDetailResponseDto> {
    return this.queryBus.execute(
      new GetUnitDetailQuery(tenantCtx.tenantId, unitId),
    );
  }

  @Put(':id/ownership')
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponse({
    description: 'Ownership for the unit replaced successfully',
  })
  async replaceUnitOwnership(
    @Tenant() tenantCtx: TenantContext,
    @Param('id') unitId: string,
    @Body() dto: ReplaceOwnershipsDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new ReplaceUnitOwnershipCommand(
        tenantCtx.tenantId,
        unitId,
        dto.ownerships,
      ),
    );
  }
}
