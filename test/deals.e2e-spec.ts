import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma.service';

describe('Deals (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let buyer: any;
  let seller: any;
  let deal: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    await prisma.auditLog.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.user.deleteMany();

    buyer = await prisma.user.create({
      data: {
        email: 'buyer@test.com',
        username: 'buyer_test',
        passwordHash: 'hash',
      },
    });

    seller = await prisma.user.create({
      data: {
        email: 'seller@test.com',
        username: 'seller_test',
        passwordHash: 'hash',
      },
    });
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('/api/v1/deals (POST)', () => {
    it('should create a new deal', () => {
      return request(app.getHttpServer())
        .post('/api/v1/deals')
        .send({
          buyerId: buyer.id,
          sellerId: seller.id,
          title: 'Test Escrow Deal',
          description: 'E2E test deal',
          amount: 500.0,
          currency: 'USD',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.status).toBe('PENDING');
          expect(res.body.title).toBe('Test Escrow Deal');
          deal = res.body;
        });
    });
  });

  describe('/api/v1/deals/:id/fund (POST)', () => {
    it('should fund the deal', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/deals/${deal.id}/fund`)
        .send({ userId: buyer.id })
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('FUNDED');
        });
    });
  });

  describe('/api/v1/deals/:id/confirm (POST)', () => {
    it('should confirm execution by seller', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/deals/${deal.id}/confirm`)
        .send({ userId: seller.id })
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('IN_PROGRESS');
        });
    });
  });

  describe('/api/v1/deals/:id/accept (POST)', () => {
    it('should accept deal by buyer', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/deals/${deal.id}/accept`)
        .send({ userId: buyer.id })
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('COMPLETED');
        });
    });
  });

  describe('/api/v1/deals (GET)', () => {
    it('should return all deals', () => {
      return request(app.getHttpServer())
        .get('/api/v1/deals')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('audit logs', () => {
    it('should have created audit logs for all transitions', async () => {
      const logs = await prisma.auditLog.findMany({
        where: { entity: 'deal', entityId: deal.id },
        orderBy: { createdAt: 'asc' },
      });

      expect(logs.length).toBeGreaterThanOrEqual(4);
      expect(logs[0].action).toBe('DEAL_CREATED');
      expect(logs.find((l) => l.action === 'DEAL_FUNDED')).toBeDefined();
      expect(logs.find((l) => l.action === 'DEAL_CONFIRMED')).toBeDefined();
      expect(logs.find((l) => l.action === 'DEAL_ACCEPTED')).toBeDefined();
    });
  });
});
