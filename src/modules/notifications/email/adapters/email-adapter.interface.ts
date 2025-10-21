export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailAdapter {
  sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string }>;
}

export const EMAIL_ADAPTER = 'EMAIL_ADAPTER';
