import { Injectable } from '@nestjs/common';

import { ConfigService } from '@/infrastructure/config/config.service';
import {
  EmailSender,
  OutgoingEmail,
} from '@/infrastructure/email/email-sender.port';

const BREVO_SEND_URL = 'https://api.brevo.com/v3/smtp/email';
const DEFAULT_FROM_NAME = 'HOA Manager';

@Injectable()
export class BrevoEmailSender implements EmailSender {
  constructor(private readonly configService: ConfigService) {}

  async send(message: OutgoingEmail): Promise<void> {
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
        to: [{ email: message.to }],
        subject: message.subject,
        htmlContent: message.html,
        textContent: message.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Brevo send failed: ${response.status} ${body}`);
    }
  }
}
