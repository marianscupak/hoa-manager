import { Inject, Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger as WinstonLogger } from 'winston';

import { SystemActorRunner } from '@/modules/core/audit/infrastructure/cls/system-actor.runner';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';

import { CloseVoteCommand } from '../application/commands/close-vote/close-vote.command';
import { OpenVoteCommand } from '../application/commands/open-vote/open-vote.command';
import {
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '../application/ports/vote-write.repository.port';

@Injectable()
export class VoteSchedulerService {
  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteRepository: VoteWriteRepository,
    private readonly commandBus: CommandBus,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly systemActorRunner: SystemActorRunner,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    const now = this.clock.now();

    // ── Open votes ──────────────────────────────────────────────────
    this.logger.debug('CheckingVotesToOpen');
    const votesToOpen = await this.voteRepository.findScheduledToOpen(now);

    if (votesToOpen.length > 0) {
      this.logger.info('VotesDueToOpen', { count: votesToOpen.length });
    }

    for (const vote of votesToOpen) {
      try {
        await this.systemActorRunner.run('vote-scheduler:auto-open', () =>
          this.commandBus.execute(new OpenVoteCommand(vote.tenantId, vote.id)),
        );
        this.logger.info('VoteOpened', {
          voteId: vote.id,
          tenantId: vote.tenantId,
        });
      } catch (error: unknown) {
        this.logger.error('VoteOpenFailed', {
          voteId: vote.id,
          tenantId: vote.tenantId,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    }

    // ── Close votes ─────────────────────────────────────────────────
    this.logger.debug('CheckingVotesToClose');
    const votesToClose = await this.voteRepository.findScheduledToClose(now);

    if (votesToClose.length > 0) {
      this.logger.info('VotesDueToClose', { count: votesToClose.length });
    }

    for (const vote of votesToClose) {
      try {
        await this.systemActorRunner.run('vote-scheduler:auto-close', () =>
          this.commandBus.execute(new CloseVoteCommand(vote.tenantId, vote.id)),
        );
        this.logger.info('VoteClosed', {
          voteId: vote.id,
          tenantId: vote.tenantId,
        });
      } catch (error: unknown) {
        this.logger.error('VoteCloseFailed', {
          voteId: vote.id,
          tenantId: vote.tenantId,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    }
  }
}
