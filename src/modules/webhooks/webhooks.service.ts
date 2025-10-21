import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { DealsService } from '../deals/deals.service';
import { PaymentsService } from '../payments/payments.service';
import { ProcessWebhookDto } from './dto/webhook.dto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dealsService: DealsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async processWebhook(dto: ProcessWebhookDto): Promise<{ processed: boolean; eventId: string }> {
    const existingEvent = await this.prisma.webhookEvent.findUnique({
      where: { eventId: dto.eventId },
    });

    if (existingEvent?.processed) {
      this.logger.log(`Webhook event ${dto.eventId} already processed (idempotency)`);
      return { processed: true, eventId: dto.eventId };
    }

    const webhookEvent = await this.prisma.webhookEvent.create({
      data: {
        provider: dto.provider,
        eventId: dto.eventId,
        eventType: dto.eventType,
        payload: dto.payload,
        signature: dto.signature,
        processed: false,
      },
    });

    try {
      if (dto.signature) {
        this.verifySignature(dto);
      }

      await this.handleWebhookEvent(dto);

      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { processed: true, processedAt: new Date() },
      });

      await this.prisma.auditLog.create({
        data: {
          action: 'WEBHOOK_PROCESSED',
          entity: 'webhook_event',
          entityId: webhookEvent.id,
          details: { provider: dto.provider, eventType: dto.eventType, eventId: dto.eventId },
        },
      });

      this.logger.log(`Webhook event ${dto.eventId} processed successfully`);
      return { processed: true, eventId: dto.eventId };
    } catch (error) {
      this.logger.error(`Failed to process webhook ${dto.eventId}:`, error);
      throw error;
    }
  }

  private verifySignature(dto: ProcessWebhookDto): void {
    if (dto.provider === 'mock') {
      return;
    }

    throw new BadRequestException('Signature verification not implemented for this provider');
  }

  private async handleWebhookEvent(dto: ProcessWebhookDto): Promise<void> {
    const { eventType, payload } = dto;

    switch (eventType) {
      case 'payment.succeeded':
      case 'payment.captured':
        await this.handlePaymentSuccess(payload);
        break;

      case 'payment.failed':
        await this.handlePaymentFailure(payload);
        break;

      case 'payment.refunded':
        await this.handlePaymentRefund(payload);
        break;

      default:
        this.logger.warn(`Unhandled webhook event type: ${eventType}`);
    }
  }

  private async handlePaymentSuccess(payload: any): Promise<void> {
    const { dealId, providerPaymentId } = payload;

    const payment = await this.prisma.payment.findFirst({
      where: { providerPaymentId, dealId },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for providerPaymentId: ${providerPaymentId}`);
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED' },
    });

    const deal = await this.prisma.deal.findUnique({ where: { id: dealId } });
    if (deal && deal.status === 'IN_PROGRESS') {
      await this.prisma.deal.update({
        where: { id: dealId },
        data: { status: 'COMPLETED' },
      });
    }

    this.logger.log(`Payment ${payment.id} marked as COMPLETED via webhook`);
  }

  private async handlePaymentFailure(payload: any): Promise<void> {
    const { dealId, providerPaymentId, reason } = payload;

    const payment = await this.prisma.payment.findFirst({
      where: { providerPaymentId, dealId },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for providerPaymentId: ${providerPaymentId}`);
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'PAYMENT_FAILED',
        entity: 'payment',
        entityId: payment.id,
        details: { reason, providerPaymentId },
      },
    });

    this.logger.log(`Payment ${payment.id} marked as FAILED via webhook`);
  }

  private async handlePaymentRefund(payload: any): Promise<void> {
    const { dealId, providerPaymentId } = payload;

    const payment = await this.prisma.payment.findFirst({
      where: { providerPaymentId, dealId },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for providerPaymentId: ${providerPaymentId}`);
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED' },
    });

    await this.prisma.deal.update({
      where: { id: dealId },
      data: { status: 'CANCELLED' },
    });

    this.logger.log(`Payment ${payment.id} refunded via webhook`);
  }
}
