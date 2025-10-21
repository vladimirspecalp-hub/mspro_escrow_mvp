import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramAdapter, TelegramMessage } from './telegram-adapter.interface';

@Injectable()
export class RealTelegramAdapter implements TelegramAdapter {
  private readonly logger = new Logger(RealTelegramAdapter.name);
  private readonly botToken: string;
  private readonly adminChatId: string;
  private readonly apiUrl: string;

  constructor(private configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.adminChatId = this.configService.get<string>('TELEGRAM_CHAT_ID');

    if (!this.botToken || !this.adminChatId) {
      this.logger.warn(
        'Telegram credentials not configured. Notifications will be skipped.',
      );
    }

    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async sendMessage(message: TelegramMessage): Promise<{ success: boolean; messageId?: number }> {
    if (!this.botToken) {
      this.logger.warn('Telegram bot token not configured, skipping message send');
      return { success: false };
    }

    try {
      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: message.chatId,
          text: message.text,
          parse_mode: message.parseMode || 'HTML',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Telegram API error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      const messageId = result.result?.message_id;
      
      this.logger.log(`Telegram message sent successfully: ${messageId}`);
      return { success: true, messageId };
    } catch (error) {
      this.logger.error(`Failed to send Telegram message: ${error.message}`);
      return { success: false };
    }
  }

  getAdminChatId(): string {
    return this.adminChatId;
  }

  isConfigured(): boolean {
    return !!(this.botToken && this.adminChatId);
  }
}
