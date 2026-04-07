import { Inject, Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Cron, CronExpression } from '@nestjs/schedule';

import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';

import { CloseVoteCommand } from '../application/commands/close-vote/close-vote.command';
import { OpenVoteCommand } from '../application/commands/open-vote/open-vote.command';
import {
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '../application/ports/vote-write.repository.port';

@Injectable()
export class VoteSchedulerService {
  private readonly logger = new Logger(VoteSchedulerService.name);

  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteRepository: VoteWriteRepository,
    private readonly commandBus: CommandBus,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    const now = this.clock.now();

    // ── Open votes ──────────────────────────────────────────────────
    this.logger.debug('Checking for votes to open...');
    const votesToOpen = await this.voteRepository.findScheduledToOpen(now);

    if (votesToOpen.length > 0) {
      this.logger.log(`Found ${votesToOpen.length} votes to open.`);
    }

    for (const vote of votesToOpen) {
      try {
        await this.commandBus.execute(
          new OpenVoteCommand(vote.tenantId, vote.id),
        );
        this.logger.log(`Vote ${vote.id} opened successfully.`);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(
          `Failed to open vote ${vote.id}: ${errorMessage}`,
          errorStack,
        );
      }
    }

    // ── Close votes ─────────────────────────────────────────────────
    this.logger.debug('Checking for votes to close...');
    const votesToClose = await this.voteRepository.findScheduledToClose(now);

    if (votesToClose.length > 0) {
      this.logger.log(`Found ${votesToClose.length} votes to close.`);
    }

    for (const vote of votesToClose) {
      try {
        await this.commandBus.execute(
          new CloseVoteCommand(vote.tenantId, vote.id),
        );
        this.logger.log(`Vote ${vote.id} closed successfully.`);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(
          `Failed to close vote ${vote.id}: ${errorMessage}`,
          errorStack,
        );
      }
    }
  }
}
