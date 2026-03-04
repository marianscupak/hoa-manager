import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger as WinstonLogger } from 'winston';

import { EmailSender } from './email-sender.port';

@Injectable()
export class ConsoleEmailSender implements EmailSender {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
  ) {}

  async sendOwnerInvite(
    to: string,
    inviteLink: string,
    tenantName: string,
  ): Promise<void> {
    this.logger.info('═══════════════════════════════════════════');
    this.logger.info('📧  OWNER INVITATION EMAIL');
    this.logger.info('═══════════════════════════════════════════');
    this.logger.info(`To:      ${to}`);
    this.logger.info(`Tenant:  ${tenantName}`);
    this.logger.info(`Link:    ${inviteLink}`);
    this.logger.info('═══════════════════════════════════════════');
  }
}
