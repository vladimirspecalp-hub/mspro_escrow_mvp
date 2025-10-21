import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { MockEmailAdapter } from '../src/modules/notifications/email/adapters/mock-email.adapter';
import { MockTelegramAdapter } from '../src/modules/notifications/telegram/adapters/mock-telegram.adapter';
import { EMAIL_ADAPTER } from '../src/modules/notifications/email/adapters/email-adapter.interface';
import { TELEGRAM_ADAPTER } from '../src/modules/notifications/telegram/adapters/telegram-adapter.interface';

describe('Notifications E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let emailAdapter: MockEmailAdapter;
  let telegramAdapter: MockTelegramAdapter;

  let buyerUser: any;
  let sellerUser: any;

  beforeAll(async () => {
    jest.setTimeout(30000);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    emailAdapter = app.get(EMAIL_ADAPTER);
    telegramAdapter = app.get(TELEGRAM_ADAPTER);

    await prisma.auditLog.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.user.deleteMany();

    buyerUser = await prisma.user.create({
      data: {
        email: 'buyer-notif@test.com',
        username: 'buyer-notif',
        passwordHash: 'hash123',
        role: 'USER',
      },
    });

    sellerUser = await prisma.user.create({
      data: {
        email: 'seller-notif@test.com',
        username: 'seller-notif',
        passwordHash: 'hash456',
        role: 'USER',
      },
    });
  });

  beforeEach(() => {
    emailAdapter.clearSentEmails();
    telegramAdapter.clearSentMessages();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/deals (deal.created event)', () => {
    it('should send email notifications to buyer and seller', async () => {
      const dealDto = {
        buyerId: buyerUser.id,
        sellerId: sellerUser.id,
        title: 'Notification Test Deal',
        description: 'Testing notifications',
        amount: 250.0,
        currency: 'USD',
      };

      await request(app.getHttpServer())
        .post('/api/v1/deals')
        .send(dealDto)
        .expect(201);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const sentEmails = emailAdapter.getSentEmails();
      expect(sentEmails.length).toBeGreaterThanOrEqual(2);

      const buyerEmail = sentEmails.find((e) => e.to === buyerUser.email);
      const sellerEmail = sentEmails.find((e) => e.to === sellerUser.email);

      expect(buyerEmail).toBeDefined();
      expect(buyerEmail.subject).toContain('Deal Created');
      expect(sellerEmail).toBeDefined();
      expect(sellerEmail.subject).toContain('New Deal Request');
    });

    it('should send telegram notification to admin', async () => {
      const dealDto = {
        buyerId: buyerUser.id,
        sellerId: sellerUser.id,
        title: 'Admin Notification Test',
        description: 'Testing admin notifications',
        amount: 300.0,
        currency: 'USD',
      };

      await request(app.getHttpServer())
        .post('/api/v1/deals')
        .send(dealDto)
        .expect(201);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const sentMessages = telegramAdapter.getSentMessages();
      expect(sentMessages.length).toBeGreaterThanOrEqual(1);
      expect(sentMessages[0].text).toContain('NEW DEAL CREATED');
      expect(sentMessages[0].text).toContain('Admin Notification Test');
    });

    it('should log notifications to audit_logs', async () => {
      const dealDto = {
        buyerId: buyerUser.id,
        sellerId: sellerUser.id,
        title: 'Audit Log Test',
        description: 'Testing audit logging',
        amount: 150.0,
        currency: 'USD',
      };

      await request(app.getHttpServer())
        .post('/api/v1/deals')
        .send(dealDto)
        .expect(201);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const auditLogs = await prisma.auditLog.findMany({
        where: { entity: 'notification' },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLogs.length).toBeGreaterThanOrEqual(2);

      const emailLog = auditLogs.find((log) => log.action === 'notification.email');
      const telegramLog = auditLogs.find((log) => log.action === 'notification.telegram');

      expect(emailLog).toBeDefined();
      expect(telegramLog).toBeDefined();
    });
  });

  describe('POST /api/v1/deals/:id/dispute (dispute.opened event)', () => {
    it('should send email notification when dispute is opened', async () => {
      const deal = await prisma.deal.create({
        data: {
          buyerId: buyerUser.id,
          sellerId: sellerUser.id,
          title: 'Dispute Test Deal',
          description: 'Will be disputed',
          amount: 400.0,
          currency: 'USD',
          status: 'IN_PROGRESS',
        },
      });

      emailAdapter.clearSentEmails();

      await request(app.getHttpServer())
        .post(`/api/v1/deals/${deal.id}/dispute`)
        .send({ userId: buyerUser.id, reason: 'Product not delivered' })
        .expect(200);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const sentEmails = emailAdapter.getSentEmails();
      expect(sentEmails.length).toBeGreaterThanOrEqual(1);

      const sellerEmail = sentEmails.find((e) => e.to === sellerUser.email);
      expect(sellerEmail).toBeDefined();
      expect(sellerEmail.subject).toContain('Dispute Opened');
    });

    it('should send telegram notification to admin when dispute is opened', async () => {
      const deal = await prisma.deal.create({
        data: {
          buyerId: buyerUser.id,
          sellerId: sellerUser.id,
          title: 'Admin Dispute Notification',
          description: 'Dispute notification test',
          amount: 500.0,
          currency: 'USD',
          status: 'IN_PROGRESS',
        },
      });

      telegramAdapter.clearSentMessages();

      await request(app.getHttpServer())
        .post(`/api/v1/deals/${deal.id}/dispute`)
        .send({ userId: sellerUser.id, reason: 'Buyer not responding' })
        .expect(200);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const sentMessages = telegramAdapter.getSentMessages();
      expect(sentMessages.length).toBeGreaterThanOrEqual(1);
      expect(sentMessages[0].text).toContain('DISPUTE OPENED');
      expect(sentMessages[0].text).toContain('Admin Dispute Notification');
    });
  });

  describe('POST /api/v1/deals/:id/accept (deal.released event)', () => {
    it('should send email notifications when deal is completed', async () => {
      const deal = await prisma.deal.create({
        data: {
          buyerId: buyerUser.id,
          sellerId: sellerUser.id,
          title: 'Completion Test Deal',
          description: 'Will be completed',
          amount: 600.0,
          currency: 'USD',
          status: 'IN_PROGRESS',
        },
      });

      await prisma.payment.create({
        data: {
          dealId: deal.id,
          amount: 600.0,
          currency: 'USD',
          status: 'PROCESSING',
          paymentMethod: 'CARD',
          providerPaymentId: 'mock_hold_123',
        },
      });

      emailAdapter.clearSentEmails();

      await request(app.getHttpServer())
        .post(`/api/v1/deals/${deal.id}/accept`)
        .send({ userId: buyerUser.id })
        .expect(200);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const sentEmails = emailAdapter.getSentEmails();
      expect(sentEmails.length).toBeGreaterThanOrEqual(2);

      const sellerEmail = sentEmails.find((e) => e.to === sellerUser.email);
      const buyerEmail = sentEmails.find((e) => e.to === buyerUser.email);

      expect(sellerEmail).toBeDefined();
      expect(sellerEmail.subject).toContain('Funds Released');
      expect(buyerEmail).toBeDefined();
      expect(buyerEmail.subject).toContain('Deal Completed');
    });
  });
});
