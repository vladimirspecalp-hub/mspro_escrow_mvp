import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { ResolveDealDto, ResolutionAction } from './dto/resolve-deal.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async getDisputes() {
    const disputes = await this.prisma.deal.findMany({
      where: { status: 'DISPUTED' },
      include: {
        buyer: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
          },
        },
        seller: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            provider: true,
            providerPaymentId: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return disputes;
  }

  async resolveDeal(dealId: number, dto: ResolveDealDto) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      include: { payments: true },
    });

    if (!deal) {
      throw new NotFoundException(`Deal ${dealId} not found`);
    }

    if (deal.status === 'COMPLETED' || deal.status === 'CANCELLED') {
      throw new BadRequestException(`Deal ${dealId} is already in final state: ${deal.status}`);
    }

    const admin = await this.prisma.user.findUnique({
      where: { id: dto.adminId },
    });

    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'MODERATOR')) {
      throw new BadRequestException('Invalid admin user');
    }

    let newStatus: string;
    let paymentAction: string | null = null;

    switch (dto.action) {
      case ResolutionAction.COMPLETE:
        newStatus = 'COMPLETED';
        paymentAction = 'capture';
        break;

      case ResolutionAction.REFUND:
        newStatus = 'CANCELLED';
        paymentAction = 'refund';
        break;

      case ResolutionAction.CANCEL:
        newStatus = 'CANCELLED';
        paymentAction = 'refund';
        break;

      default:
        throw new BadRequestException(`Invalid resolution action: ${dto.action}`);
    }

    if (paymentAction && deal.payments.length > 0) {
      const payment = deal.payments.find((p) => p.status === 'PENDING' || p.status === 'PROCESSING');
      if (payment) {
        if (paymentAction === 'capture') {
          await this.paymentsService.capturePayment(deal.id);
        } else if (paymentAction === 'refund') {
          await this.paymentsService.refundPayment(deal.id);
        }
      }
    }

    const updatedDeal = await this.prisma.deal.update({
      where: { id: dealId },
      data: {
        status: newStatus as any,
        resolvedBy: dto.adminId,
        resolvedAt: new Date(),
      },
      include: {
        buyer: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
          },
        },
        seller: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
          },
        },
        resolver: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
          },
        },
        payments: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: dto.adminId,
        action: 'ADMIN_RESOLVE_DEAL',
        entity: 'deal',
        entityId: dealId,
        details: {
          action: dto.action,
          oldStatus: deal.status,
          newStatus,
          reason: dto.reason,
        },
      },
    });

    this.logger.log(`Admin ${dto.adminId} resolved deal ${dealId}: ${dto.action} (${deal.status} → ${newStatus})`);

    return updatedDeal;
  }

  async getAllDeals(filters?: { status?: string; limit?: number }) {
    const where: any = {};
    if (filters?.status) {
      where.status = filters.status;
    }

    const deals = await this.prisma.deal.findMany({
      where,
      take: filters?.limit || 100,
      include: {
        buyer: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
          },
        },
        seller: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
          },
        },
        resolver: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            provider: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return deals;
  }
}
