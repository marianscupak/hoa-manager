import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response, Request } from 'express';

import {
  AuthResponseDto,
  SuccessResponseDto,
} from '@/modules/core/auth/api/dto/auth-response.dto';
import { ExchangeCodeDto } from '@/modules/core/auth/api/dto/exchange-code.dto';
import { GoogleCallbackQueryDto } from '@/modules/core/auth/api/dto/google-callback-query.dto';
import {
  GoogleLinkStartResponseDto,
  IdentityResponseDto,
} from '@/modules/core/auth/api/dto/identity.dto';
import { LoginDto } from '@/modules/core/auth/api/dto/login.dto';
import { SwitchTenantDto } from '@/modules/core/auth/api/dto/switch-tenant.dto';
import { ExchangeGoogleCodeCommand } from '@/modules/core/auth/application/commands/exchange-google-code.command';
import { HandleGoogleCallbackCommand } from '@/modules/core/auth/application/commands/handle-google-callback.command';
import {
  LoginCommand,
  type LoginResult,
} from '@/modules/core/auth/application/commands/login.command';
import { LogoutCommand } from '@/modules/core/auth/application/commands/logout.command';
import {
  RefreshTokenCommand,
  type RefreshTokenResult,
} from '@/modules/core/auth/application/commands/refresh-token.command';
import { StartGoogleLoginCommand } from '@/modules/core/auth/application/commands/start-google-login.command';
import {
  SwitchTenantCommand,
  type SwitchTenantResult,
} from '@/modules/core/auth/application/commands/switch-tenant.command';
import { UnlinkIdentityCommand } from '@/modules/core/auth/application/commands/unlink-identity.command';
import { type ExchangeGoogleCodeResult } from '@/modules/core/auth/application/handlers/exchange-google-code.handler';
import { type HandleGoogleCallbackResult } from '@/modules/core/auth/application/handlers/handle-google-callback.handler';
import { type StartGoogleLoginResult } from '@/modules/core/auth/application/handlers/start-google-login.handler';
import { ListIdentitiesQuery } from '@/modules/core/auth/application/queries/list-identities.query';
import { CurrentAuthUser } from '@/shared/api/decorators/auth.decorators';
import { ApiErrorResponses } from '@/shared/api/decorators/error.decorators';
import { AccessTokenAuthGuard } from '@/shared/api/guards/access-token-auth.guard';
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from '@/shared/api/utils/refresh-cookie';
import { UnauthorizedException } from '@/shared/application/exceptions/auth.exceptions';
import type { AuthPrincipal } from '@/shared/domain/auth-principal';

@ApiTags('Auth')
@ApiErrorResponses()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthResponseDto })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.commandBus.execute<LoginCommand, LoginResult>(
      new LoginCommand(body.email, 'LOCAL', body.password),
    );

    setRefreshTokenCookie(res, result.refreshToken);

    return { accessToken: result.accessToken };
  }

  @Get('google/start')
  async startGoogleLogin(@Res() res: Response) {
    const result = await this.commandBus.execute<
      StartGoogleLoginCommand,
      StartGoogleLoginResult
    >(new StartGoogleLoginCommand());
    return res.redirect(result.redirectUrl);
  }

  /**
   * Hands back the URL instead of redirecting to it: the guard reads a bearer
   * token, and a browser following a redirect sends no Authorization header.
   * The caller navigates once it has the answer.
   */
  @Post('google/link/start')
  @UseGuards(AccessTokenAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: GoogleLinkStartResponseDto })
  async startGoogleLink(
    @CurrentAuthUser() principal: AuthPrincipal,
  ): Promise<GoogleLinkStartResponseDto> {
    const result = await this.commandBus.execute<
      StartGoogleLoginCommand,
      StartGoogleLoginResult
    >(new StartGoogleLoginCommand(principal.userId));
    return { redirectUrl: result.redirectUrl };
  }

  @Get('identities')
  @UseGuards(AccessTokenAuthGuard)
  @ApiOkResponse({ type: IdentityResponseDto, isArray: true })
  async listIdentities(
    @CurrentAuthUser() principal: AuthPrincipal,
  ): Promise<IdentityResponseDto[]> {
    return await this.queryBus.execute(
      new ListIdentitiesQuery(principal.userId),
    );
  }

  @Delete('identities/:provider')
  @UseGuards(AccessTokenAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Sign-in method removed' })
  async unlinkIdentity(
    @CurrentAuthUser() principal: AuthPrincipal,
    @Param('provider') provider: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new UnlinkIdentityCommand(
        principal.userId,
        provider as 'LOCAL' | 'OIDC_GOOGLE',
      ),
    );
  }

  @Get('google/callback')
  async handleGoogleCallback(
    @Query() query: GoogleCallbackQueryDto,
    @Res() res: Response,
  ) {
    const result = await this.commandBus.execute<
      HandleGoogleCallbackCommand,
      HandleGoogleCallbackResult
    >(new HandleGoogleCallbackCommand(query));

    setRefreshTokenCookie(res, result.refreshToken);

    return res.redirect(result.redirectUrl);
  }

  @Post('google/exchange')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthResponseDto })
  async exchangeGoogleCode(
    @Body() body: ExchangeCodeDto,
  ): Promise<AuthResponseDto> {
    const result = await this.commandBus.execute<
      ExchangeGoogleCodeCommand,
      ExchangeGoogleCodeResult
    >(new ExchangeGoogleCodeCommand(body.code));

    return { accessToken: result.accessToken };
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthResponseDto })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const refreshToken = req.cookies?.refresh_token;
    const oldAccessToken = this.extractTokenFromHeader(req);

    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    const result = await this.commandBus.execute<
      RefreshTokenCommand,
      RefreshTokenResult
    >(new RefreshTokenCommand(refreshToken, oldAccessToken));

    setRefreshTokenCookie(res, result.refreshToken);

    return { accessToken: result.accessToken };
  }

  @Post('switch-tenant')
  @UseGuards(AccessTokenAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthResponseDto })
  async switchTenant(
    @Req() req: Request,
    @Body() body: SwitchTenantDto,
  ): Promise<AuthResponseDto> {
    const accessToken = this.extractTokenFromHeader(req)!;

    const result = await this.commandBus.execute<
      SwitchTenantCommand,
      SwitchTenantResult
    >(new SwitchTenantCommand(body.tenantId, accessToken));

    return { accessToken: result.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SuccessResponseDto })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SuccessResponseDto> {
    const refreshToken = req.cookies?.refresh_token;

    if (refreshToken) {
      await this.commandBus.execute(new LogoutCommand(refreshToken));
    }

    clearRefreshTokenCookie(res);
    return { success: true };
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
