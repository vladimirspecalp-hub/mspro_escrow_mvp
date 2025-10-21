import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateDealDto } from './dto';
import { DealStatus } from '@prisma/client';

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}

  private readonly STATE_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
    PENDING: ['FUNDED', 'CANCELLED'],
    FUNDED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'DISPUTED', 'CANCELLED'],
    DISPUTED: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  };

  async createDeal(createDealDto: CreateDealDto) {
    const deal = await this.prisma.deal.create({
      data: {
        ...createDealDto,
        status: 'PENDING',
      },
      include: {
        buyer: true,
        seller: true,
      },
    });

    await this.logAuditEvent(
      createDealDto.buyerId,
      'DEAL_CREATED',
      'deal',
      deal.id,
      { deal },
    );

    return deal;
  }

  async findAll() {
    return this.prisma.deal.findMany({
      include: {
        buyer: true,
        seller: true,
        payments: true,
      },
    });
  }

  async findOne(id: number) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        buyer: true,
        seller: true,
        payments: true,
      },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    return deal;
  }

  async confirmExecution(id: number, userId: number) {
    const deal = await this.findOne(id);

    if (deal.sellerId !== userId) {
      throw new BadRequestException('Only seller can confirm execution');
    }

    return this.transitionState(deal.id, 'IN_PROGRESS', userId, 'DEAL_CONFIRMED');
  }

  async acceptByBuyer(id: number, userId: number) {
    const deal = await this.findOne(id);

    if (deal.buyerId !== userId) {
      throw new BadRequestException('Only buyer can accept the deal');
    }

    return this.transitionState(deal.id, 'COMPLETED', userId, 'DEAL_ACCEPTED');
  }

  async raiseDispute(id: number, userId: number, reason?: string) {
    const deal = await this.findOne(id);

    if (deal.buyerId !== userId && deal.sellerId !== userId) {
      throw new BadRequestException('Only deal participants can raise disputes');
    }

    return this.transitionState(deal.id, 'DISPUTED', userId, 'DISPUTE_RAISED', { reason });
  }

  async fundDeal(id: number, userId: number) {
    const deal = await this.findOne(id);

    if (deal.buyerId !== userId) {
      throw new BadRequestException('Only buyer can fund the deal');
    }

    return this.transitionState(deal.id, 'FUNDED', userId, 'DEAL_FUNDED');
  }

  async cancelDeal(id: number, userId: number, reason?: string) {
    const deal = await this.findOne(id);

    if (deal.buyerId !== userId && deal.sellerId !== userId) {
      throw new BadRequestException('Only deal participants can cancel');
    }

    return this.transitionState(deal.id, 'CANCELLED', userId, 'DEAL_CANCELLED', { reason });
  }

  private async transitionState(
    dealId: number,
    newStatus: DealStatus,
    userId: number,
    action: string,
    details?: any,
  ) {
    const deal = await this.findOne(dealId);
    const currentStatus = deal.status as DealStatus;

    const allowedTransitions = this.STATE_TRANSITIONS[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid state transition from ${currentStatus} to ${newStatus}`,
      );
    }

    const updatedDeal = await this.prisma.deal.update({
      where: { id: dealId },
      data: { status: newStatus },
      include: {
        buyer: true,
        seller: true,
        payments: true,
      },
    });

    await this.logAuditEvent(userId, action, 'deal', dealId, {
      previousStatus: currentStatus,
      newStatus,
      ...details,
    });

    return updatedDeal;
  }

  private async logAuditEvent(
    userId: number,
    action: string,
    entity: string,
    entityId: number,
    details: any,
  ) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details,
      },
    });
  }
}
