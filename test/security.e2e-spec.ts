import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

describe('Security E2E', () => {
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
        email: 'buyer.security@test.com',
        username: 'buyer_security',
        passwordHash: 'hashed_password',
      },
    });

    sellerUser = await prisma.user.create({
      data: {
        email: 'seller.security@test.com',
        username: 'seller_security',
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

  describe('Fraud Detection', () => {
    it('should block deal with very high amount (>$50k)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/deals')
        .send({
          buyerId: buyerUser.id,
          sellerId: sellerUser.id,
          title: 'High Value Deal',
          description: 'This should be blocked',
          amount: 60000,
          currency: 'USD',
        })
        .expect(201);

      expect(response.body.status).toBe('PENDING_REVIEW');

      const fraudLogs = await prisma.auditLog.findMany({
        where: {
          action: 'FRAUD_CHECK_DEAL_CREATION',
          userId: buyerUser.id,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(fraudLogs.length).toBe(1);
      expect(fraudLogs[0].details['isBlocked']).toBe(true);
      expect(fraudLogs[0].details['riskScore']).toBeGreaterThanOrEqual(0.8);
    });

    it('should allow normal deal to proceed', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/deals')
        .send({
          buyerId: buyerUser.id,
          sellerId: sellerUser.id,
          title: 'Normal Deal',
          description: 'This should pass',
          amount: 500,
          currency: 'USD',
        })
        .expect(201);

      expect(response.body.status).toBe('PENDING');

      const fraudLogs = await prisma.auditLog.findMany({
        where: {
          action: 'FRAUD_CHECK_DEAL_CREATION',
          userId: buyerUser.id,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(fraudLogs.length).toBe(1);
      expect(fraudLogs[0].details['isBlocked']).toBe(false);
    });

    it('should create fraud logs in audit trail', async () => {
      const fraudLogsCount = await prisma.auditLog.count({
        where: {
          action: {
            startsWith: 'FRAUD_CHECK_',
          },
        },
      });

      expect(fraudLogsCount).toBeGreaterThan(0);

      const sampleLog = await prisma.auditLog.findFirst({
        where: {
          action: {
            startsWith: 'FRAUD_CHECK_',
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(sampleLog.details['riskScore']).toBeDefined();
      expect(sampleLog.details['isBlocked']).toBeDefined();
      expect(sampleLog.details['checks']).toBeDefined();
    });
  });

  describe('Audit Logging', () => {
    it('should log HTTP requests via audit middleware', async () => {
      await request(app.getHttpServer()).post('/api/v1/deals').send({
        buyerId: buyerUser.id,
        sellerId: sellerUser.id,
        title: 'Audit Test Deal',
        amount: 100,
        currency: 'USD',
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          action: 'HTTP_POST',
          entity: 'http_request',
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].actionContext).toBeDefined();
      expect(auditLogs[0].actionContext['method']).toBe('POST');
      expect(auditLogs[0].actionContext['path']).toBe('/api/v1/deals');
    });
  });
});
