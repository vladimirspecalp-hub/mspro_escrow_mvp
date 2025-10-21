import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { EMAIL_ADAPTER } from './adapters/email-adapter.interface';
import { MockEmailAdapter } from './adapters/mock-email.adapter';
import { PrismaService } from '../../../prisma.service';

describe('EmailService', () => {
  let service: EmailService;
  let emailAdapter: MockEmailAdapter;
  let prisma: PrismaService;

  const mockPrismaService = {
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: EMAIL_ADAPTER,
          useClass: MockEmailAdapter,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    emailAdapter = module.get<MockEmailAdapter>(EMAIL_ADAPTER);
    prisma = module.get<PrismaService>(PrismaService);

    emailAdapter.clearSentEmails();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleDealCreated', () => {
    it('should send emails to buyer and seller', async () => {
      const event = {
        dealId: 1,
        buyerEmail: 'buyer@test.com',
        sellerEmail: 'seller@test.com',
        title: 'Test Deal',
        amount: 100,
        currency: 'USD',
      };

      await service.handleDealCreated(event);

      const sentEmails = emailAdapter.getSentEmails();
      expect(sentEmails).toHaveLength(2);
      expect(sentEmails[0].to).toBe('buyer@test.com');
      expect(sentEmails[0].subject).toContain('Deal Created');
      expect(sentEmails[1].to).toBe('seller@test.com');
      expect(sentEmails[1].subject).toContain('New Deal Request');
    });

    it('should log notification to audit', async () => {
      const event = {
        dealId: 1,
        buyerEmail: 'buyer@test.com',
        sellerEmail: 'seller@test.com',
        title: 'Test Deal',
        amount: 100,
        currency: 'USD',
      };

      await service.handleDealCreated(event);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'notification.email',
            entity: 'notification',
            entityId: 1,
          }),
        }),
      );
    });
  });

  describe('handleDealReleased', () => {
    it('should send emails to buyer and seller', async () => {
      const event = {
        dealId: 2,
        buyerEmail: 'buyer@test.com',
        sellerEmail: 'seller@test.com',
        title: 'Released Deal',
        amount: 200,
        currency: 'USD',
      };

      await service.handleDealReleased(event);

      const sentEmails = emailAdapter.getSentEmails();
      expect(sentEmails).toHaveLength(2);
      expect(sentEmails[0].to).toBe('seller@test.com');
      expect(sentEmails[0].subject).toContain('Funds Released');
      expect(sentEmails[1].to).toBe('buyer@test.com');
      expect(sentEmails[1].subject).toContain('Deal Completed');
    });

    it('should log notification to audit', async () => {
      const event = {
        dealId: 2,
        buyerEmail: 'buyer@test.com',
        sellerEmail: 'seller@test.com',
        title: 'Released Deal',
        amount: 200,
        currency: 'USD',
      };

      await service.handleDealReleased(event);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'notification.email',
            entity: 'notification',
            entityId: 2,
          }),
        }),
      );
    });
  });

  describe('handleDisputeOpened', () => {
    it('should send email to the other party when buyer opens dispute', async () => {
      const event = {
        dealId: 3,
        buyerEmail: 'buyer@test.com',
        sellerEmail: 'seller@test.com',
        title: 'Disputed Deal',
        openedBy: 'buyer' as const,
        reason: 'Product not as described',
      };

      await service.handleDisputeOpened(event);

      const sentEmails = emailAdapter.getSentEmails();
      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0].to).toBe('seller@test.com');
      expect(sentEmails[0].subject).toContain('Dispute Opened');
    });

    it('should send email to buyer when seller opens dispute', async () => {
      const event = {
        dealId: 3,
        buyerEmail: 'buyer@test.com',
        sellerEmail: 'seller@test.com',
        title: 'Disputed Deal',
        openedBy: 'seller' as const,
      };

      await service.handleDisputeOpened(event);

      const sentEmails = emailAdapter.getSentEmails();
      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0].to).toBe('buyer@test.com');
    });

    it('should log notification to audit', async () => {
      const event = {
        dealId: 3,
        buyerEmail: 'buyer@test.com',
        sellerEmail: 'seller@test.com',
        title: 'Disputed Deal',
        openedBy: 'buyer' as const,
      };

      await service.handleDisputeOpened(event);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'notification.email',
            entity: 'notification',
            entityId: 3,
          }),
        }),
      );
    });
  });
});
