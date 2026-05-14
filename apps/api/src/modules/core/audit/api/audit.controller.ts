import {
  Controller,
  DefaultValuePipe,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { TenantActivityResponseDto } from './dto/tenant-activity-response.dto';
import {
  CurrentAuthUser,
  Tenant,
} from '../../../../shared/api/decorators/auth.decorators';
import { AccessTokenAuthGuard } from '../../../../shared/api/guards/access-token-auth.guard';
import { TenantContextGuard } from '../../../../shared/api/guards/tenant-context.guard';
import { type AuthPrincipal } from '../../../../shared/domain/auth-principal';
import { type TenantContext } from '../../../../shared/domain/tenant-context';
import { GetTenantActivityQuery } from '../application/queries/get-tenant-activity/get-tenant-activity.query';

function parsePrimaryLanguage(header: string | undefined): string | undefined {
  if (!header) return undefined;
  const primary = header
    .split(',')[0]
    ?.split(';')[0]
    ?.split('-')[0]
    ?.trim()
    .toLowerCase();
  return primary || undefined;
}

@ApiTags('audit')
@Controller('audit')
export class AuditController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('activity')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenAuthGuard, TenantContextGuard)
  @ApiOkResponse({ type: TenantActivityResponseDto })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getActivity(
    @Tenant() tenantCtx: TenantContext,
    @CurrentAuthUser() user: AuthPrincipal,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<TenantActivityResponseDto> {
    const language =
      parsePrimaryLanguage(acceptLanguage) ?? user.preferredLanguage ?? 'cs';

    return this.queryBus.execute(
      new GetTenantActivityQuery(
        tenantCtx.tenantId,
        user.userId,
        tenantCtx.roles,
        language,
        Math.min(Math.max(limit, 1), 50),
      ),
    );
  }
}
