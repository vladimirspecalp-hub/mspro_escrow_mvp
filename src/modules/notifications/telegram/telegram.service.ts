import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TELEGRAM_ADAPTER, TelegramAdapter } from './adapters/telegram-adapter.interface';
import { PrismaService } from '../../../prisma.service';

export interface DisputeOpenedEvent {
  dealId: number;
  buyerEmail: string;
  sellerEmail: string;
  title: string;
  openedBy: 'buyer' | 'seller';
  reason?: string;
}

export interface DealCreatedEvent {
  dealId: number;
  buyerEmail: string;
  sellerEmail: string;
  title: string;
  amount: number;
  currency: string;
}

export interface KycVerifiedEvent {
  userId: number;
  email: string;
  username: string;
  riskScore: number;
}

export interface KycRejectedEvent {
  userId: number;
  email: string;
  username: string;
  riskScore: number;
  reason?: string;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly adminChatId = process.env.TELEGRAM_CHAT_ID || 'mock_admin_chat';

  constructor(
    @Inject(TELEGRAM_ADAPTER) private readonly telegramAdapter: TelegramAdapter,
    private readonly prisma: PrismaService,
  ) {}

  async sendTestMessage(message: string): Promise<{ success: boolean; messageId?: number }> {
    this.logger.log('Sending test Telegram message');

    return this.telegramAdapter.sendMessage({
      chatId: this.adminChatId,
      text: message,
      parseMode: 'HTML',
    });
  }

  @OnEvent('dispute.opened')
  async handleDisputeOpened(event: DisputeOpenedEvent): Promise<void> {
    this.logger.log(`Notifying admin about dispute for deal #${event.dealId}`);

    const openedByText = event.openedBy === 'buyer' ? 'покупатель' : 'продавец';
    const message = `
🚨 <b>ОТКРЫТ СПОР</b>

Сделка: ${event.title}
ID сделки: #${event.dealId}
Открыл: ${openedByText}
Покупатель: ${event.buyerEmail}
Продавец: ${event.sellerEmail}
${event.reason ? `Причина: ${event.reason}` : ''}

Требуется действие: Пожалуйста, рассмотрите и решите спор.
    `.trim();

    await this.telegramAdapter.sendMessage({
      chatId: this.adminChatId,
      text: message,
      parseMode: 'HTML',
    });

    await this.logNotification('telegram', 'dispute.opened', event.dealId, {
      chatId: this.adminChatId,
      openedBy: event.openedBy,
    });
  }

  @OnEvent('deal.created')
  async handleDealCreated(event: DealCreatedEvent): Promise<void> {
    this.logger.log(`Notifying admin about new deal #${event.dealId}`);

    const message = `
📋 <b>СОЗДАНА НОВАЯ СДЕЛКА</b>

Сделка: ${event.title}
ID сделки: #${event.dealId}
Сумма: ${event.amount} ${event.currency}
Покупатель: ${event.buyerEmail}
Продавец: ${event.sellerEmail}
    `.trim();

    await this.telegramAdapter.sendMessage({
      chatId: this.adminChatId,
      text: message,
      parseMode: 'HTML',
    });

    await this.logNotification('telegram', 'deal.created', event.dealId, {
      chatId: this.adminChatId,
    });
  }

  @OnEvent('kyc.verified')
  async handleKycVerified(event: KycVerifiedEvent): Promise<void> {
    this.logger.log(`Notifying admin about KYC verification for user #${event.userId}`);

    const message = `
✅ <b>KYC ВЕРИФИКАЦИЯ ОДОБРЕНА</b>

Пользователь: ${event.username} (${event.email})
ID пользователя: #${event.userId}
Оценка риска: ${event.riskScore}/100
Статус: Верифицирован

Пользователь теперь может создавать сделки до 10,000 USD.
    `.trim();

    await this.telegramAdapter.sendMessage({
      chatId: this.adminChatId,
      text: message,
      parseMode: 'HTML',
    });

    await this.logNotification('telegram', 'kyc.verified', event.userId, {
      chatId: this.adminChatId,
      riskScore: event.riskScore,
    });
  }

  @OnEvent('kyc.rejected')
  async handleKycRejected(event: KycRejectedEvent): Promise<void> {
    this.logger.log(`Notifying user about KYC rejection for user #${event.userId}`);

    const message = `
❌ <b>KYC ВЕРИФИКАЦИЯ ОТКЛОНЕНА</b>

Пользователь: ${event.username} (${event.email})
ID пользователя: #${event.userId}
Оценка риска: ${event.riskScore}/100
${event.reason ? `Причина: ${event.reason}` : ''}

Статус: Отклонено. Пользователь не может создавать сделки.
    `.trim();

    await this.telegramAdapter.sendMessage({
      chatId: this.adminChatId,
      text: message,
      parseMode: 'HTML',
    });

    await this.logNotification('telegram', 'kyc.rejected', event.userId, {
      chatId: this.adminChatId,
      riskScore: event.riskScore,
      reason: event.reason,
    });
  }

  private async logNotification(
    channel: string,
    event: string,
    dealId: number,
    details: any,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: `notification.${channel}`,
          entity: 'notification',
          entityId: dealId,
          userId: null,
          details: {
            event,
            channel,
            ...details,
          },
          ipAddress: '127.0.0.1',
          userAgent: 'TelegramService',
          actionContext: event,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log notification: ${error.message}`);
    }
  }
}
