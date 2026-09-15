import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import {
  ApplyKatastrImportDto,
  KatastrImportPreviewResponseDto,
  KatastrImportResultResponseDto,
  PreviewKatastrImportDto,
} from '@/modules/core/property/api/dto/katastr-import.dto';
import { ImportKatastrDataCommand } from '@/modules/core/property/application/commands/import-katastr-data.command';
import { PreviewKatastrImportQuery } from '@/modules/core/property/application/queries/preview-katastr-import.query';
import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';
import { Roles, Tenant } from '@/shared/api/decorators/auth.decorators';
import { ApiErrorResponses } from '@/shared/api/decorators/error.decorators';
import { AccessTokenAuthGuard } from '@/shared/api/guards/access-token-auth.guard';
import { RolesGuard } from '@/shared/api/guards/roles.guard';
import { TenantContextGuard } from '@/shared/api/guards/tenant-context.guard';
import { parseAssociationDate } from '@/shared/domain/association-date';
import type { TenantContext } from '@/shared/domain/tenant-context';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/** Reads the uploaded XML, or fails the request when no file arrived. */
export function readUploadedXml(file: Express.Multer.File | undefined): string {
  if (file === undefined) {
    throw new BadRequestException({ code: 'FILE_REQUIRED' });
  }
  return file.buffer.toString('utf8');
}

/**
 * Parses a `YYYY-MM-DD` calendar date into local midnight in
 * Europe/Prague — never UTC midnight, and never a `Date` built by hand from
 * the string, so this and a manual ownership transfer (unit.controller.ts)
 * agree on what a day means.
 */
function parseEffectiveDate(value: string): Date {
  const parsed = parseAssociationDate(value);
  if (!parsed) {
    // Unreachable after the zod date check; keeps the type honest.
    throw new BadRequestException('effectiveAt must be a calendar date');
  }
  return parsed;
}

@ApiTags('Katastr Import')
@ApiErrorResponses()
@Controller('katastr-import')
@UseGuards(AccessTokenAuthGuard, TenantContextGuard, RolesGuard)
export class KatastrImportController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  // Import is a bulk write that is hard to unwind, so it follows the stricter
  // ADMIN-only precedent rather than the ADMIN + BOARD_MEMBER used for
  // single-unit writes.
  @Post('preview')
  @Roles(TenantMembershipRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({
    description: 'What the uploaded extract would change',
    type: KatastrImportPreviewResponseDto,
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  async preview(
    @Tenant() tenantCtx: TenantContext,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: PreviewKatastrImportDto,
  ): Promise<KatastrImportPreviewResponseDto> {
    const effectiveAt = dto.effectiveAt
      ? parseEffectiveDate(dto.effectiveAt)
      : null;

    return this.queryBus.execute(
      new PreviewKatastrImportQuery(
        tenantCtx.tenantId,
        readUploadedXml(file),
        effectiveAt,
      ),
    );
  }

  @Post('apply')
  @Roles(TenantMembershipRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({
    description: 'What the confirmed import changed',
    type: KatastrImportResultResponseDto,
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  async apply(
    @Tenant() tenantCtx: TenantContext,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: ApplyKatastrImportDto,
  ): Promise<KatastrImportResultResponseDto> {
    return this.commandBus.execute(
      new ImportKatastrDataCommand(
        tenantCtx.tenantId,
        readUploadedXml(file),
        parseEffectiveDate(dto.effectiveAt),
        dto.planHash,
      ),
    );
  }
}
