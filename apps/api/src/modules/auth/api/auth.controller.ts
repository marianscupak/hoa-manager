import {
  Controller,
  Post,
  Body,
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

import { AuthResponseDto, SuccessResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { SwitchTenantDto } from './dto/switch-tenant.dto';
import { AccessTokenAuthGuard } from '../../../shared/api/guards/access-token-auth.guard';
import {
  LoginCommand,
  type LoginResult,
} from '../application/commands/login.command';
import { LogoutCommand } from '../application/commands/logout.command';
import {
  RefreshTokenCommand,
  type RefreshTokenResult,
} from '../application/commands/refresh-token.command';
import {
  SwitchTenantCommand,
  type SwitchTenantResult,
} from '../application/commands/switch-tenant.command';

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

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

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
      throw new UnauthorizedException('Missing refresh token');
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
