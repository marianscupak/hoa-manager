import { randomBytes, createHash } from 'crypto';

import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { addMinutes } from 'date-fns';

import { StartGoogleLoginCommand } from '@/modules/auth/application/commands/start-google-login.command';
import {
  OIDC_LOGIN_ATTEMPT_REPOSITORY,
  type OidcLoginAttemptRepository,
} from '@/modules/auth/application/ports/auth.repository.port';
import {
  GOOGLE_OIDC_SERVICE,
  type GoogleOidcService,
} from '@/modules/auth/application/ports/google-oidc.service.port';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';

export interface StartGoogleLoginResult {
  redirectUrl: string;
}

@CommandHandler(StartGoogleLoginCommand)
export class StartGoogleLoginHandler
  implements ICommandHandler<StartGoogleLoginCommand>
{
  constructor(
    @Inject(OIDC_LOGIN_ATTEMPT_REPOSITORY)
    private readonly attemptRepository: OidcLoginAttemptRepository,
    @Inject(GOOGLE_OIDC_SERVICE)
    private readonly googleOidcService: GoogleOidcService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(
    _command: StartGoogleLoginCommand,
  ): Promise<StartGoogleLoginResult> {
    const rawState = randomBytes(32).toString('hex');
    const rawNonce = randomBytes(32).toString('hex');

    const stateHash = createHash('sha256').update(rawState).digest('hex');

    const expiresAt = addMinutes(this.clock.now(), 10);

    await this.attemptRepository.create({
      provider: 'OIDC_GOOGLE',
      stateHash,
      nonce: rawNonce,
      expiresAt,
    });

    const redirectUrl = await this.googleOidcService.getAuthorizationUrl(
      rawState,
      rawNonce,
    );

    return { redirectUrl };
  }
}
