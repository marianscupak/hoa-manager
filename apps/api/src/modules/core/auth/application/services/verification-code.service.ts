import { Inject, Injectable } from '@nestjs/common';
import { addMinutes } from 'date-fns';

import { renderVerificationCodeEmail } from '@hoa-mngr/emails';

import {
  EMAIL_SENDER,
  type EmailSender,
} from '@/infrastructure/email/email-sender.port';
import {
  EMAIL_VERIFICATION_CODE_REPOSITORY,
  type EmailVerificationCodeRepository,
} from '@/modules/core/auth/application/ports/auth.repository.port';
import {
  generateVerificationCode,
  VERIFICATION_TTL_MINUTES,
} from '@/modules/core/auth/domain/verify-email-code';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import { hashToken } from '@/shared/application/utils/token.utils';

/**
 * Retires whatever code the user had and sends a fresh one. Shared by
 * registration and resend so both can only ever leave one code live.
 */
@Injectable()
export class VerificationCodeService {
  constructor(
    @Inject(EMAIL_VERIFICATION_CODE_REPOSITORY)
    private readonly codeRepo: EmailVerificationCodeRepository,
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSender,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async issueAndSend(userId: string, email: string): Promise<void> {
    const now = this.clock.now();
    await this.codeRepo.consumeAllForUser(userId, now);

    const code = generateVerificationCode();
    await this.codeRepo.create({
      userId,
      codeHash: hashToken(code),
      expiresAt: addMinutes(now, VERIFICATION_TTL_MINUTES),
    });

    const rendered = await renderVerificationCodeEmail({
      code,
      expiresInMinutes: VERIFICATION_TTL_MINUTES,
    });
    await this.emailSender.send({ to: email, ...rendered });
  }
}
