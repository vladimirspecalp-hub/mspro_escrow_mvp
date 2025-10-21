import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EMAIL_ADAPTER, EmailAdapter } from './adapters/email-adapter.interface';
import { PrismaService } from '../../../prisma.service';

export interface DealCreatedEvent {
  dealId: number;
  buyerEmail: string;
  sellerEmail: string;
  title: string;
  amount: number;
  currency: string;
}

export interface DealReleasedEvent {
  dealId: number;
  buyerEmail: string;
  sellerEmail: string;
  title: string;
  amount: number;
  currency: string;
}

export interface DisputeOpenedEvent {
  dealId: number;
  buyerEmail: string;
  sellerEmail: string;
  title: string;
  openedBy: 'buyer' | 'seller';
  reason?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @Inject(EMAIL_ADAPTER) private readonly emailAdapter: EmailAdapter,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('deal.created')
  async handleDealCreated(event: DealCreatedEvent): Promise<void> {
    this.logger.log(`Handling deal.created event for deal #${event.dealId}`);

    await this.emailAdapter.sendEmail({
      to: event.buyerEmail,
      subject: `Сделка создана: ${event.title}`,
      text: `Ваша сделка "${event.title}" создана. Сумма: ${event.amount} ${event.currency}. Ожидайте подтверждения продавца.`,
      html: `<p>Ваша сделка <strong>"${event.title}"</strong> создана.</p><p>Сумма: <strong>${event.amount} ${event.currency}</strong></p><p>Ожидайте подтверждения продавца.</p>`,
    });

    await this.emailAdapter.sendEmail({
      to: event.sellerEmail,
      subject: `Новый запрос сделки: ${event.title}`,
      text: `Вы получили новый запрос сделки: "${event.title}". Сумма: ${event.amount} ${event.currency}. Пожалуйста, проверьте и примите.`,
      html: `<p>Вы получили новый запрос сделки: <strong>"${event.title}"</strong></p><p>Сумма: <strong>${event.amount} ${event.currency}</strong></p><p>Пожалуйста, проверьте и примите.</p>`,
    });

    await this.logNotification('email', 'deal.created', event.dealId, {
      recipients: [event.buyerEmail, event.sellerEmail],
    });
  }

  @OnEvent('deal.released')
  async handleDealReleased(event: DealReleasedEvent): Promise<void> {
    this.logger.log(`Handling deal.released event for deal #${event.dealId}`);

    await this.emailAdapter.sendEmail({
      to: event.sellerEmail,
      subject: `Средства переведены: ${event.title}`,
      text: `Средства эскроу для сделки "${event.title}" переведены вам. Сумма: ${event.amount} ${event.currency}.`,
      html: `<p>Средства эскроу для сделки <strong>"${event.title}"</strong> переведены вам.</p><p>Сумма: <strong>${event.amount} ${event.currency}</strong></p>`,
    });

    await this.emailAdapter.sendEmail({
      to: event.buyerEmail,
      subject: `Сделка завершена: ${event.title}`,
      text: `Ваша сделка "${event.title}" успешно завершена. Средства переведены продавцу.`,
      html: `<p>Ваша сделка <strong>"${event.title}"</strong> успешно завершена.</p><p>Средства переведены продавцу.</p>`,
    });

    await this.logNotification('email', 'deal.released', event.dealId, {
      recipients: [event.buyerEmail, event.sellerEmail],
    });
  }

  @OnEvent('dispute.opened')
  async handleDisputeOpened(event: DisputeOpenedEvent): Promise<void> {
    this.logger.log(`Handling dispute.opened event for deal #${event.dealId}`);

    const otherPartyEmail = event.openedBy === 'buyer' ? event.sellerEmail : event.buyerEmail;
    const openedByText = event.openedBy === 'buyer' ? 'покупатель' : 'продавец';

    await this.emailAdapter.sendEmail({
      to: otherPartyEmail,
      subject: `Открыт спор: ${event.title}`,
      text: `Был открыт спор по сделке "${event.title}". ${openedByText.charAt(0).toUpperCase() + openedByText.slice(1)} выразил претензию. Администратор рассмотрит дело.`,
      html: `<p>Был открыт спор по сделке <strong>"${event.title}"</strong>.</p><p><strong>${openedByText.charAt(0).toUpperCase() + openedByText.slice(1)}</strong> выразил претензию.</p><p>Администратор рассмотрит дело.</p>`,
    });

    await this.logNotification('email', 'dispute.opened', event.dealId, {
      openedBy: event.openedBy,
      notifiedParty: otherPartyEmail,
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
          userAgent: 'NotificationService',
          actionContext: event,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log notification: ${error.message}`);
    }
  }
}
