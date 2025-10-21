import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { IPaymentAdapter } from './adapters/payment-adapter.interface';
import { PAYMENT_ADAPTER } from './payments.module';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_ADAPTER) private readonly paymentAdapter: IPaymentAdapter,
  ) {}

  async holdPayment(dealId: number, amount: number, currency: string) {
    this.logger.log(`Creating payment hold for deal ${dealId}: ${amount} ${currency}`);

    const holdResult = await this.paymentAdapter.hold(amount, currency, {
      dealId,
    });

    const payment = await this.prisma.payment.create({
      data: {
        dealId,
        amount,
        currency,
        status: 'PENDING',
        provider: 'mock',
        providerPaymentId: holdResult.provider_hold_id,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'PAYMENT_HOLD_CREATED',
        entity: 'payment',
        entityId: payment.id,
        details: {
          dealId,
          paymentId: payment.id,
          amount,
          currency,
          provider_hold_id: holdResult.provider_hold_id,
        },
      },
    });

    this.logger.log(`Payment hold created: ${payment.id} | Provider ID: ${holdResult.provider_hold_id}`);

    return {
      payment,
      holdResult,
    };
  }

  async capturePayment(dealId: number) {
    this.logger.log(`Capturing payment for deal ${dealId}`);

    const payment = await this.prisma.payment.findFirst({
      where: { dealId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      throw new NotFoundException(`No pending payment found for deal ${dealId}`);
    }

    const captureResult = await this.paymentAdapter.capture(payment.providerPaymentId);

    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        providerTransactionId: captureResult.provider_tx_id,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'PAYMENT_CAPTURED',
        entity: 'payment',
        entityId: payment.id,
        details: {
          dealId,
          paymentId: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          provider_tx_id: captureResult.provider_tx_id,
        },
      },
    });

    this.logger.log(`Payment captured: ${payment.id} | Provider TX: ${captureResult.provider_tx_id}`);

    return {
      payment: updatedPayment,
      captureResult,
    };
  }

  async refundPayment(dealId: number, amount?: number) {
    this.logger.log(`Refunding payment for deal ${dealId}`);

    const payment = await this.prisma.payment.findFirst({
      where: { dealId },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      throw new NotFoundException(`No payment found for deal ${dealId}`);
    }

    const providerId = payment.providerTransactionId || payment.providerPaymentId;
    const refundResult = await this.paymentAdapter.refund(providerId, amount);

    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'PAYMENT_REFUNDED',
        entity: 'payment',
        entityId: payment.id,
        details: {
          dealId,
          paymentId: payment.id,
          amount: refundResult.amount,
          currency: payment.currency,
          provider_refund_id: refundResult.provider_refund_id,
        },
      },
    });

    this.logger.log(`Payment refunded: ${payment.id} | Provider Refund: ${refundResult.provider_refund_id}`);

    return {
      payment: updatedPayment,
      refundResult,
    };
  }

  async getPaymentStatus(dealId: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { dealId },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      throw new NotFoundException(`No payment found for deal ${dealId}`);
    }

    const providerId = payment.providerTransactionId || payment.providerPaymentId;
    const statusResult = await this.paymentAdapter.getStatus(providerId);

    return {
      payment,
      providerStatus: statusResult,
    };
  }

  async getAllPayments() {
    return this.prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPaymentsByDeal(dealId: number) {
    return this.prisma.payment.findMany({
      where: { dealId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
