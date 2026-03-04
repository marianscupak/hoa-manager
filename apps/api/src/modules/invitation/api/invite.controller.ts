import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import {
  AcceptInviteDto,
  AcceptInviteResponseDto,
  InviteStatusResponseDto,
  RegisterFromInviteDto,
  RegisterFromInviteResponseDto,
} from './dto/invite.dto';
import { CurrentAuthUser } from '../../../shared/api/decorators/auth.decorators';
import { AccessTokenAuthGuard } from '../../../shared/api/guards/access-token-auth.guard';
import { setRefreshTokenCookie } from '../../../shared/api/utils/refresh-cookie';
import type { AuthPrincipal } from '../../../shared/domain/auth-principal';
import { AcceptOwnerInviteCommand } from '../application/commands/accept-owner-invite.command';
import { RegisterFromInviteCommand } from '../application/commands/register-from-invite.command';
import { type AcceptOwnerInviteResult } from '../application/handlers/accept-owner-invite.handler';
import { type InviteStatusResult } from '../application/handlers/get-owner-invite-status.handler';
import { type RegisterFromInviteResult } from '../application/handlers/register-from-invite.handler';
import { GetOwnerInviteStatusQuery } from '../application/queries/get-owner-invite-status.query';

@ApiTags('Owner Invitations')
@Controller()
export class InviteController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('invites/owner/status')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Returns the current status of an owner invitation',
    type: InviteStatusResponseDto,
  })
  async getInviteStatus(
    @Query('token') token: string,
  ): Promise<InviteStatusResponseDto> {
    return this.queryBus.execute<GetOwnerInviteStatusQuery, InviteStatusResult>(
      new GetOwnerInviteStatusQuery(token),
    );
  }

  @Post('invites/owner/accept')
  @UseGuards(AccessTokenAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Accept an owner invitation as an authenticated user',
    type: AcceptInviteResponseDto,
  })
  async acceptInvite(
    @Body() body: AcceptInviteDto,
    @CurrentAuthUser() user: AuthPrincipal,
  ): Promise<AcceptInviteResponseDto> {
    return this.commandBus.execute<
      AcceptOwnerInviteCommand,
      AcceptOwnerInviteResult
    >(new AcceptOwnerInviteCommand(body.token, user.userId));
  }

  @Post('auth/register-from-invite')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Register a new account from an owner invitation and claim the owner record',
    type: RegisterFromInviteResponseDto,
  })
  async registerFromInvite(
    @Body() body: RegisterFromInviteDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RegisterFromInviteResponseDto> {
    const result = await this.commandBus.execute<
      RegisterFromInviteCommand,
      RegisterFromInviteResult
    >(new RegisterFromInviteCommand(body.token, body.password));

    setRefreshTokenCookie(res, result.refreshToken);

    return {
      accessToken: result.accessToken,
      tenantId: result.tenantId,
    };
  }
}
