export interface EmailSender {
  sendOwnerInvite(
    to: string,
    inviteLink: string,
    tenantName: string,
  ): Promise<void>;
}

export const EMAIL_SENDER = Symbol('EMAIL_SENDER');
