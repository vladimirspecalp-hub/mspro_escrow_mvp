import { Test, TestingModule } from '@nestjs/testing';
import { TelegramService } from './telegram.service';
import { TELEGRAM_ADAPTER } from './adapters/telegram-adapter.interface';
import { MockTelegramAdapter } from './adapters/mock-telegram.adapter';
import { PrismaService } from '../../../prisma.service';

describe('TelegramService', () => {
  let service: TelegramService;
  let telegramAdapter: MockTelegramAdapter;
  let prisma: PrismaService;

  const mockPrismaService = {
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramService,
        {
          provide: TELEGRAM_ADAPTER,
          useClass: MockTelegramAdapter,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);
    telegramAdapter = module.get<MockTelegramAdapter>(TELEGRAM_ADAPTER);
    prisma = module.get<PrismaService>(PrismaService);

    telegramAdapter.clearSentMessages();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleDisputeOpened', () => {
    it('should send notification to admin chat', async () => {
      const event = {
        dealId: 1,
        buyerEmail: 'buyer@test.com',
        sellerEmail: 'seller@test.com',
        title: 'Disputed Deal',
        openedBy: 'buyer' as const,
        reason: 'Product not delivered',
      };

      await service.handleDisputeOpened(event);

      const sentMessages = telegramAdapter.getSentMessages();
      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0].text).toContain('DISPUTE OPENED');
      expect(sentMessages[0].text).toContain('Disputed Deal');
      expect(sentMessages[0].text).toContain('buyer');
      expect(sentMessages[0].parseMode).toBe('HTML');
    });

    it('should log notification to audit', async () => {
      const event = {
        dealId: 1,
        buyerEmail: 'buyer@test.com',
        sellerEmail: 'seller@test.com',
        title: 'Disputed Deal',
        openedBy: 'buyer' as const,
      };

      await service.handleDisputeOpened(event);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'notification.telegram',
            entity: 'notification',
            entityId: 1,
          }),
        }),
      );
    });
  });

  describe('handleDealCreated', () => {
    it('should send notification to admin chat', async () => {
      const event = {
        dealId: 2,
        buyerEmail: 'buyer@test.com',
        sellerEmail: 'seller@test.com',
        title: 'New Deal',
        amount: 500,
        currency: 'USD',
      };

      await service.handleDealCreated(event);

      const sentMessages = telegramAdapter.getSentMessages();
      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0].text).toContain('NEW DEAL CREATED');
      expect(sentMessages[0].text).toContain('New Deal');
      expect(sentMessages[0].text).toContain('500 USD');
      expect(sentMessages[0].parseMode).toBe('HTML');
    });

    it('should log notification to audit', async () => {
      const event = {
        dealId: 2,
        buyerEmail: 'buyer@test.com',
        sellerEmail: 'seller@test.com',
        title: 'New Deal',
        amount: 500,
        currency: 'USD',
      };

      await service.handleDealCreated(event);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'notification.telegram',
            entity: 'notification',
            entityId: 2,
          }),
        }),
      );
    });
  });
});
