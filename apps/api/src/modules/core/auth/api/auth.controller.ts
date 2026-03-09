import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOkResponse } from '@nestjs/swagger';
import type { Response, Request } from 'express';

import {
  AuthResponseDto,
  SuccessResponseDto,
} from '@/modules/core/auth/api/dto/auth-response.dto';
import { ExchangeCodeDto } from '@/modules/core/auth/api/dto/exchange-code.dto';
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
import { type ExchangeGoogleCodeResult } from '@/modules/core/auth/application/handlers/exchange-google-code.handler';
import { type HandleGoogleCallbackResult } from '@/modules/core/auth/application/handlers/handle-google-callback.handler';
import { type StartGoogleLoginResult } from '@/modules/core/auth/application/handlers/start-google-login.handler';
import { AccessTokenAuthGuard } from '@/shared/api/guards/access-token-auth.guard';
import { setRefreshTokenCookie } from '@/shared/api/utils/refresh-cookie';

@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('login')
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

  @Get('google/callback')
  async handleGoogleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      throw new UnauthorizedException();
    }

    const result = await this.commandBus.execute<
      HandleGoogleCallbackCommand,
      HandleGoogleCallbackResult
    >(new HandleGoogleCallbackCommand(code, state));

    setRefreshTokenCookie(res, result.refreshToken);

    return res.redirect(result.redirectUrl);
  }

  @Post('google/exchange')
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

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

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

    res.clearCookie('refresh_token');
    return { success: true };
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
