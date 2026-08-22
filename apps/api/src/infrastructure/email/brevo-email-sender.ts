import { Injectable } from '@nestjs/common';

import { ConfigService } from '@/infrastructure/config/config.service';
import { EmailSender } from '@/infrastructure/email/email-sender.port';
import { buildOwnerInviteEmail } from '@/infrastructure/email/owner-invite-email';

const BREVO_SEND_URL = 'https://api.brevo.com/v3/smtp/email';
const DEFAULT_FROM_NAME = 'HOA Manager';

@Injectable()
export class BrevoEmailSender implements EmailSender {
  constructor(private readonly configService: ConfigService) {}

  async sendOwnerInvite(
    to: string,
    inviteLink: string,
    tenantName: string,
  ): Promise<void> {
    const { subject, html, text } = buildOwnerInviteEmail(
      inviteLink,
      tenantName,
    );

    const response = await fetch(BREVO_SEND_URL, {
      method: 'POST',
      headers: {
        'api-key': this.configService.get('BREVO_API_KEY') ?? '',
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: this.configService.get('EMAIL_FROM_NAME') ?? DEFAULT_FROM_NAME,
          email: this.configService.get('EMAIL_FROM'),
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Brevo send failed: ${response.status} ${body}`);
    }
  }
}
