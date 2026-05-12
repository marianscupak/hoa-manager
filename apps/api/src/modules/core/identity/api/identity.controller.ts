import { Body, Controller, Put, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiExtraModels, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';

import { UpdateUserLanguageDto } from '@/modules/core/identity/api/dto/update-user-language.dto';
import { UpdateUserLanguageCommand } from '@/modules/core/identity/application/commands/update-user-language.command';
import { CurrentAuthUser } from '@/shared/api/decorators/auth.decorators';
import { ApiErrorResponses } from '@/shared/api/decorators/error.decorators';
import { ErrorResponseDto } from '@/shared/api/dto/error-response.dto';
import { AccessTokenAuthGuard } from '@/shared/api/guards/access-token-auth.guard';
import type { AuthPrincipal } from '@/shared/domain/auth-principal';

@ApiTags('Identity')
@ApiExtraModels(ErrorResponseDto)
@ApiErrorResponses()
@Controller('identity/users')
export class IdentityController {
  constructor(private readonly commandBus: CommandBus) {}

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
