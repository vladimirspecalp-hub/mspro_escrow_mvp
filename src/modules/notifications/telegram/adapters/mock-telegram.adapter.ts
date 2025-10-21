import { Injectable, Logger } from '@nestjs/common';
import { TelegramAdapter, TelegramMessage } from './telegram-adapter.interface';

@Injectable()
export class MockTelegramAdapter implements TelegramAdapter {
  private readonly logger = new Logger(MockTelegramAdapter.name);
  private sentMessages: TelegramMessage[] = [];

  async sendMessage(message: TelegramMessage): Promise<{ success: boolean; messageId?: number }> {
    const messageId = Math.floor(Math.random() * 1000000);
    
    this.logger.log(`[MOCK TELEGRAM] Sending to chat: ${message.chatId}`);
    this.logger.log(`[MOCK TELEGRAM] Text: ${message.text.substring(0, 100)}...`);
    this.logger.log(`[MOCK TELEGRAM] Message ID: ${messageId}`);
    
    this.sentMessages.push(message);
    
    return {
      success: true,
      messageId,
    };
  }

  getSentMessages(): TelegramMessage[] {
    return [...this.sentMessages];
  }

  clearSentMessages(): void {
    this.sentMessages = [];
  }
}
