import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CreateUserDto } from '@/modules/core/identity/api/dto/create-user.dto';
import { UpdateUserLanguageDto } from '@/modules/core/identity/api/dto/update-user-language.dto';
import {
  CreateUserResponseDto,
  UserResponseDto,
} from '@/modules/core/identity/api/dto/user-response.dto';
import { CreateUserCommand } from '@/modules/core/identity/application/commands/create-user.command';
import { UpdateUserLanguageCommand } from '@/modules/core/identity/application/commands/update-user-language.command';
import { GetUserByIdQuery } from '@/modules/core/identity/application/queries/get-user-by-id.query';
import { CurrentAuthUser } from '@/shared/api/decorators/auth.decorators';
import { ErrorResponseDto } from '@/shared/api/dto/error-response.dto';
import { AccessTokenAuthGuard } from '@/shared/api/guards/access-token-auth.guard';
import type { AuthPrincipal } from '@/shared/domain/auth-principal';

@ApiTags('Identity')
@ApiExtraModels(ErrorResponseDto)
@Controller('identity/users')
export class IdentityController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: CreateUserResponseDto })
  async registerUser(
    @Body() dto: CreateUserDto,
  ): Promise<CreateUserResponseDto> {
    return this.commandBus.execute(
      new CreateUserCommand(dto.email, dto.fullName),
    );
  }

  @Get(':id')
  @ApiOkResponse({ type: UserResponseDto })
  async getUser(@Param('id') id: string): Promise<UserResponseDto> {
    return this.queryBus.execute(new GetUserByIdQuery(id));
  }

  @Put('me/language')
  @UseGuards(AccessTokenAuthGuard)
  @ApiNoContentResponse({ description: 'Language updated' })
  async updateLanguage(
    @CurrentAuthUser() user: AuthPrincipal,
    @Body() dto: UpdateUserLanguageDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateUserLanguageCommand(user.userId, dto.language),
    );
  }
}
