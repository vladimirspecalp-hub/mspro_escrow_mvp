import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

describe('Audit & Error Handling E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let testUser: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    await prisma.auditLog.deleteMany({});

    testUser = await prisma.user.findFirst();
    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'audit-test@example.com',
          username: 'auditTestUser',
          password: 'hashed',
          name: 'Audit Test User',
          role: 'USER',
          kycStatus: 'VERIFIED',
        },
      });
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Audit Logging', () => {
    it('should log POST requests to audit_logs', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/deals')
        .send({
          buyerId: testUser.id,
          sellerId: testUser.id,
          title: 'Audit Test Deal',
          description: 'Testing audit logging',
          amount: 100,
          currency: 'USD',
        })
        .expect(201);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          action: 'HTTP_POST',
          entity: 'http_request',
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      const log = auditLogs[0];
      expect(log.action).toBe('HTTP_POST');
      expect(log.actionContext).toHaveProperty('method', 'POST');
      expect(log.actionContext).toHaveProperty('path');
      expect(log.actionContext).toHaveProperty('statusCode', 201);
    });

    it('should log error responses', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/nonexistent')
        .expect(404);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const errorLogs = await prisma.auditLog.findMany({
        where: {
          action: 'HTTP_GET',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(errorLogs.length).toBeGreaterThan(0);
    });

    it('should not log health check requests', async () => {
      const beforeCount = await prisma.auditLog.count();

      await request(app.getHttpServer()).get('/health').expect(200);

      await new Promise((resolve) => setTimeout(resolve, 300));

      const afterCount = await prisma.auditLog.count();
      expect(afterCount).toBe(beforeCount);
    });
  });

  describe('Error Handling', () => {
    it('should return formatted 404 error', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/invalid-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path', '/api/v1/invalid-endpoint');
    });

    it('should return formatted 400 validation error', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/deals')
        .send({
          title: 'Invalid Deal',
        });

      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path', '/api/v1/deals');
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      process.env.RATE_LIMIT_ENABLED = 'true';
      process.env.RATE_LIMIT_GUEST = '5';
    });

    it('should enforce rate limits for guest users', async () => {
      const responses: any[] = [];

      for (let i = 0; i < 7; i++) {
        const res = await request(app.getHttpServer())
          .get('/health')
          .set('X-Forwarded-For', '192.168.1.100');
        responses.push(res);
      }

      const limitExceeded = responses.some((r) => r.status === 429);
      expect(limitExceeded).toBe(true);

      const successResponses = responses.filter((r) => r.status === 200);
      expect(successResponses.length).toBeGreaterThan(0);
    }, 10000);

    it('should include rate limit headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .set('X-Forwarded-For', '192.168.1.101');

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });

    it('should return 429 with retry-after header when limit exceeded', async () => {
      for (let i = 0; i < 10; i++) {
        await request(app.getHttpServer())
          .get('/health')
          .set('X-Forwarded-For', '192.168.1.102');
      }

      const response = await request(app.getHttpServer())
        .get('/health')
        .set('X-Forwarded-For', '192.168.1.102');

      if (response.status === 429) {
        expect(response.body).toHaveProperty('statusCode', 429);
        expect(response.body).toHaveProperty('message');
        expect(response.headers).toHaveProperty('retry-after');
      }
    }, 10000);
  });
});
