import { Inject } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';

import {
  VerifyEmailCommand,
  type VerifyEmailResult,
} from '@/modules/core/auth/application/commands/verify-email.command';
import {
  EMAIL_VERIFICATION_CODE_REPOSITORY,
  type EmailVerificationCodeRepository,
} from '@/modules/core/auth/application/ports/auth.repository.port';
import { resolveAutoScope } from '@/modules/core/auth/application/resolve-auto-scope';
import { decideEmailVerification } from '@/modules/core/auth/domain/verify-email-code';
import {
  AUTH_SESSION_SERVICE,
  type AuthSessionService,
} from '@/modules/core/auth/infrastructure/auth-session.service';
import { MarkEmailVerifiedCommand } from '@/modules/core/identity/application/commands/mark-email-verified.command';
import { GetUserByEmailQuery } from '@/modules/core/identity/application/queries/get-user-by-email.query';
import { GetMembershipsByUserIdQuery } from '@/modules/core/tenancy/application/queries/get-memberships-by-user-id.query';
import { type TenantMembership } from '@/modules/core/tenancy/domain/tenant.entity';
import {
  InvalidVerificationCodeException,
  UnauthorizedException,
} from '@/shared/application/exceptions/auth.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';
import { normalizeEmail } from '@/shared/application/utils/normalize-email';

/**
 * Every refusal leaves by the same door. `decideEmailVerification` knows why
 * it said no, and that stays inside: "expired" told to a caller would confirm
 * that the address registered recently.
 */
@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand> {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(EMAIL_VERIFICATION_CODE_REPOSITORY)
    private readonly codeRepo: EmailVerificationCodeRepository,
    @Inject(AUTH_SESSION_SERVICE)
    private readonly authSessionService: AuthSessionService,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: VerifyEmailCommand): Promise<VerifyEmailResult> {
    const email = normalizeEmail(command.email);

    return this.uow.execute(async () => {
      const user = await this.queryBus.execute(new GetUserByEmailQuery(email));
      if (!user) {
        throw new InvalidVerificationCodeException();
      }
      if (!user.isActive) {
        throw new UnauthorizedException();
      }

      const stored = await this.codeRepo.findActiveByUser(user.id);
      if (!stored) {
        throw new InvalidVerificationCodeException();
      }

      const now = this.clock.now();
      const decision = decideEmailVerification({
        code: command.code,
        stored,
        now,
      });

      if (decision.outcome === 'REFUSE') {
        if (decision.reason === 'MISMATCH') {
          await this.codeRepo.incrementAttempts(stored.id);
        }
        throw new InvalidVerificationCodeException();
      }

      await this.codeRepo.markConsumed(stored.id, now);
      await this.commandBus.execute(new MarkEmailVerifiedCommand(user.id));

      const memberships = await this.queryBus.execute(
        new GetMembershipsByUserIdQuery(user.id),
      );
      const scoped = resolveAutoScope(memberships as TenantMembership[]);

      return this.authSessionService.createSession(user.id, {
        sub: user.id,
        email: user.email,
        fullName: user.fullName,
        preferredLanguage: user.preferredLanguage,
        ...(scoped
          ? { tid: scoped.tenantId, mid: scoped.id, roles: [scoped.role] }
          : {}),
      });
    });
  }
}
