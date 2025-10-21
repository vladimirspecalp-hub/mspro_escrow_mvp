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
      subject: `Deal Created: ${event.title}`,
      text: `Your escrow deal "${event.title}" has been created. Amount: ${event.amount} ${event.currency}. Please wait for seller confirmation.`,
      html: `<p>Your escrow deal <strong>"${event.title}"</strong> has been created.</p><p>Amount: <strong>${event.amount} ${event.currency}</strong></p><p>Please wait for seller confirmation.</p>`,
    });

    await this.emailAdapter.sendEmail({
      to: event.sellerEmail,
      subject: `New Deal Request: ${event.title}`,
      text: `You have received a new escrow deal request: "${event.title}". Amount: ${event.amount} ${event.currency}. Please review and accept.`,
      html: `<p>You have received a new escrow deal request: <strong>"${event.title}"</strong></p><p>Amount: <strong>${event.amount} ${event.currency}</strong></p><p>Please review and accept.</p>`,
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
      subject: `Funds Released: ${event.title}`,
      text: `The escrow funds for "${event.title}" have been released to you. Amount: ${event.amount} ${event.currency}.`,
      html: `<p>The escrow funds for <strong>"${event.title}"</strong> have been released to you.</p><p>Amount: <strong>${event.amount} ${event.currency}</strong></p>`,
    });

    await this.emailAdapter.sendEmail({
      to: event.buyerEmail,
      subject: `Deal Completed: ${event.title}`,
      text: `Your escrow deal "${event.title}" has been completed successfully. Funds released to seller.`,
      html: `<p>Your escrow deal <strong>"${event.title}"</strong> has been completed successfully.</p><p>Funds released to seller.</p>`,
    });

    await this.logNotification('email', 'deal.released', event.dealId, {
      recipients: [event.buyerEmail, event.sellerEmail],
    });
  }

  @OnEvent('dispute.opened')
  async handleDisputeOpened(event: DisputeOpenedEvent): Promise<void> {
    this.logger.log(`Handling dispute.opened event for deal #${event.dealId}`);

    const otherPartyEmail = event.openedBy === 'buyer' ? event.sellerEmail : event.buyerEmail;

    await this.emailAdapter.sendEmail({
      to: otherPartyEmail,
      subject: `Dispute Opened: ${event.title}`,
      text: `A dispute has been opened for deal "${event.title}". The ${event.openedBy} has raised a concern. An administrator will review the case.`,
      html: `<p>A dispute has been opened for deal <strong>"${event.title}"</strong>.</p><p>The <strong>${event.openedBy}</strong> has raised a concern.</p><p>An administrator will review the case.</p>`,
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
