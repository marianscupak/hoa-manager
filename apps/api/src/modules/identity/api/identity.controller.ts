import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { CreateUserDto } from './dto/create-user.dto';
import { RegisterUserCommand } from '../application/commands/create-user.command';
import type { GetUserByIdResult } from '../application/handlers/get-user-by-id.handler';
import { GetUserByIdQuery } from '../application/queries/get-user-by-id.query';

@Controller('identity/users')
export class IdentityController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async registerUser(@Body() dto: CreateUserDto): Promise<{ id: string }> {
    return this.commandBus.execute(new RegisterUserCommand(dto.email));
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<GetUserByIdResult> {
    return this.queryBus.execute(new GetUserByIdQuery(id));
  }
}
