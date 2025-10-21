import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export interface FraudCheckResult {
  riskScore: number;
  isBlocked: boolean;
  reasons: string[];
  checks: {
    emailCheck: boolean;
    amountCheck: boolean;
    velocityCheck: boolean;
  };
}

@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);
  private readonly RISK_THRESHOLD = 0.8;

  constructor(private readonly prisma: PrismaService) {}

  async checkUserSignup(email: string, ipAddress?: string): Promise<FraudCheckResult> {
    this.logger.log(`Running fraud check for user signup: ${email}`);

    const reasons: string[] = [];
    const checks = {
      emailCheck: true,
      amountCheck: true,
      velocityCheck: true,
    };

    let riskScore = 0.0;

    if (email.includes('fraud') || email.includes('scam')) {
      riskScore += 0.5;
      reasons.push('Suspicious email pattern detected');
      checks.emailCheck = false;
    }

    if (email.endsWith('.ru') || email.endsWith('.cn')) {
      riskScore += 0.2;
      reasons.push('High-risk country domain');
    }

    const existingUsers = await this.prisma.user.count({
      where: { email },
    });

    if (existingUsers > 0) {
      riskScore += 0.3;
      reasons.push('Email already registered');
    }

    const isBlocked = riskScore >= this.RISK_THRESHOLD;

    this.logger.log(`Fraud check for ${email}: score=${riskScore}, blocked=${isBlocked}`);

    return {
      riskScore,
      isBlocked,
      reasons,
      checks,
    };
  }

  async checkDealCreation(
    userId: number,
    amount: number,
    currency: string,
  ): Promise<FraudCheckResult> {
    this.logger.log(`Running fraud check for deal creation: user=${userId}, amount=${amount}`);

    const reasons: string[] = [];
    const checks = {
      emailCheck: true,
      amountCheck: true,
      velocityCheck: true,
    };

    let riskScore = 0.0;

    if (amount > 10000) {
      riskScore += 0.4;
      reasons.push('High transaction amount');
      checks.amountCheck = false;
    }

    if (amount > 50000) {
      riskScore += 0.5;
      reasons.push('Very high transaction amount - requires review');
      checks.amountCheck = false;
    }

    const recentDeals = await this.prisma.deal.count({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (recentDeals > 10) {
      riskScore += 0.4;
      reasons.push('Suspicious velocity - too many deals in 24h');
      checks.velocityCheck = false;
    }

    const isBlocked = riskScore >= this.RISK_THRESHOLD;

    this.logger.log(`Fraud check for deal: score=${riskScore}, blocked=${isBlocked}`);

    return {
      riskScore,
      isBlocked,
      reasons,
      checks,
    };
  }

  async checkPaymentHold(
    dealId: number,
    amount: number,
    currency: string,
  ): Promise<FraudCheckResult> {
    this.logger.log(`Running fraud check for payment hold: deal=${dealId}, amount=${amount}`);

    const reasons: string[] = [];
    const checks = {
      emailCheck: true,
      amountCheck: true,
      velocityCheck: true,
    };

    let riskScore = 0.0;

    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        buyer: true,
        seller: true,
      },
    });

    if (!deal) {
      riskScore = 1.0;
      reasons.push('Deal not found');
      return { riskScore, isBlocked: true, reasons, checks };
    }

    if (Number(deal.amount) !== amount) {
      riskScore += 0.6;
      reasons.push('Payment amount mismatch');
      checks.amountCheck = false;
    }

    const buyerCreatedRecently = 
      Date.now() - deal.buyer.createdAt.getTime() < 24 * 60 * 60 * 1000;

    if (buyerCreatedRecently && amount > 1000) {
      riskScore += 0.5;
      reasons.push('New user with high-value transaction');
    }

    const isBlocked = riskScore >= this.RISK_THRESHOLD;

    this.logger.log(`Fraud check for payment: score=${riskScore}, blocked=${isBlocked}`);

    return {
      riskScore,
      isBlocked,
      reasons,
      checks,
    };
  }

  async logFraudCheck(
    checkType: string,
    entityId: number | null,
    result: FraudCheckResult,
    userId?: number,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: userId || null,
        action: `FRAUD_CHECK_${checkType.toUpperCase()}`,
        entity: checkType,
        entityId,
        details: {
          riskScore: result.riskScore,
          isBlocked: result.isBlocked,
          reasons: result.reasons,
          checks: result.checks,
        },
      },
    });
  }
}
