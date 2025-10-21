import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { FraudService } from '../../hooks/kyc_fraud/fraud.service';
import { CreateDealDto } from './dto';
import { DealStatus } from '@prisma/client';

@Injectable()
export class DealsService {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
    private fraudService: FraudService,
    private eventEmitter: EventEmitter2,
  ) {}

  private readonly STATE_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
    PENDING: ['FUNDED', 'CANCELLED', 'PENDING_REVIEW'],
    PENDING_REVIEW: ['PENDING', 'CANCELLED'],
    FUNDED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'DISPUTED', 'CANCELLED'],
    DISPUTED: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  };

  private readonly USER_SELECT = {
    id: true,
    email: true,
    username: true,
    role: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  };

  async createDeal(createDealDto: CreateDealDto) {
    const fraudCheck = await this.fraudService.checkDealCreation(
      createDealDto.buyerId,
      Number(createDealDto.amount),
      createDealDto.currency || 'USD',
    );

    await this.fraudService.logFraudCheck(
      'deal_creation',
      null,
      fraudCheck,
      createDealDto.buyerId,
    );

    const initialStatus = fraudCheck.isBlocked ? 'PENDING_REVIEW' : 'PENDING';

    const deal = await this.prisma.deal.create({
      data: {
        ...createDealDto,
        status: initialStatus,
      },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        title: true,
        description: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        buyer: { select: this.USER_SELECT },
        seller: { select: this.USER_SELECT },
      },
    });

    await this.logAuditEvent(
      createDealDto.buyerId,
      'DEAL_CREATED',
      'deal',
      deal.id,
      { 
        dealId: deal.id,
        title: deal.title,
        amount: deal.amount,
        status: deal.status,
        fraudCheck: {
          riskScore: fraudCheck.riskScore,
          isBlocked: fraudCheck.isBlocked,
          reasons: fraudCheck.reasons,
        },
      },
    );

    this.eventEmitter.emit('deal.created', {
      dealId: deal.id,
      buyerEmail: deal.buyer.email,
      sellerEmail: deal.seller.email,
      title: deal.title,
      amount: Number(deal.amount),
      currency: deal.currency,
    });

    return deal;
  }

  async findAll() {
    return this.prisma.deal.findMany({
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        title: true,
        description: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        buyer: { select: this.USER_SELECT },
        seller: { select: this.USER_SELECT },
        payments: true,
      },
    });
  }

  async findOne(id: number) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        title: true,
        description: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        buyer: { select: this.USER_SELECT },
        seller: { select: this.USER_SELECT },
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

    await this.paymentsService.capturePayment(deal.id);

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

    await this.paymentsService.holdPayment(
      deal.id,
      Number(deal.amount),
      deal.currency,
    );

    return this.transitionState(deal.id, 'FUNDED', userId, 'DEAL_FUNDED');
  }

  async cancelDeal(id: number, userId: number, reason?: string) {
    const deal = await this.findOne(id);

    if (deal.buyerId !== userId && deal.sellerId !== userId) {
      throw new BadRequestException('Only deal participants can cancel');
    }

    const payments = await this.prisma.payment.findMany({
      where: { dealId: deal.id },
    });

    if (payments.length > 0) {
      await this.paymentsService.refundPayment(deal.id);
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
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        title: true,
        description: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        buyer: { select: this.USER_SELECT },
        seller: { select: this.USER_SELECT },
        payments: true,
      },
    });

    await this.logAuditEvent(userId, action, 'deal', dealId, {
      dealId,
      title: deal.title,
      previousStatus: currentStatus,
      newStatus,
      ...details,
    });

    if (newStatus === 'COMPLETED') {
      this.eventEmitter.emit('deal.released', {
        dealId: updatedDeal.id,
        buyerEmail: updatedDeal.buyer.email,
        sellerEmail: updatedDeal.seller.email,
        title: updatedDeal.title,
        amount: Number(updatedDeal.amount),
        currency: updatedDeal.currency,
      });
    }

    if (newStatus === 'DISPUTED') {
      const openedBy = userId === deal.buyerId ? 'buyer' : 'seller';
      this.eventEmitter.emit('dispute.opened', {
        dealId: updatedDeal.id,
        buyerEmail: updatedDeal.buyer.email,
        sellerEmail: updatedDeal.seller.email,
        title: updatedDeal.title,
        openedBy,
        reason: details?.reason,
      });
    }

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
