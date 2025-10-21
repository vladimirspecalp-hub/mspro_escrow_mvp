import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../../prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ResolutionAction } from './dto/resolve-deal.dto';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: PrismaService;
  let paymentsService: PaymentsService;

  const mockPrismaService = {
    deal: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const mockPaymentsService = {
    capturePayment: jest.fn(),
    refundPayment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);
    paymentsService = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDisputes', () => {
    it('should return all disputed deals', async () => {
      const mockDisputes = [
        {
          id: 1,
          status: 'DISPUTED',
          buyer: { id: 1, email: 'buyer@test.com', username: 'buyer', role: 'USER' },
          seller: { id: 2, email: 'seller@test.com', username: 'seller', role: 'USER' },
          payments: [],
        },
      ];

      mockPrismaService.deal.findMany.mockResolvedValue(mockDisputes);

      const result = await service.getDisputes();

      expect(result).toEqual(mockDisputes);
      expect(mockPrismaService.deal.findMany).toHaveBeenCalledWith({
        where: { status: 'DISPUTED' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('resolveDeal', () => {
    it('should throw NotFoundException if deal not found', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue(null);

      await expect(
        service.resolveDeal(999, {
          adminId: 1,
          action: ResolutionAction.COMPLETE,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if deal already in final state', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: 1,
        status: 'COMPLETED',
        payments: [],
      });

      await expect(
        service.resolveDeal(1, {
          adminId: 1,
          action: ResolutionAction.COMPLETE,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if admin user is invalid', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: 1,
        status: 'DISPUTED',
        payments: [],
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 1,
        role: 'USER',
      });

      await expect(
        service.resolveDeal(1, {
          adminId: 1,
          action: ResolutionAction.COMPLETE,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should resolve deal to COMPLETED and capture payment', async () => {
      const mockDeal = {
        id: 1,
        status: 'DISPUTED',
        payments: [{ id: 1, status: 'PENDING' }],
      };

      const mockAdmin = {
        id: 1,
        role: 'ADMIN',
      };

      mockPrismaService.deal.findUnique.mockResolvedValue(mockDeal);
      mockPrismaService.user.findUnique.mockResolvedValue(mockAdmin);
      mockPaymentsService.capturePayment.mockResolvedValue({});
      mockPrismaService.deal.update.mockResolvedValue({
        ...mockDeal,
        status: 'COMPLETED',
        resolvedBy: 1,
      });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.resolveDeal(1, {
        adminId: 1,
        action: ResolutionAction.COMPLETE,
        reason: 'Buyer confirmed delivery',
      });

      expect(mockPaymentsService.capturePayment).toHaveBeenCalledWith(1);
      expect(mockPrismaService.deal.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: 'COMPLETED',
          resolvedBy: 1,
          resolvedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
    });

    it('should resolve deal to CANCELLED and refund payment', async () => {
      const mockDeal = {
        id: 2,
        status: 'DISPUTED',
        payments: [{ id: 2, status: 'PENDING' }],
      };

      const mockAdmin = {
        id: 1,
        role: 'MODERATOR',
      };

      mockPrismaService.deal.findUnique.mockResolvedValue(mockDeal);
      mockPrismaService.user.findUnique.mockResolvedValue(mockAdmin);
      mockPaymentsService.refundPayment.mockResolvedValue({});
      mockPrismaService.deal.update.mockResolvedValue({
        ...mockDeal,
        status: 'CANCELLED',
        resolvedBy: 1,
      });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      await service.resolveDeal(2, {
        adminId: 1,
        action: ResolutionAction.REFUND,
        reason: 'Seller failed to deliver',
      });

      expect(mockPaymentsService.refundPayment).toHaveBeenCalledWith(2);
      expect(mockPrismaService.deal.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: {
          status: 'CANCELLED',
          resolvedBy: 1,
          resolvedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });
  });

  describe('getAllDeals', () => {
    it('should return all deals with optional filters', async () => {
      const mockDeals = [
        { id: 1, status: 'PENDING' },
        { id: 2, status: 'FUNDED' },
      ];

      mockPrismaService.deal.findMany.mockResolvedValue(mockDeals);

      const result = await service.getAllDeals({ status: 'PENDING', limit: 50 });

      expect(result).toEqual(mockDeals);
      expect(mockPrismaService.deal.findMany).toHaveBeenCalledWith({
        where: { status: 'PENDING' },
        take: 50,
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
