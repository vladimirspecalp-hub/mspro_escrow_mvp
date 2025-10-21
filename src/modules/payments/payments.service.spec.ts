import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../prisma.service';
import { MockPaymentAdapter } from './adapters/mock.adapter';
import { PAYMENT_ADAPTER } from './payments.module';
import { NotFoundException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: PrismaService;
  let adapter: MockPaymentAdapter;

  const mockPrismaService = {
    payment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PAYMENT_ADAPTER,
          useClass: MockPaymentAdapter,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get<PrismaService>(PrismaService);
    adapter = module.get<MockPaymentAdapter>(PAYMENT_ADAPTER);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('holdPayment', () => {
    it('should create a payment hold', async () => {
      const mockPayment = {
        id: 1,
        dealId: 1,
        amount: 100,
        currency: 'USD',
        status: 'PENDING',
        provider: 'mock',
        providerPaymentId: 'mock_hold_123',
      };

      mockPrismaService.payment.create.mockResolvedValue(mockPayment);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.holdPayment(1, 100, 'USD');

      expect(result.payment).toEqual(mockPayment);
      expect(result.holdResult.status).toBe('held');
      expect(result.holdResult.amount).toBe(100);
      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            dealId: 1,
            amount: 100,
            currency: 'USD',
            status: 'PENDING',
            provider: 'mock',
          }),
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('capturePayment', () => {
    it('should capture a pending payment', async () => {
      const mockPayment = {
        id: 1,
        dealId: 1,
        amount: 100,
        currency: 'USD',
        status: 'PENDING',
        provider: 'mock',
        providerPaymentId: 'mock_hold_123',
      };

      const mockUpdatedPayment = {
        ...mockPayment,
        status: 'COMPLETED',
        providerTransactionId: 'mock_tx_456',
      };

      mockPrismaService.payment.findFirst.mockResolvedValue(mockPayment);
      mockPrismaService.payment.update.mockResolvedValue(mockUpdatedPayment);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const holdResult = await adapter.hold(100, 'USD');
      mockPayment.providerPaymentId = holdResult.provider_hold_id;
      mockPrismaService.payment.findFirst.mockResolvedValue(mockPayment);

      const result = await service.capturePayment(1);

      expect(result.payment.status).toBe('COMPLETED');
      expect(result.captureResult.status).toBe('captured');
      expect(prisma.payment.update).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if no pending payment found', async () => {
      mockPrismaService.payment.findFirst.mockResolvedValue(null);

      await expect(service.capturePayment(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('refundPayment', () => {
    it('should refund a payment', async () => {
      const holdResult = await adapter.hold(100, 'USD');
      const captureResult = await adapter.capture(holdResult.provider_hold_id);
      
      const mockPayment = {
        id: 1,
        dealId: 1,
        amount: 100,
        currency: 'USD',
        status: 'COMPLETED',
        provider: 'mock',
        providerPaymentId: holdResult.provider_hold_id,
        providerTransactionId: captureResult.provider_tx_id,
      };

      const mockRefundedPayment = {
        ...mockPayment,
        status: 'REFUNDED',
      };

      mockPrismaService.payment.findFirst.mockResolvedValue(mockPayment);
      mockPrismaService.payment.update.mockResolvedValue(mockRefundedPayment);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.refundPayment(1);

      expect(result.payment.status).toBe('REFUNDED');
      expect(result.refundResult.status).toBe('refunded');
      expect(prisma.payment.update).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if no payment found', async () => {
      mockPrismaService.payment.findFirst.mockResolvedValue(null);

      await expect(service.refundPayment(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPaymentStatus', () => {
    it('should get payment status', async () => {
      const mockPayment = {
        id: 1,
        dealId: 1,
        amount: 100,
        currency: 'USD',
        status: 'PENDING',
        provider: 'mock',
        providerPaymentId: 'mock_hold_123',
      };

      mockPrismaService.payment.findFirst.mockResolvedValue(mockPayment);

      const holdResult = await adapter.hold(100, 'USD');
      mockPayment.providerPaymentId = holdResult.provider_hold_id;
      mockPrismaService.payment.findFirst.mockResolvedValue(mockPayment);

      const result = await service.getPaymentStatus(1);

      expect(result.payment).toEqual(mockPayment);
      expect(result.providerStatus.status).toBe('held');
    });

    it('should throw NotFoundException if no payment found', async () => {
      mockPrismaService.payment.findFirst.mockResolvedValue(null);

      await expect(service.getPaymentStatus(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAllPayments', () => {
    it('should return all payments', async () => {
      const mockPayments = [
        { id: 1, dealId: 1, amount: 100 },
        { id: 2, dealId: 2, amount: 200 },
      ];

      mockPrismaService.payment.findMany.mockResolvedValue(mockPayments);

      const result = await service.getAllPayments();

      expect(result).toEqual(mockPayments);
      expect(prisma.payment.findMany).toHaveBeenCalled();
    });
  });

  describe('getPaymentsByDeal', () => {
    it('should return payments for a specific deal', async () => {
      const mockPayments = [{ id: 1, dealId: 1, amount: 100 }];

      mockPrismaService.payment.findMany.mockResolvedValue(mockPayments);

      const result = await service.getPaymentsByDeal(1);

      expect(result).toEqual(mockPayments);
      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { dealId: 1 },
        }),
      );
    });
  });
});
