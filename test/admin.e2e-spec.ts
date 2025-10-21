import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { PaymentsService } from '../src/modules/payments/payments.service';

describe('Admin E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let paymentsService: PaymentsService;
  let adminUser: any;
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
    paymentsService = app.get<PaymentsService>(PaymentsService);

    adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        username: 'admin_user',
        passwordHash: 'hashed_password',
        role: 'ADMIN',
      },
    });

    buyerUser = await prisma.user.create({
      data: {
        email: 'buyer.admin@test.com',
        username: 'buyer_admin',
        passwordHash: 'hashed_password',
      },
    });

    sellerUser = await prisma.user.create({
      data: {
        email: 'seller.admin@test.com',
        username: 'seller_admin',
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

  describe('GET /api/v1/admin/disputes', () => {
    it('should return all disputed deals', async () => {
      await prisma.deal.create({
        data: {
          buyerId: buyerUser.id,
          sellerId: sellerUser.id,
          title: 'Disputed Deal',
          amount: 100,
          currency: 'USD',
          status: 'DISPUTED',
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/disputes')
        .query({ adminId: adminUser.id })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].status).toBe('DISPUTED');
    });
  });

  describe('POST /api/v1/admin/deals/:id/resolve', () => {
    it('should resolve disputed deal to COMPLETED and log audit', async () => {
      const deal = await prisma.deal.create({
        data: {
          buyerId: buyerUser.id,
          sellerId: sellerUser.id,
          title: 'Admin Resolve Test',
          amount: 150,
          currency: 'USD',
          status: 'DISPUTED',
        },
      });

      paymentsService.registerTestTransaction('mock_admin_resolve_1', 150, 'USD', 'held');

      const payment = await prisma.payment.create({
        data: {
          dealId: deal.id,
          amount: 150,
          currency: 'USD',
          status: 'PENDING',
          provider: 'mock',
          providerPaymentId: 'mock_admin_resolve_1',
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/v1/admin/deals/${deal.id}/resolve`)
        .send({
          adminId: adminUser.id,
          action: 'COMPLETE',
          reason: 'Manual review completed',
        })
        .expect(201);

      expect(response.body.status).toBe('COMPLETED');
      expect(response.body.resolvedBy).toBe(adminUser.id);
      expect(response.body.resolvedAt).toBeDefined();

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'ADMIN_RESOLVE_DEAL',
          entityId: deal.id,
        },
      });
      expect(auditLog).toBeDefined();
      expect(auditLog.userId).toBe(adminUser.id);
    });

    it('should resolve disputed deal to CANCELLED and refund payment', async () => {
      const deal = await prisma.deal.create({
        data: {
          buyerId: buyerUser.id,
          sellerId: sellerUser.id,
          title: 'Admin Refund Test',
          amount: 200,
          currency: 'USD',
          status: 'DISPUTED',
        },
      });

      paymentsService.registerTestTransaction('mock_admin_refund_1', 200, 'USD', 'held');

      await prisma.payment.create({
        data: {
          dealId: deal.id,
          amount: 200,
          currency: 'USD',
          status: 'PENDING',
          provider: 'mock',
          providerPaymentId: 'mock_admin_refund_1',
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/v1/admin/deals/${deal.id}/resolve`)
        .send({
          adminId: adminUser.id,
          action: 'REFUND',
          reason: 'Seller violated terms',
        })
        .expect(201);

      expect(response.body.status).toBe('CANCELLED');
      expect(response.body.resolvedBy).toBe(adminUser.id);
    });

    it('should reject resolution from non-admin user', async () => {
      const deal = await prisma.deal.create({
        data: {
          buyerId: buyerUser.id,
          sellerId: sellerUser.id,
          title: 'Non-admin Test',
          amount: 100,
          currency: 'USD',
          status: 'DISPUTED',
        },
      });

      await request(app.getHttpServer())
        .post(`/api/v1/admin/deals/${deal.id}/resolve`)
        .send({
          adminId: buyerUser.id,
          action: 'COMPLETE',
        })
        .expect(403);
    });
  });

  describe('GET /api/v1/admin/deals', () => {
    it('should return all deals with filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/deals')
        .query({ adminId: adminUser.id, status: 'DISPUTED', limit: '10' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
