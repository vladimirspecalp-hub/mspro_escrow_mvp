import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

describe('Payments E2E (Full Escrow Flow)', () => {
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
        email: 'buyer.payment@test.com',
        username: 'buyer_payment',
        passwordHash: 'hashed_password',
      },
    });

    sellerUser = await prisma.user.create({
      data: {
        email: 'seller.payment@test.com',
        username: 'seller_payment',
        passwordHash: 'hashed_password',
      },
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.auditLog.deleteMany();
      await prisma.payment.deleteMany();
      await prisma.deal.deleteMany();
      await prisma.user.deleteMany();
    }
    if (app) {
      await app.close();
    }
  });

  describe('Full Escrow Flow with Payments', () => {
    let dealId: number;

    it('should create a deal (PENDING state, no payment yet)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/deals')
        .send({
          buyerId: buyerUser.id,
          sellerId: sellerUser.id,
          title: 'Test Escrow Deal',
          amount: 500,
          currency: 'USD',
        })
        .expect(201);

      expect(response.body.status).toBe('PENDING');
      dealId = response.body.id;

      const payments = await prisma.payment.findMany({ where: { dealId } });
      expect(payments.length).toBe(0);
    });

    it('should fund the deal (FUNDED state, payment hold created)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/deals/${dealId}/fund`)
        .send({ userId: buyerUser.id })
        .expect(201);

      const payments = await prisma.payment.findMany({ where: { dealId } });
      expect(payments.length).toBe(1);
      expect(payments[0].status).toBe('PENDING');
      expect(payments[0].provider).toBe('mock');
      expect(payments[0].providerPaymentId).toMatch(/^mock_hold_/);
      expect(Number(payments[0].amount)).toBe(500);

      const auditLogs = await prisma.auditLog.findMany({
        where: { action: 'PAYMENT_HOLD_CREATED' },
      });
      expect(auditLogs.length).toBeGreaterThan(0);
    });

    it('should confirm execution by seller (IN_PROGRESS state)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/deals/${dealId}/confirm`)
        .send({ userId: sellerUser.id })
        .expect(201);

      const deal = await prisma.deal.findUnique({ where: { id: dealId } });
      expect(deal.status).toBe('IN_PROGRESS');
    });

    it('should accept by buyer (COMPLETED state, payment captured)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/deals/${dealId}/accept`)
        .send({ userId: buyerUser.id })
        .expect(201);

      const deal = await prisma.deal.findUnique({ where: { id: dealId } });
      expect(deal.status).toBe('COMPLETED');

      const payments = await prisma.payment.findMany({ where: { dealId } });
      expect(payments[0].status).toBe('COMPLETED');
      expect(payments[0].providerTransactionId).toMatch(/^mock_tx_/);

      const auditLogs = await prisma.auditLog.findMany({
        where: { action: 'PAYMENT_CAPTURED' },
      });
      expect(auditLogs.length).toBeGreaterThan(0);
    });

    it('should get payments for the deal', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/payments/deal/${dealId}`)
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].status).toBe('COMPLETED');
    });

    it('should get payment status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/payments/deal/${dealId}/status`)
        .expect(200);

      expect(response.body.payment).toBeDefined();
      expect(response.body.providerStatus).toBeDefined();
      expect(response.body.providerStatus.status).toBe('captured');
    });

    it('should get all payments', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/payments')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('Cancelled Deal Flow with Refund', () => {
    let dealId: number;

    it('should create and fund a deal', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/deals')
        .send({
          buyerId: buyerUser.id,
          sellerId: sellerUser.id,
          title: 'Deal to Cancel',
          amount: 300,
          currency: 'USD',
        })
        .expect(201);

      dealId = createResponse.body.id;

      await request(app.getHttpServer())
        .post(`/api/v1/deals/${dealId}/fund`)
        .send({ userId: buyerUser.id })
        .expect(201);

      const payments = await prisma.payment.findMany({ where: { dealId } });
      expect(payments.length).toBe(1);
      expect(payments[0].status).toBe('PENDING');
    });

    it('should cancel the deal and refund payment', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/deals/${dealId}/cancel`)
        .send({ userId: buyerUser.id, reason: 'Changed my mind' })
        .expect(201);

      const deal = await prisma.deal.findUnique({ where: { id: dealId } });
      expect(deal.status).toBe('CANCELLED');

      const payments = await prisma.payment.findMany({ where: { dealId } });
      expect(payments[0].status).toBe('REFUNDED');

      const auditLogs = await prisma.auditLog.findMany({
        where: { action: 'PAYMENT_REFUNDED' },
      });
      expect(auditLogs.length).toBeGreaterThan(0);
    });
  });

});
