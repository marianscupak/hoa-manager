import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';

import { renderAccountExistsEmail } from '@hoa-mngr/emails';

import {
  EMAIL_SENDER,
  type EmailSender,
} from '@/infrastructure/email/email-sender.port';
import { RegisterAccountCommand } from '@/modules/core/auth/application/commands/register-account.command';
import {
  AUTH_IDENTITY_REPOSITORY,
  type AuthIdentityRepository,
} from '@/modules/core/auth/application/ports/auth.repository.port';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '@/modules/core/auth/application/ports/auth.utils.port';
import { VerificationCodeService } from '@/modules/core/auth/application/services/verification-code.service';
import { CreateUserCommand } from '@/modules/core/identity/application/commands/create-user.command';
import { SetUserNameCommand } from '@/modules/core/identity/application/commands/set-user-name.command';
import { GetUserByEmailQuery } from '@/modules/core/identity/application/queries/get-user-by-email.query';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';
import { normalizeEmail } from '@/shared/application/utils/normalize-email';

/**
 * Registration answers the same way whichever of the three states the address
 * is in. `LoginHandler` equalises its timings to keep which addresses have
 * accounts private; an endpoint that answered "taken" would give that away in
 * one request. What differs is only the mail that goes out.
 */
@CommandHandler(RegisterAccountCommand)
export class RegisterAccountHandler
  implements ICommandHandler<RegisterAccountCommand>
{
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(AUTH_IDENTITY_REPOSITORY)
    private readonly authIdentityRepository: AuthIdentityRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    private readonly verificationCodes: VerificationCodeService,
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSender,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly configService: ConfigService,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: RegisterAccountCommand): Promise<void> {
    const email = normalizeEmail(command.email);

    await this.uow.execute(async () => {
      const existing = await this.queryBus.execute(
        new GetUserByEmailQuery(email),
      );

      if (existing?.isEmailVerified) {
        const appUrl = this.configService.get<string>('FRONTEND_URL');
        const rendered = await renderAccountExistsEmail({
          loginLink: `${appUrl}/login`,
        });
        await this.emailSender.send({ to: email, ...rendered });
        return;
      }

      const passwordHash = await this.passwordHasher.hash(command.password);

      if (existing) {
        // Nobody ever proved this address, and an unverified account cannot
        // sign in, so nothing of value is being overwritten. This is how the
        // real owner of the mailbox takes an address back.
        const identity = await this.authIdentityRepository.findByProvider(
          'LOCAL',
          email,
        );
        if (identity) {
          await this.authIdentityRepository.updatePassword(
            identity.id,
            passwordHash,
          );
        } else {
          await this.authIdentityRepository.create({
            userId: existing.id,
            provider: 'LOCAL',
            providerSubject: email,
            passwordHash,
          });
        }
        await this.commandBus.execute(
          new SetUserNameCommand(existing.id, command.fullName),
        );
        await this.verificationCodes.issueAndSend(existing.id, email);
        return;
      }

      const created = (await this.commandBus.execute(
        new CreateUserCommand(email, command.fullName, false),
      )) as { id: string };

      await this.authIdentityRepository.create({
        userId: created.id,
        provider: 'LOCAL',
        providerSubject: email,
        passwordHash,
      });

      await this.verificationCodes.issueAndSend(created.id, email);
    });
  }
}
