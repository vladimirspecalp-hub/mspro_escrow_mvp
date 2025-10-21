import { Injectable, Logger } from '@nestjs/common';
import { EmailAdapter, EmailMessage } from './email-adapter.interface';

@Injectable()
export class MockEmailAdapter implements EmailAdapter {
  private readonly logger = new Logger(MockEmailAdapter.name);
  private sentEmails: EmailMessage[] = [];

  async sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string }> {
    const messageId = `mock_email_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    this.logger.log(`[MOCK EMAIL] Sending to: ${message.to}`);
    this.logger.log(`[MOCK EMAIL] Subject: ${message.subject}`);
    this.logger.log(`[MOCK EMAIL] Message ID: ${messageId}`);
    
    this.sentEmails.push(message);
    
    return {
      success: true,
      messageId,
    };
  }

  getSentEmails(): EmailMessage[] {
    return [...this.sentEmails];
  }

  clearSentEmails(): void {
    this.sentEmails = [];
  }
}
