import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { TelegramService } from './modules/notifications/telegram/telegram.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly telegramService: TelegramService,
  ) {}

  @Get()
  getRoot(): string {
    return this.appService.getRoot();
  }

  @Post('test/telegram')
  async testTelegram(@Body('message') message?: string) {
    const testMessage = message || '🔔 <b>Test Notification</b>\n\nEscrow Platform is working correctly!';
    
    const result = await this.telegramService.sendTestMessage(testMessage);

    return {
      success: result.success,
      message: 'Telegram notification sent',
      messageId: result.messageId,
      sentMessage: testMessage,
    };
  }
}
