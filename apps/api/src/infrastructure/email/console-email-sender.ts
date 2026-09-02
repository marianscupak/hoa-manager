import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger as WinstonLogger } from 'winston';

import {
  EmailSender,
  OutgoingEmail,
} from '@/infrastructure/email/email-sender.port';

const RULE = '═══════════════════════════════════════════';

/** Used when BREVO_API_KEY is unset: prints the message instead of sending it. */
@Injectable()
export class ConsoleEmailSender implements EmailSender {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
  ) {}

  async send(message: OutgoingEmail): Promise<void> {
    this.logger.info(RULE);
    this.logger.info('📧  EMAIL (console sender)');
    this.logger.info(RULE);
    this.logger.info(`To:      ${message.to}`);
    this.logger.info(`Subject: ${message.subject}`);
    this.logger.info('');
    this.logger.info(message.text);
    this.logger.info(RULE);
  }
}
