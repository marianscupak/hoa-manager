/** A fully rendered message ready for a transport. Templates live in @hoa-mngr/emails. */
export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailSender {
  send(message: OutgoingEmail): Promise<void>;
}

export const EMAIL_SENDER = Symbol('EMAIL_SENDER');
