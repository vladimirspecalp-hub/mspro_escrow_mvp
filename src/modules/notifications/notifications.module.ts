import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email/email.service';
import { TelegramService } from './telegram/telegram.service';
import { EMAIL_ADAPTER } from './email/adapters/email-adapter.interface';
import { TELEGRAM_ADAPTER } from './telegram/adapters/telegram-adapter.interface';
import { MockEmailAdapter } from './email/adapters/mock-email.adapter';
import { RealTelegramAdapter } from './telegram/adapters/real-telegram.adapter';
import { PrismaModule } from '../../prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [
    EmailService,
    TelegramService,
    {
      provide: EMAIL_ADAPTER,
      useClass: MockEmailAdapter,
    },
    {
      provide: TELEGRAM_ADAPTER,
      useClass: RealTelegramAdapter,
    },
  ],
  exports: [EmailService, TelegramService],
})
export class NotificationsModule {}
