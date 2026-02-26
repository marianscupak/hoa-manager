import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';

import { CreateUserDto } from './dto/create-user.dto';
import {
  CreateUserResponseDto,
  UserResponseDto,
} from './dto/user-response.dto';
import { CreateUserCommand } from '../application/commands/create-user.command';
import { GetUserByIdQuery } from '../application/queries/get-user-by-id.query';

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
}
