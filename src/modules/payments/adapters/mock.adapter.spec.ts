import { MockPaymentAdapter } from './mock.adapter';

describe('MockPaymentAdapter', () => {
  let adapter: MockPaymentAdapter;

  beforeEach(() => {
    adapter = new MockPaymentAdapter();
  });

  describe('hold', () => {
    it('should create a payment hold', async () => {
      const result = await adapter.hold(100, 'USD', { dealId: 1 });

      expect(result.status).toBe('held');
      expect(result.amount).toBe(100);
      expect(result.currency).toBe('USD');
      expect(result.provider_hold_id).toMatch(/^mock_hold_/);
      expect(result.metadata).toEqual({ dealId: 1 });
    });

    it('should generate unique hold IDs', async () => {
      const result1 = await adapter.hold(100, 'USD');
      const result2 = await adapter.hold(200, 'EUR');

      expect(result1.provider_hold_id).not.toBe(result2.provider_hold_id);
    });
  });

  describe('capture', () => {
    it('should capture a held payment', async () => {
      const holdResult = await adapter.hold(100, 'USD');
      const captureResult = await adapter.capture(holdResult.provider_hold_id);

      expect(captureResult.status).toBe('captured');
      expect(captureResult.amount).toBe(100);
      expect(captureResult.currency).toBe('USD');
      expect(captureResult.provider_tx_id).toMatch(/^mock_tx_/);
    });

    it('should throw error if hold not found', async () => {
      await expect(adapter.capture('invalid_id')).rejects.toThrow('Hold not found');
    });

    it('should throw error if transaction already captured', async () => {
      const holdResult = await adapter.hold(100, 'USD');
      await adapter.capture(holdResult.provider_hold_id);

      await expect(adapter.capture(holdResult.provider_hold_id)).rejects.toThrow(
        'Cannot capture: transaction status is captured',
      );
    });
  });

  describe('refund', () => {
    it('should refund a captured payment', async () => {
      const holdResult = await adapter.hold(100, 'USD');
      const captureResult = await adapter.capture(holdResult.provider_hold_id);
      const refundResult = await adapter.refund(holdResult.provider_hold_id);

      expect(refundResult.status).toBe('refunded');
      expect(refundResult.amount).toBe(100);
      expect(refundResult.currency).toBe('USD');
      expect(refundResult.provider_refund_id).toMatch(/^mock_refund_/);
    });

    it('should support partial refunds', async () => {
      const holdResult = await adapter.hold(100, 'USD');
      await adapter.capture(holdResult.provider_hold_id);
      const refundResult = await adapter.refund(holdResult.provider_hold_id, 50);

      expect(refundResult.amount).toBe(50);
    });

    it('should throw error if refund amount exceeds transaction amount', async () => {
      const holdResult = await adapter.hold(100, 'USD');
      await adapter.capture(holdResult.provider_hold_id);

      await expect(adapter.refund(holdResult.provider_hold_id, 150)).rejects.toThrow(
        'Refund amount 150 exceeds transaction amount 100',
      );
    });

    it('should throw error if transaction not found', async () => {
      await expect(adapter.refund('invalid_id')).rejects.toThrow('Transaction or hold not found');
    });
  });

  describe('getStatus', () => {
    it('should return status of a held payment', async () => {
      const holdResult = await adapter.hold(100, 'USD');
      const status = await adapter.getStatus(holdResult.provider_hold_id);

      expect(status.status).toBe('held');
      expect(status.amount).toBe(100);
      expect(status.currency).toBe('USD');
    });

    it('should return status of a captured payment', async () => {
      const holdResult = await adapter.hold(100, 'USD');
      await adapter.capture(holdResult.provider_hold_id);
      const status = await adapter.getStatus(holdResult.provider_hold_id);

      expect(status.status).toBe('captured');
    });

    it('should return status of a refunded payment', async () => {
      const holdResult = await adapter.hold(100, 'USD');
      await adapter.capture(holdResult.provider_hold_id);
      await adapter.refund(holdResult.provider_hold_id);
      const status = await adapter.getStatus(holdResult.provider_hold_id);

      expect(status.status).toBe('refunded');
    });

    it('should throw error if transaction not found', async () => {
      await expect(adapter.getStatus('invalid_id')).rejects.toThrow('Transaction not found');
    });
  });
});
