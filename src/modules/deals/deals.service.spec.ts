import { Test, TestingModule } from '@nestjs/testing';
import { DealsService } from './deals.service';
import { PrismaService } from '../../prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { FraudService } from '../../hooks/kyc_fraud/fraud.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DealsService', () => {
  let service: DealsService;
  let prisma: PrismaService;
  let paymentsService: PaymentsService;
  let eventEmitter: EventEmitter2;

  const mockPaymentsService = {
    holdPayment: jest.fn(),
    capturePayment: jest.fn(),
    refundPayment: jest.fn(),
  };

  const mockPrismaService = {
    deal: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const mockFraudService = {
    checkDealCreation: jest.fn().mockResolvedValue({
      riskScore: 0.3,
      isBlocked: false,
      reasons: [],
      checks: { emailCheck: true, amountCheck: true, velocityCheck: true },
    }),
    logFraudCheck: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockDeal = {
    id: 1,
    buyerId: 1,
    sellerId: 2,
    title: 'Test Deal',
    description: 'Test description',
    amount: 100.0,
    currency: 'USD',
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
    buyer: { id: 1, email: 'buyer@test.com', username: 'buyer' },
    seller: { id: 2, email: 'seller@test.com', username: 'seller' },
    payments: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
        {
          provide: FraudService,
          useValue: mockFraudService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<DealsService>(DealsService);
    prisma = module.get<PrismaService>(PrismaService);
    paymentsService = module.get<PaymentsService>(PaymentsService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDeal', () => {
    it('should create a new deal with PENDING status', async () => {
      const createDealDto = {
        buyerId: 1,
        sellerId: 2,
        title: 'Test Deal',
        amount: 100.0,
      };

      mockPrismaService.deal.create.mockResolvedValue(mockDeal);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.createDeal(createDealDto);

      expect(result).toEqual(mockDeal);
      expect(prisma.deal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { ...createDealDto, status: 'PENDING' },
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('state transitions', () => {
    beforeEach(() => {
      mockPrismaService.deal.findUnique.mockResolvedValue(mockDeal);
      mockPrismaService.auditLog.create.mockResolvedValue({});
    });

    it('should transition from PENDING to FUNDED', async () => {
      const updatedDeal = { ...mockDeal, status: 'FUNDED' };
      mockPrismaService.deal.update.mockResolvedValue(updatedDeal);

      const result = await service.fundDeal(1, 1);

      expect(result.status).toBe('FUNDED');
      expect(prisma.deal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { status: 'FUNDED' },
        }),
      );
    });

    it('should transition from FUNDED to IN_PROGRESS', async () => {
      const fundedDeal = { ...mockDeal, status: 'FUNDED' };
      mockPrismaService.deal.findUnique.mockResolvedValue(fundedDeal);
      mockPrismaService.deal.update.mockResolvedValue({
        ...fundedDeal,
        status: 'IN_PROGRESS',
      });

      const result = await service.confirmExecution(1, 2);

      expect(result.status).toBe('IN_PROGRESS');
    });

    it('should transition from IN_PROGRESS to COMPLETED', async () => {
      const inProgressDeal = { ...mockDeal, status: 'IN_PROGRESS' };
      mockPrismaService.deal.findUnique.mockResolvedValue(inProgressDeal);
      mockPrismaService.deal.update.mockResolvedValue({
        ...inProgressDeal,
        status: 'COMPLETED',
      });

      const result = await service.acceptByBuyer(1, 1);

      expect(result.status).toBe('COMPLETED');
    });

    it('should raise dispute from IN_PROGRESS', async () => {
      const inProgressDeal = { ...mockDeal, status: 'IN_PROGRESS' };
      mockPrismaService.deal.findUnique.mockResolvedValue(inProgressDeal);
      mockPrismaService.deal.update.mockResolvedValue({
        ...inProgressDeal,
        status: 'DISPUTED',
      });

      const result = await service.raiseDispute(1, 1, 'Quality issues');

      expect(result.status).toBe('DISPUTED');
    });

    it('should reject invalid state transition', async () => {
      const completedDeal = { ...mockDeal, status: 'COMPLETED' };
      mockPrismaService.deal.findUnique.mockResolvedValue(completedDeal);

      await expect(service.fundDeal(1, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('authorization checks', () => {
    beforeEach(() => {
      mockPrismaService.deal.findUnique.mockResolvedValue(mockDeal);
    });

    it('should reject confirmation from non-seller', async () => {
      await expect(service.confirmExecution(1, 1)).rejects.toThrow(
        'Only seller can confirm execution',
      );
    });

    it('should reject acceptance from non-buyer', async () => {
      await expect(service.acceptByBuyer(1, 2)).rejects.toThrow(
        'Only buyer can accept the deal',
      );
    });

    it('should allow dispute from buyer or seller', async () => {
      const inProgressDeal = { ...mockDeal, status: 'IN_PROGRESS' };
      mockPrismaService.deal.findUnique.mockResolvedValue(inProgressDeal);
      mockPrismaService.deal.update.mockResolvedValue({
        ...inProgressDeal,
        status: 'DISPUTED',
      });

      const result = await service.raiseDispute(1, 1, 'Issue');
      expect(result).toBeDefined();

      const result2 = await service.raiseDispute(1, 2, 'Issue');
      expect(result2).toBeDefined();
    });

    it('should reject dispute from non-participant', async () => {
      await expect(service.raiseDispute(1, 999, 'Issue')).rejects.toThrow(
        'Only deal participants can raise disputes',
      );
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when deal does not exist', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
