import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { KycStatus } from '@prisma/client';

describe('KYC E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUser: any;
  let adminUser: any;
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

    // Create test users
    testUser = await prisma.user.create({
      data: {
        email: 'kyc.user@test.com',
        username: 'kyc_test_user',
        passwordHash: 'hashed_password',
        kycStatus: KycStatus.UNVERIFIED,
        riskScore: 0,
      },
    });

    adminUser = await prisma.user.create({
      data: {
        email: 'kyc.admin@test.com',
        username: 'kyc_admin',
        passwordHash: 'hashed_password',
        role: 'ADMIN',
        kycStatus: KycStatus.VERIFIED,
      },
    });

    sellerUser = await prisma.user.create({
      data: {
        email: 'kyc.seller@test.com',
        username: 'kyc_seller',
        passwordHash: 'hashed_password',
        kycStatus: KycStatus.VERIFIED,
      },
    });
  });

  afterAll(async () => {
    if (prisma) {
      // Delete all test data
      await prisma.auditLog.deleteMany({
        where: {
          OR: [
            { action: { startsWith: 'KYC_' } },
            { userId: { in: [testUser?.id, adminUser?.id, sellerUser?.id].filter(Boolean) } },
          ],
        },
      });
      await prisma.payment.deleteMany();
      await prisma.deal.deleteMany();
      await prisma.user.deleteMany({
        where: {
          OR: [
            { email: { contains: 'kyc' } },
            { email: { contains: 'unverified' } },
            { email: { contains: 'verified' } },
            { email: { contains: 'rejected' } },
            { email: { contains: 'lowrisk' } },
            { email: { contains: 'pending_' } },
            { email: { contains: 'limit_test' } },
          ],
        },
      });
    }
    if (app) {
      await app.close();
    }
  });

  describe('KYC Submission Flow', () => {
    it('should submit KYC verification request', async () => {
      // Create test user with id=1 for this test
      const kycTestUser = await prisma.user.upsert({
        where: { id: 1 },
        update: {},
        create: {
          id: 1,
          email: 'kyc.test1@test.com',
          username: 'kyc_test1',
          passwordHash: 'hashed_password',
          kycStatus: KycStatus.UNVERIFIED,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/kyc/submit')
        .send({
          fullName: 'Test User',
          documentType: 'passport',
          documentNumber: 'LOW123',
          address: '123 Test St',
          dateOfBirth: '1990-01-01',
        })
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('riskScore');
      expect(response.body).toHaveProperty('kycStatus');
    });

    it('should verify user with low risk score', async () => {
      // Update user id=1 for this test
      await prisma.user.update({
        where: { id: 1 },
        data: {
          kycStatus: KycStatus.UNVERIFIED,
          riskScore: 0,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/kyc/submit')
        .send({
          fullName: 'Low Risk User',
          documentType: 'passport',
          documentNumber: 'LOWRISK123',
          address: '123 Main St',
          dateOfBirth: '1985-05-15',
        })
        .expect(200);

      if (response.body.riskScore < 50) {
        expect(response.body.status).toBe('verified');
        expect(response.body.kycStatus).toBe(KycStatus.VERIFIED);
      }
    });

    it('should log KYC submission to audit trail', async () => {
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          action: 'KYC_SUBMIT',
        },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });
  });

  describe('KYC Status Retrieval', () => {
    it('should get KYC status for user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/kyc/status/${testUser.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('kycStatus');
      expect(response.body).toHaveProperty('riskScore');
      expect(response.body).toHaveProperty('canCreateDeal');
      expect(response.body).toHaveProperty('transactionLimit');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/kyc/status/99999')
        .expect(404);
    });
  });

  describe('Admin KYC Approval', () => {
    let pendingUser: any;

    beforeEach(async () => {
      pendingUser = await prisma.user.create({
        data: {
          email: `pending_${Date.now()}@test.com`,
          username: `pending_user_${Date.now()}`,
          passwordHash: 'hashed_password',
          kycStatus: KycStatus.PENDING,
          riskScore: 45,
        },
      });
    });

    afterEach(async () => {
      await prisma.user.delete({ where: { id: pendingUser.id } });
    });

    it('should allow admin to approve KYC', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/kyc/approve/${pendingUser.id}`)
        .query({ adminId: adminUser.id })
        .send({
          decision: 'approve',
          reason: 'Valid documents',
        })
        .expect(200);

      expect(response.body.kycStatus).toBe(KycStatus.VERIFIED);
      expect(response.body.message).toBe('User approved');
    });

    it('should allow admin to reject KYC', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/kyc/approve/${pendingUser.id}`)
        .query({ adminId: adminUser.id })
        .send({
          decision: 'reject',
          reason: 'Invalid documents',
        })
        .expect(200);

      expect(response.body.kycStatus).toBe(KycStatus.REJECTED);
      expect(response.body.message).toBe('User rejected');
    });

    it('should log admin decision to audit trail', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/kyc/approve/${pendingUser.id}`)
        .query({ adminId: adminUser.id })
        .send({
          decision: 'approve',
          reason: 'Test approval',
        });

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          action: 'KYC_ADMIN_DECISION',
          entityId: pendingUser.id,
        },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Deal Creation Restrictions', () => {
    let unverifiedBuyer: any;
    let verifiedBuyer: any;
    let rejectedBuyer: any;

    beforeAll(async () => {
      unverifiedBuyer = await prisma.user.create({
        data: {
          email: 'unverified.buyer@test.com',
          username: 'unverified_buyer',
          passwordHash: 'hashed_password',
          kycStatus: KycStatus.UNVERIFIED,
          riskScore: 0,
        },
      });

      verifiedBuyer = await prisma.user.create({
        data: {
          email: 'verified.buyer@test.com',
          username: 'verified_buyer',
          passwordHash: 'hashed_password',
          kycStatus: KycStatus.VERIFIED,
          riskScore: 30,
        },
      });

      rejectedBuyer = await prisma.user.create({
        data: {
          email: 'rejected.buyer@test.com',
          username: 'rejected_buyer',
          passwordHash: 'hashed_password',
          kycStatus: KycStatus.REJECTED,
          riskScore: 85,
        },
      });
    });

    afterAll(async () => {
      // Delete deals first, then users (only if they exist)
      const userIds = [unverifiedBuyer?.id, verifiedBuyer?.id, rejectedBuyer?.id].filter(Boolean);
      if (userIds.length > 0) {
        await prisma.deal.deleteMany({
          where: {
            buyerId: {
              in: userIds,
            },
          },
        });
        await prisma.user.deleteMany({
          where: {
            id: {
              in: userIds,
            },
          },
        });
      }
    });

    it('should block unverified user from creating high-value deal', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/deals')
        .send({
          buyerId: unverifiedBuyer.id,
          sellerId: sellerUser.id,
          title: 'High Value Deal',
          description: 'Should be blocked',
          amount: 1000,
          currency: 'USD',
        })
        .expect(403);

      expect(response.body.message).toContain('exceeds limit');
    });

    it('should allow unverified user to create low-value deal', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/deals')
        .send({
          buyerId: unverifiedBuyer.id,
          sellerId: sellerUser.id,
          title: 'Low Value Deal',
          description: 'Should pass',
          amount: 300,
          currency: 'USD',
        })
        .expect(201);

      expect(response.body.status).toBeDefined();
    });

    it('should allow verified user to create high-value deal', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/deals')
        .send({
          buyerId: verifiedBuyer.id,
          sellerId: sellerUser.id,
          title: 'Verified High Value Deal',
          description: 'Should pass',
          amount: 8000,
          currency: 'USD',
        })
        .expect(201);

      expect(response.body.status).toBeDefined();
    });

    it('should block verified user from exceeding limit', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/deals')
        .send({
          buyerId: verifiedBuyer.id,
          sellerId: sellerUser.id,
          title: 'Too High Value Deal',
          description: 'Should be blocked',
          amount: 15000,
          currency: 'USD',
        })
        .expect(403);

      expect(response.body.message).toContain('exceeds limit');
    });

    it('should block rejected user from creating any deal', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/deals')
        .send({
          buyerId: rejectedBuyer.id,
          sellerId: sellerUser.id,
          title: 'Any Deal',
          description: 'Should be blocked',
          amount: 100,
          currency: 'USD',
        })
        .expect(403);

      expect(response.body.message).toContain('rejected');
    });
  });

  describe('Transaction Limits Validation', () => {
    it('should enforce $500 limit for UNVERIFIED users', async () => {
      const unverifiedUser = await prisma.user.create({
        data: {
          email: `limit_test_${Date.now()}@test.com`,
          username: `limit_test_${Date.now()}`,
          passwordHash: 'hashed_password',
          kycStatus: KycStatus.UNVERIFIED,
        },
      });

      const statusResponse = await request(app.getHttpServer())
        .get(`/api/v1/kyc/status/${unverifiedUser.id}`)
        .expect(200);

      expect(statusResponse.body.transactionLimit).toBe(500);
      expect(statusResponse.body.canCreateDeal).toBe(false);

      await prisma.user.delete({ where: { id: unverifiedUser.id } });
    });

    it('should enforce $10,000 limit for VERIFIED users', async () => {
      const verifiedUser = await prisma.user.create({
        data: {
          email: `verified_limit_${Date.now()}@test.com`,
          username: `verified_limit_${Date.now()}`,
          passwordHash: 'hashed_password',
          kycStatus: KycStatus.VERIFIED,
        },
      });

      const statusResponse = await request(app.getHttpServer())
        .get(`/api/v1/kyc/status/${verifiedUser.id}`)
        .expect(200);

      expect(statusResponse.body.transactionLimit).toBe(10000);
      expect(statusResponse.body.canCreateDeal).toBe(true);

      await prisma.user.delete({ where: { id: verifiedUser.id } });
    });
  });
});
