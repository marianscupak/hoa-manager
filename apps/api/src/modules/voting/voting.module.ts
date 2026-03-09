import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { VotesController } from './api/votes.controller';

@Module({
  imports: [CqrsModule],
  controllers: [VotesController],
  providers: [],
})
export class VotingModule {}
