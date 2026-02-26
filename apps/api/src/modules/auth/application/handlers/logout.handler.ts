import { createHash } from 'crypto';

import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '../../../../shared/application/ports/unit-of-work.port';
import { LogoutCommand } from '../commands/logout.command';
import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepository,
} from '../ports/auth.repository.port';

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand> {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepository,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    return this.uow.execute(async () => {
      const hash = createHash('sha256')
        .update(command.refreshToken)
        .digest('hex');

      const session = await this.authSessionRepository.findByHash(hash);
      if (session && !session.revokedAt) {
        await this.authSessionRepository.markRevoked(session.id);
      }
    });
  }
}
