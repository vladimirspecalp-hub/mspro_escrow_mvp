import { Injectable, Logger } from '@nestjs/common';
import {
  IPaymentAdapter,
  HoldResult,
  CaptureResult,
  RefundResult,
  StatusResult,
} from './payment-adapter.interface';

@Injectable()
export class MockPaymentAdapter implements IPaymentAdapter {
  private readonly logger = new Logger(MockPaymentAdapter.name);
  private readonly transactions = new Map<string, StatusResult>();

  registerTestTransaction(provider_id: string, amount: number, currency: string, status: 'held' | 'captured' = 'held'): void {
    this.transactions.set(provider_id, {
      status,
      provider_id,
      amount,
      currency,
    });
    this.logger.log(`[MOCK TEST] Registered test transaction: ${provider_id} (${status})`);
  }

  async hold(
    amount: number,
    currency: string,
    metadata?: Record<string, any>,
  ): Promise<HoldResult> {
    const provider_hold_id = `mock_hold_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(`[MOCK] Holding ${amount} ${currency} | ID: ${provider_hold_id}`);

    const result: HoldResult = {
      provider_hold_id,
      status: 'held',
      amount,
      currency,
      metadata,
    };

    this.transactions.set(provider_hold_id, {
      status: 'held',
      provider_id: provider_hold_id,
      amount,
      currency,
    });

    return result;
  }

  async capture(provider_hold_id: string): Promise<CaptureResult> {
    const transaction = this.transactions.get(provider_hold_id);

    if (!transaction) {
      throw new Error(`Hold not found: ${provider_hold_id}`);
    }

    if (transaction.status !== 'held') {
      throw new Error(`Cannot capture: transaction status is ${transaction.status}`);
    }

    const provider_tx_id = `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(`[MOCK] Capturing hold ${provider_hold_id} → ${provider_tx_id}`);

    const result: CaptureResult = {
      provider_tx_id,
      status: 'captured',
      amount: transaction.amount,
      currency: transaction.currency,
    };

    const capturedTransaction = {
      ...transaction,
      status: 'captured' as const,
      provider_id: provider_tx_id,
    };

    this.transactions.set(provider_hold_id, capturedTransaction);
    this.transactions.set(provider_tx_id, capturedTransaction);

    return result;
  }

  async refund(provider_tx_id: string, amount?: number): Promise<RefundResult> {
    const transaction = this.transactions.get(provider_tx_id);

    if (!transaction) {
      throw new Error(`Transaction or hold not found: ${provider_tx_id}`);
    }

    if (transaction.status === 'refunded') {
      throw new Error(`Transaction already refunded: ${provider_tx_id}`);
    }

    const refundAmount = amount || transaction.amount;

    if (refundAmount > transaction.amount) {
      throw new Error(`Refund amount ${refundAmount} exceeds transaction amount ${transaction.amount}`);
    }

    const provider_refund_id = `mock_refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(`[MOCK] Refunding ${refundAmount} ${transaction.currency} | ID: ${provider_refund_id}`);

    const result: RefundResult = {
      provider_refund_id,
      status: 'refunded',
      amount: refundAmount,
      currency: transaction.currency,
    };

    this.transactions.set(provider_tx_id, {
      ...transaction,
      status: 'refunded',
    });

    return result;
  }

  async getStatus(provider_id: string): Promise<StatusResult> {
    const transaction = this.transactions.get(provider_id);

    if (!transaction) {
      throw new Error(`Transaction not found: ${provider_id}`);
    }

    this.logger.log(`[MOCK] Getting status for ${provider_id}: ${transaction.status}`);

    return transaction;
  }
}
