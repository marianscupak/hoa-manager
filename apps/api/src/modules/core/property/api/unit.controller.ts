import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Patch,
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

import { OwnedUnitResponseDto } from '@/modules/core/property/api/dto/owned-unit-response.dto';
import {
  CreateUnitDto,
  CreateUnitResponseDto,
  UpdateUnitDto,
  ReplaceOwnershipsDto,
  UnitResponseDto,
  UnitDetailResponseDto,
  UnitOwnershipHistoryResponseDto,
  UpdateOwnershipPeriodDto,
} from '@/modules/core/property/api/dto/unit.dto';
import { CancelScheduledOwnershipTransferCommand } from '@/modules/core/property/application/commands/cancel-scheduled-ownership-transfer.command';
import { CreateUnitCommand } from '@/modules/core/property/application/commands/create-unit.command';
import { DeleteUnitCommand } from '@/modules/core/property/application/commands/delete-unit.command';
import { ReplaceUnitOwnershipCommand } from '@/modules/core/property/application/commands/replace-unit-ownership.command';
import { UpdateOwnershipPeriodCommand } from '@/modules/core/property/application/commands/update-ownership-period.command';
import { UpdateUnitCommand } from '@/modules/core/property/application/commands/update-unit.command';
import { GetOwnedUnitsQuery } from '@/modules/core/property/application/queries/get-owned-units/get-owned-units.query';
import { GetUnitDetailQuery } from '@/modules/core/property/application/queries/get-unit-detail.query';
import { GetUnitOwnershipHistoryQuery } from '@/modules/core/property/application/queries/get-unit-ownership-history.query';
import { ListUnitsQuery } from '@/modules/core/property/application/queries/list-units.query';
import type { OwnershipPartyType } from '@/modules/core/property/domain/ownership-plan';
import { Roles, Tenant } from '@/shared/api/decorators/auth.decorators';
import { ApiErrorResponses } from '@/shared/api/decorators/error.decorators';
import { AccessTokenAuthGuard } from '@/shared/api/guards/access-token-auth.guard';
import { RolesGuard } from '@/shared/api/guards/roles.guard';
import { TenantContextGuard } from '@/shared/api/guards/tenant-context.guard';
import { parseAssociationDate } from '@/shared/domain/association-date';
import { TenantMembershipRole } from '@/shared/domain/membership';
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

  // Declared before `@Get(':id')` so the literal `mine` segment is
  // matched before the `:id` route parameter. Any authenticated tenant
  // member can call this — no `@Roles` decorator. The class-level
  // `RolesGuard` is a no-op when no `@Roles()` metadata is present.
  @Get('mine')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: "Units owned by the caller's membership",
    type: [OwnedUnitResponseDto],
  })
  async getMyOwnedUnits(
    @Tenant() tenantCtx: TenantContext,
  ): Promise<OwnedUnitResponseDto[]> {
    return this.queryBus.execute(
      new GetOwnedUnitsQuery(tenantCtx.tenantId, tenantCtx.membershipId),
    );
  }

  /**
   * No `@Roles`: every member may read the register. Which unit belongs to
   * whom, and how large it is, is public in the cadastre and in the
   * prohlášení vlastníka — and this response carries nothing else. The
   * caller's own units come back marked, with their share.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'List of all units within the current tenant',
    type: [UnitResponseDto],
  })
  async getUnits(
    @Tenant() tenantCtx: TenantContext,
  ): Promise<UnitResponseDto[]> {
    return this.queryBus.execute(
      new ListUnitsQuery(tenantCtx.tenantId, tenantCtx.membershipId),
    );
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

  // No `@Roles`: admins/board read any unit, other members only units they
  // have ever owned — decided in GetUnitOwnershipHistoryHandler.
  @Get(':id/ownership/history')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Every ownership period of the unit (scheduled, active, closed), newest first',
    type: UnitOwnershipHistoryResponseDto,
  })
  async getOwnershipHistory(
    @Tenant() tenantCtx: TenantContext,
    @Param('id') unitId: string,
  ): Promise<UnitOwnershipHistoryResponseDto> {
    return this.queryBus.execute(
      new GetUnitOwnershipHistoryQuery(
        tenantCtx.tenantId,
        unitId,
        tenantCtx.membershipId,
        tenantCtx.roles,
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
    const effectiveAt = parseAssociationDate(dto.effectiveFrom);
    if (!effectiveAt) {
      // Unreachable after the zod refine; keeps the command strictly typed.
      throw new BadRequestException('effectiveFrom must be a calendar date');
    }
    await this.commandBus.execute(
      new ReplaceUnitOwnershipCommand(
        tenantCtx.tenantId,
        unitId,
        dto.ownerships.map((o) => ({
          ...o,
          partyType: o.partyType as OwnershipPartyType,
        })),
        effectiveAt,
      ),
    );
  }

  @Patch(':id/ownership/period')
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'Bounds of one ownership period moved',
  })
  async updateOwnershipPeriod(
    @Tenant() tenantCtx: TenantContext,
    @Param('id') unitId: string,
    @Body() dto: UpdateOwnershipPeriodDto,
  ): Promise<void> {
    const periodValidFrom = parseAssociationDate(dto.periodValidFrom);
    const validFrom = parseAssociationDate(dto.validFrom);
    const validTo = dto.validTo ? parseAssociationDate(dto.validTo) : null;
    if (!periodValidFrom || !validFrom || (dto.validTo && !validTo)) {
      // Unreachable after the zod refine; keeps the command strictly typed.
      throw new BadRequestException('dates must be calendar dates');
    }
    await this.commandBus.execute(
      new UpdateOwnershipPeriodCommand(
        tenantCtx.tenantId,
        unitId,
        periodValidFrom,
        validFrom,
        validTo,
        dto.acknowledged,
      ),
    );
  }

  @Delete(':id/ownership/scheduled')
  @Roles(TenantMembershipRole.ADMIN, TenantMembershipRole.BOARD_MEMBER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description:
      'Scheduled ownership transfer cancelled; the current ownership stays in force',
  })
  async cancelScheduledOwnershipTransfer(
    @Tenant() tenantCtx: TenantContext,
    @Param('id') unitId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new CancelScheduledOwnershipTransferCommand(tenantCtx.tenantId, unitId),
    );
  }

  @Delete(':id')
  @Roles(TenantMembershipRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'Unit deleted successfully',
  })
  async deleteUnit(
    @Tenant() tenantCtx: TenantContext,
    @Param('id') unitId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new DeleteUnitCommand(tenantCtx.tenantId, unitId),
    );
  }
}
