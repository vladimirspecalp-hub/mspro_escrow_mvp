import { Test, TestingModule } from '@nestjs/testing';
import { KycService } from './kyc.service';
import { PrismaService } from '../../prisma.service';
import { MockKycProvider } from './providers/mock.provider';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { KycStatus } from '@prisma/client';

describe('KycService', () => {
  let service: KycService;
  let prismaService: PrismaService;
  let mockKycProvider: MockKycProvider;
  let eventEmitter: EventEmitter2;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const mockEventEmitter = {
    emitAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        MockKycProvider,
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<KycService>(KycService);
    prismaService = module.get<PrismaService>(PrismaService);
    mockKycProvider = module.get<MockKycProvider>(MockKycProvider);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('submitKyc', () => {
    const mockUser = {
      id: 1,
      email: 'test@test.com',
      username: 'testuser',
      passwordHash: 'hash',
      role: 'USER' as const,
      isActive: true,
      kycStatus: KycStatus.UNVERIFIED,
      riskScore: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const kycDto = {
      fullName: 'John Doe',
      documentType: 'passport',
      documentNumber: 'AB123456',
      address: '123 Main St',
      dateOfBirth: '1990-01-01',
    };

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.submitKyc(999, kycDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user already verified', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        kycStatus: KycStatus.VERIFIED,
      });

      await expect(service.submitKyc(1, kycDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if KYC already in progress', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        kycStatus: KycStatus.PENDING,
      });

      await expect(service.submitKyc(1, kycDto)).rejects.toThrow(BadRequestException);
    });

    it('should successfully verify user with low risk score', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update
        .mockResolvedValueOnce({ ...mockUser, kycStatus: KycStatus.PENDING })
        .mockResolvedValueOnce({
          ...mockUser,
          kycStatus: KycStatus.VERIFIED,
          riskScore: 30,
        });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      jest.spyOn(mockKycProvider, 'verifyDocument').mockResolvedValue({
        status: 'verified',
        riskScore: 30,
      });

      const result = await service.submitKyc(1, kycDto);

      expect(result.status).toBe('verified');
      expect(result.riskScore).toBe(30);
      expect(result.kycStatus).toBe(KycStatus.VERIFIED);
      expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith('kyc.verified', expect.any(Object));
    });

    it('should reject user with high risk score', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update
        .mockResolvedValueOnce({ ...mockUser, kycStatus: KycStatus.PENDING })
        .mockResolvedValueOnce({
          ...mockUser,
          kycStatus: KycStatus.REJECTED,
          riskScore: 75,
        });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      jest.spyOn(mockKycProvider, 'verifyDocument').mockResolvedValue({
        status: 'rejected',
        riskScore: 75,
        reason: 'High risk score detected',
      });

      const result = await service.submitKyc(1, kycDto);

      expect(result.status).toBe('rejected');
      expect(result.riskScore).toBe(75);
      expect(result.kycStatus).toBe(KycStatus.REJECTED);
      expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith('kyc.rejected', expect.any(Object));
    });
  });

  describe('getKycStatus', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getKycStatus(999)).rejects.toThrow(NotFoundException);
    });

    it('should return KYC status for verified user', async () => {
      const mockUser = {
        id: 1,
        kycStatus: KycStatus.VERIFIED,
        riskScore: 30,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getKycStatus(1);

      expect(result.userId).toBe(1);
      expect(result.kycStatus).toBe(KycStatus.VERIFIED);
      expect(result.riskScore).toBe(30);
      expect(result.canCreateDeal).toBe(true);
      expect(result.transactionLimit).toBe(10000);
    });

    it('should return KYC status for unverified user', async () => {
      const mockUser = {
        id: 1,
        kycStatus: KycStatus.UNVERIFIED,
        riskScore: 0,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getKycStatus(1);

      expect(result.userId).toBe(1);
      expect(result.kycStatus).toBe(KycStatus.UNVERIFIED);
      expect(result.canCreateDeal).toBe(false);
      expect(result.transactionLimit).toBe(500);
    });
  });

  describe('approveKyc', () => {
    const mockUser = {
      id: 1,
      email: 'test@test.com',
      username: 'testuser',
      kycStatus: KycStatus.PENDING,
      riskScore: 30,
    };

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.approveKyc(999, 'approve')).rejects.toThrow(NotFoundException);
    });

    it('should approve user KYC', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        kycStatus: KycStatus.VERIFIED,
      });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.approveKyc(1, 'approve', 'Manual approval', 2);

      expect(result.kycStatus).toBe(KycStatus.VERIFIED);
      expect(result.message).toBe('User approved');
      expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith('kyc.verified', expect.any(Object));
    });

    it('should reject user KYC', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        kycStatus: KycStatus.REJECTED,
      });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.approveKyc(1, 'reject', 'Invalid documents', 2);

      expect(result.kycStatus).toBe(KycStatus.REJECTED);
      expect(result.message).toBe('User rejected');
      expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith('kyc.rejected', expect.any(Object));
    });
  });

  describe('getTransactionLimits', () => {
    it('should return correct limits for UNVERIFIED user', () => {
      const limits = service.getTransactionLimits(KycStatus.UNVERIFIED);
      expect(limits.maxAmount).toBe(500);
      expect(limits.currency).toBe('USD');
    });

    it('should return correct limits for VERIFIED user', () => {
      const limits = service.getTransactionLimits(KycStatus.VERIFIED);
      expect(limits.maxAmount).toBe(10000);
      expect(limits.currency).toBe('USD');
    });

    it('should return zero limits for REJECTED user', () => {
      const limits = service.getTransactionLimits(KycStatus.REJECTED);
      expect(limits.maxAmount).toBe(0);
      expect(limits.currency).toBe('USD');
    });
  });

  describe('canUserCreateDeal', () => {
    it('should allow verified user to create deal within limit', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 1,
        kycStatus: KycStatus.VERIFIED,
      });

      const result = await service.canUserCreateDeal(1, 5000);

      expect(result.allowed).toBe(true);
    });

    it('should reject verified user exceeding limit', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 1,
        kycStatus: KycStatus.VERIFIED,
      });

      const result = await service.canUserCreateDeal(1, 15000);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('exceeds limit');
    });

    it('should reject unverified user exceeding limit', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 1,
        kycStatus: KycStatus.UNVERIFIED,
      });

      const result = await service.canUserCreateDeal(1, 1000);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('exceeds limit');
    });

    it('should reject user with REJECTED status', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 1,
        kycStatus: KycStatus.REJECTED,
      });

      const result = await service.canUserCreateDeal(1, 100);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('KYC verification rejected');
    });
  });
});
