import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../../prisma.service';
import { DealsService } from '../deals/deals.service';
import { PaymentsService } from '../payments/payments.service';
import { BadRequestException } from '@nestjs/common';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let prisma: PrismaService;

  const mockPrismaService = {
    webhookEvent: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    deal: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const mockDealsService = {};
  const mockPaymentsService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: DealsService,
          useValue: mockDealsService,
        },
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processWebhook', () => {
    it('should return early if webhook already processed (idempotency)', async () => {
      const dto = {
        provider: 'mock',
        eventId: 'evt_123',
        eventType: 'payment.succeeded',
        payload: { dealId: 1, providerPaymentId: 'pay_123' },
      };

      mockPrismaService.webhookEvent.findUnique.mockResolvedValue({
        id: 1,
        processed: true,
        eventId: dto.eventId,
      });

      const result = await service.processWebhook(dto);

      expect(result).toEqual({ processed: true, eventId: dto.eventId });
      expect(mockPrismaService.webhookEvent.create).not.toHaveBeenCalled();
    });

    it('should process new webhook event and log audit', async () => {
      const dto = {
        provider: 'mock',
        eventId: 'evt_456',
        eventType: 'payment.succeeded',
        payload: { dealId: 1, providerPaymentId: 'pay_456' },
      };

      mockPrismaService.webhookEvent.findUnique.mockResolvedValue(null);
      mockPrismaService.webhookEvent.create.mockResolvedValue({
        id: 2,
        ...dto,
        processed: false,
      });
      mockPrismaService.payment.findFirst.mockResolvedValue({
        id: 1,
        dealId: 1,
        providerPaymentId: 'pay_456',
        status: 'PENDING',
      });
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: 1,
        status: 'IN_PROGRESS',
      });
      mockPrismaService.webhookEvent.update.mockResolvedValue({});
      mockPrismaService.payment.update.mockResolvedValue({});
      mockPrismaService.deal.update.mockResolvedValue({});
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.processWebhook(dto);

      expect(result).toEqual({ processed: true, eventId: dto.eventId });
      expect(mockPrismaService.webhookEvent.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { processed: true, processedAt: expect.any(Date) },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException for non-mock provider with signature', async () => {
      const dto = {
        provider: 'stripe',
        eventId: 'evt_789',
        eventType: 'payment.succeeded',
        payload: {},
        signature: 'sig_abc',
      };

      mockPrismaService.webhookEvent.findUnique.mockResolvedValue(null);
      mockPrismaService.webhookEvent.create.mockResolvedValue({
        id: 3,
        ...dto,
        processed: false,
      });

      await expect(service.processWebhook(dto)).rejects.toThrow(BadRequestException);
    });
  });
});
