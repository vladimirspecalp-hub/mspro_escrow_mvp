import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

describe('Webhooks E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let buyerUser: any;
  let sellerUser: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    buyerUser = await prisma.user.create({
      data: {
        email: 'buyer.webhook@test.com',
        username: 'buyer_webhook',
        passwordHash: 'hashed_password',
      },
    });

    sellerUser = await prisma.user.create({
      data: {
        email: 'seller.webhook@test.com',
        username: 'seller_webhook',
        passwordHash: 'hashed_password',
      },
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.webhookEvent.deleteMany();
      await prisma.auditLog.deleteMany();
      await prisma.payment.deleteMany();
      await prisma.deal.deleteMany();
      await prisma.user.deleteMany();
    }
    if (app) {
      await app.close();
    }
  });

  describe('POST /api/v1/payments/webhook', () => {
    it('should process payment.succeeded webhook and update deal status', async () => {
      const deal = await prisma.deal.create({
        data: {
          buyerId: buyerUser.id,
          sellerId: sellerUser.id,
          title: 'Webhook Test Deal',
          amount: 100,
          currency: 'USD',
          status: 'IN_PROGRESS',
        },
      });

      const payment = await prisma.payment.create({
        data: {
          dealId: deal.id,
          amount: 100,
          currency: 'USD',
          status: 'PENDING',
          provider: 'mock',
          providerPaymentId: 'mock_pay_webhook_1',
        },
      });

      const webhookPayload = {
        provider: 'mock',
        eventId: 'evt_webhook_success_1',
        eventType: 'payment.succeeded',
        payload: {
          dealId: deal.id,
          providerPaymentId: 'mock_pay_webhook_1',
        },
      };

      await request(app.getHttpServer())
        .post('/api/v1/payments/webhook')
        .send(webhookPayload)
        .expect(200);

      const updatedPayment = await prisma.payment.findUnique({ where: { id: payment.id } });
      expect(updatedPayment.status).toBe('COMPLETED');

      const updatedDeal = await prisma.deal.findUnique({ where: { id: deal.id } });
      expect(updatedDeal.status).toBe('COMPLETED');

      const webhookEvent = await prisma.webhookEvent.findUnique({
        where: { eventId: 'evt_webhook_success_1' },
      });
      expect(webhookEvent.processed).toBe(true);

      const auditLog = await prisma.auditLog.findFirst({
        where: { action: 'WEBHOOK_PROCESSED' },
      });
      expect(auditLog).toBeDefined();
    });

    it('should handle idempotency - return success for already processed webhook', async () => {
      const webhookPayload = {
        provider: 'mock',
        eventId: 'evt_webhook_success_1',
        eventType: 'payment.succeeded',
        payload: {
          dealId: 1,
          providerPaymentId: 'mock_pay_webhook_1',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/webhook')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.processed).toBe(true);
      expect(response.body.eventId).toBe('evt_webhook_success_1');
    });

    it('should process payment.refunded webhook', async () => {
      const deal = await prisma.deal.create({
        data: {
          buyerId: buyerUser.id,
          sellerId: sellerUser.id,
          title: 'Refund Test Deal',
          amount: 200,
          currency: 'USD',
          status: 'FUNDED',
        },
      });

      const payment = await prisma.payment.create({
        data: {
          dealId: deal.id,
          amount: 200,
          currency: 'USD',
          status: 'PENDING',
          provider: 'mock',
          providerPaymentId: 'mock_pay_refund_1',
        },
      });

      const webhookPayload = {
        provider: 'mock',
        eventId: 'evt_webhook_refund_1',
        eventType: 'payment.refunded',
        payload: {
          dealId: deal.id,
          providerPaymentId: 'mock_pay_refund_1',
        },
      };

      await request(app.getHttpServer())
        .post('/api/v1/payments/webhook')
        .send(webhookPayload)
        .expect(200);

      const updatedPayment = await prisma.payment.findUnique({ where: { id: payment.id } });
      expect(updatedPayment.status).toBe('REFUNDED');

      const updatedDeal = await prisma.deal.findUnique({ where: { id: deal.id } });
      expect(updatedDeal.status).toBe('CANCELLED');
    });
  });
});
