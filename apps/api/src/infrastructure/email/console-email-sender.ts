import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger as WinstonLogger } from 'winston';

import {
  EmailSender,
  OutgoingEmail,
} from '@/infrastructure/email/email-sender.port';

/** Used when BREVO_API_KEY is unset: prints the message instead of sending it. */
@Injectable()
export class ConsoleEmailSender implements EmailSender {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
  ) {}

  async send(message: OutgoingEmail): Promise<void> {
    // One line, not the eight-line banner this used to print: the transport
    // emits JSON, so every rule and blank line was its own object. The body
    // stays a field, which keeps the confirmation codes and invite links
    // readable in the terminal during development.
    this.logger.info('EmailNotSent', {
      reason: 'console sender (BREVO_API_KEY unset)',
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
  }
}
