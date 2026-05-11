import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
  UpdateUnitDto,
  ReplaceOwnershipsDto,
  UnitResponseDto,
  UnitDetailResponseDto,
} from '@/modules/core/property/api/dto/unit.dto';
import { CreateUnitCommand } from '@/modules/core/property/application/commands/create-unit.command';
import { ReplaceUnitOwnershipCommand } from '@/modules/core/property/application/commands/replace-unit-ownership.command';
import { UpdateUnitCommand } from '@/modules/core/property/application/commands/update-unit.command';
import { GetUnitDetailQuery } from '@/modules/core/property/application/queries/get-unit-detail.query';
import { ListUnitsQuery } from '@/modules/core/property/application/queries/list-units.query';
import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';
import { Roles, Tenant } from '@/shared/api/decorators/auth.decorators';
import { ApiErrorResponses } from '@/shared/api/decorators/error.decorators';
import { AccessTokenAuthGuard } from '@/shared/api/guards/access-token-auth.guard';
import { RolesGuard } from '@/shared/api/guards/roles.guard';
import { TenantContextGuard } from '@/shared/api/guards/tenant-context.guard';
import type { TenantContext } from '@/shared/domain/tenant-context';

@ApiTags('Property Units')
@ApiErrorResponses()
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
      new CreateUnitCommand(
        tenantCtx.tenantId,
        dto.unitNo,
        dto.buildingShareNumerator,
        dto.buildingShareDenominator,
      ),
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

  @Patch(':id')
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponse({
    description: 'Unit updated successfully',
  })
  async updateUnit(
    @Tenant() tenantCtx: TenantContext,
    @Param('id') unitId: string,
    @Body() dto: UpdateUnitDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateUnitCommand(
        tenantCtx.tenantId,
        unitId,
        dto.unitNo,
        dto.buildingShareNumerator,
        dto.buildingShareDenominator,
      ),
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
