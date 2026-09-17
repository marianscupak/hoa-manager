import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';

import { ResendVerificationCodeCommand } from '@/modules/core/auth/application/commands/resend-verification-code.command';
import { VerificationCodeService } from '@/modules/core/auth/application/services/verification-code.service';
import { GetUserByEmailQuery } from '@/modules/core/identity/application/queries/get-user-by-email.query';
import { normalizeEmail } from '@/shared/application/utils/normalize-email';

/**
 * Silent about everything. An unknown address, an already verified one and a
 * genuine resend are indistinguishable from the outside.
 */
@CommandHandler(ResendVerificationCodeCommand)
export class ResendVerificationCodeHandler
  implements ICommandHandler<ResendVerificationCodeCommand>
{
  constructor(
    private readonly verificationCodes: VerificationCodeService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: ResendVerificationCodeCommand): Promise<void> {
    const email = normalizeEmail(command.email);
    const user = await this.queryBus.execute(new GetUserByEmailQuery(email));

    if (!user || user.isEmailVerified || !user.isActive) {
      return;
    }

    await this.verificationCodes.issueAndSend(user.id, email);
  }
}
