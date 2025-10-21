import { Test, TestingModule } from '@nestjs/testing';
import { FraudService } from './fraud.service';
import { PrismaService } from '../../prisma.service';

describe('FraudService', () => {
  let service: FraudService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      count: jest.fn(),
    },
    deal: {
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FraudService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FraudService>(FraudService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkUserSignup', () => {
    it('should return low risk for normal email', async () => {
      mockPrismaService.user.count.mockResolvedValue(0);

      const result = await service.checkUserSignup('user@example.com');

      expect(result.riskScore).toBeLessThan(0.8);
      expect(result.isBlocked).toBe(false);
      expect(result.reasons.length).toBe(0);
    });

    it('should return high risk for suspicious email', async () => {
      mockPrismaService.user.count.mockResolvedValue(0);

      const result = await service.checkUserSignup('fraud@scam.com');

      expect(result.riskScore).toBeGreaterThanOrEqual(0.5);
      expect(result.reasons).toContain('Suspicious email pattern detected');
    });

    it('should block if email already exists', async () => {
      mockPrismaService.user.count.mockResolvedValue(1);

      const result = await service.checkUserSignup('test@test.com');

      expect(result.riskScore).toBeGreaterThanOrEqual(0.3);
      expect(result.reasons).toContain('Email already registered');
    });

    it('should flag high-risk country domains', async () => {
      mockPrismaService.user.count.mockResolvedValue(0);

      const result = await service.checkUserSignup('user@test.ru');

      expect(result.riskScore).toBeGreaterThanOrEqual(0.2);
      expect(result.reasons).toContain('High-risk country domain');
    });
  });

  describe('checkDealCreation', () => {
    it('should return low risk for normal deal', async () => {
      mockPrismaService.deal.count.mockResolvedValue(2);

      const result = await service.checkDealCreation(1, 500, 'USD');

      expect(result.riskScore).toBeLessThan(0.8);
      expect(result.isBlocked).toBe(false);
    });

    it('should flag high amounts', async () => {
      mockPrismaService.deal.count.mockResolvedValue(0);

      const result = await service.checkDealCreation(1, 15000, 'USD');

      expect(result.riskScore).toBeGreaterThanOrEqual(0.4);
      expect(result.reasons).toContain('High transaction amount');
    });

    it('should block very high amounts', async () => {
      mockPrismaService.deal.count.mockResolvedValue(0);

      const result = await service.checkDealCreation(1, 60000, 'USD');

      expect(result.riskScore).toBeGreaterThanOrEqual(0.8);
      expect(result.isBlocked).toBe(true);
      expect(result.reasons).toContain('Very high transaction amount - requires review');
    });

    it('should flag suspicious velocity', async () => {
      mockPrismaService.deal.count.mockResolvedValue(15);

      const result = await service.checkDealCreation(1, 500, 'USD');

      expect(result.riskScore).toBeGreaterThanOrEqual(0.4);
      expect(result.reasons).toContain('Suspicious velocity - too many deals in 24h');
      expect(result.checks.velocityCheck).toBe(false);
    });
  });

  describe('checkPaymentHold', () => {
    it('should return low risk for valid payment', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: 1,
        amount: 1000,
        buyer: {
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        seller: {},
      });

      const result = await service.checkPaymentHold(1, 1000, 'USD');

      expect(result.riskScore).toBeLessThan(0.8);
      expect(result.isBlocked).toBe(false);
    });

    it('should block if deal not found', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue(null);

      const result = await service.checkPaymentHold(999, 1000, 'USD');

      expect(result.riskScore).toBe(1.0);
      expect(result.isBlocked).toBe(true);
      expect(result.reasons).toContain('Deal not found');
    });

    it('should flag amount mismatch', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: 1,
        amount: 1000,
        buyer: {
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        seller: {},
      });

      const result = await service.checkPaymentHold(1, 2000, 'USD');

      expect(result.riskScore).toBeGreaterThanOrEqual(0.6);
      expect(result.reasons).toContain('Payment amount mismatch');
    });

    it('should flag new user with high value', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: 1,
        amount: 5000,
        buyer: {
          createdAt: new Date(Date.now() - 1000),
        },
        seller: {},
      });

      const result = await service.checkPaymentHold(1, 5000, 'USD');

      expect(result.riskScore).toBeGreaterThanOrEqual(0.5);
      expect(result.reasons).toContain('New user with high-value transaction');
    });
  });

  describe('logFraudCheck', () => {
    it('should log fraud check to audit', async () => {
      const result = {
        riskScore: 0.5,
        isBlocked: false,
        reasons: ['test'],
        checks: { emailCheck: true, amountCheck: true, velocityCheck: true },
      };

      await service.logFraudCheck('user_signup', 1, result, 1);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'FRAUD_CHECK_USER_SIGNUP',
          entity: 'user_signup',
          entityId: 1,
          userId: 1,
        }),
      });
    });
  });
});
