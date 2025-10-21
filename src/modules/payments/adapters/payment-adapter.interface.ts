export interface HoldResult {
  provider_hold_id: string;
  status: 'held';
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
}

export interface CaptureResult {
  provider_tx_id: string;
  status: 'captured';
  amount: number;
  currency: string;
}

export interface RefundResult {
  provider_refund_id: string;
  status: 'refunded';
  amount: number;
  currency: string;
}

export interface StatusResult {
  status: 'held' | 'captured' | 'refunded' | 'failed';
  provider_id: string;
  amount?: number;
  currency?: string;
}

export interface IPaymentAdapter {
  hold(amount: number, currency: string, metadata?: Record<string, any>): Promise<HoldResult>;
  capture(provider_hold_id: string): Promise<CaptureResult>;
  refund(provider_tx_id: string, amount?: number): Promise<RefundResult>;
  getStatus(provider_id: string): Promise<StatusResult>;
}
