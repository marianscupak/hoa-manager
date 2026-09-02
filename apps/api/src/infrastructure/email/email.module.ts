import { Module } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger as WinstonLogger } from 'winston';

import { ConfigModule } from '@/infrastructure/config/config.module';
import { ConfigService } from '@/infrastructure/config/config.service';
import { BrevoEmailSender } from '@/infrastructure/email/brevo-email-sender';
import { ConsoleEmailSender } from '@/infrastructure/email/console-email-sender';
import {
  EMAIL_SENDER,
  type EmailSender,
} from '@/infrastructure/email/email-sender.port';

/**
 * Provides the transport behind EMAIL_SENDER: Brevo when BREVO_API_KEY is
 * set, otherwise a console logger. Import this module wherever a handler
 * needs to send email; templates come from @hoa-mngr/emails.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: EMAIL_SENDER,
      inject: [ConfigService, WINSTON_MODULE_PROVIDER],
      useFactory: (
        config: ConfigService,
        logger: WinstonLogger,
      ): EmailSender =>
        config.get('BREVO_API_KEY')
          ? new BrevoEmailSender(config)
          : new ConsoleEmailSender(logger),
    },
  ],
  exports: [EMAIL_SENDER],
})
export class EmailModule {}
