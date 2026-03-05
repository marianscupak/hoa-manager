import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { VotingController } from './api/voting.controller';

@Module({
  imports: [CqrsModule],
  controllers: [VotingController],
  providers: [],
})
export class VotingModule {}
