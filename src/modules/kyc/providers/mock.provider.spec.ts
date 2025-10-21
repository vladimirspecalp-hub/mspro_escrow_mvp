import { MockKycProvider } from './mock.provider';

describe('MockKycProvider', () => {
  let provider: MockKycProvider;

  beforeEach(() => {
    provider = new MockKycProvider();
  });

  describe('verifyDocument', () => {
    it('should return verified status for low risk document', async () => {
      const result = await provider.verifyDocument('passport', 'ABC123', 'John Doe');

      expect(result.status).toBeDefined();
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });

    it('should auto-approve documents with risk score < 50', async () => {
      const result = await provider.verifyDocument('passport', 'LOWRISK123', 'Safe User');

      if (result.riskScore < 50) {
        expect(result.status).toBe('verified');
      } else {
        expect(result.status).toBe('rejected');
        expect(result.reason).toBe('High risk score detected');
      }
    });

    it('should return deterministic score for same document number', async () => {
      const result1 = await provider.verifyDocument('passport', 'TEST123', 'User A');
      const result2 = await provider.verifyDocument('id_card', 'TEST123', 'User B');

      expect(result1.riskScore).toBe(result2.riskScore);
    });
  });
});
