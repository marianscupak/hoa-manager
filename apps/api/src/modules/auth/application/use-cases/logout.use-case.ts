import { createHash } from 'crypto';

import { Injectable, Inject } from '@nestjs/common';

import { UNIT_OF_WORK } from '../../../../shared/application/ports/unit-of-work.port';
import type { UnitOfWork } from '../../../../shared/application/ports/unit-of-work.port';
import { AUTH_SESSION_REPOSITORY } from '../ports/auth.repository.port';
import type { AuthSessionRepository } from '../ports/auth.repository.port';

export interface LogoutCommand {
  refreshToken: string;
}

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepository,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    return this.uow.execute(async () => {
      const providedHash = createHash('sha256')
        .update(command.refreshToken)
        .digest('hex');
      const session = await this.authSessionRepository.findByHash(providedHash);

      if (!session) {
        // Idempotent logout - if no session, just return
        return;
      }

      await this.authSessionRepository.markRevoked(session.id);
    });
  }
}
