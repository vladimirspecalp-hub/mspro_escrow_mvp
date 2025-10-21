export interface TelegramMessage {
  chatId: string;
  text: string;
  parseMode?: 'HTML' | 'Markdown';
}

export interface TelegramAdapter {
  sendMessage(message: TelegramMessage): Promise<{ success: boolean; messageId?: number }>;
}

export const TELEGRAM_ADAPTER = 'TELEGRAM_ADAPTER';
