import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { MockKycProvider } from './providers/mock.provider';
import { SubmitKycDto, KycStatusResponseDto } from './dto/kyc.dto';
import { KycStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class KycService {
  constructor(
    private prisma: PrismaService,
    private mockKycProvider: MockKycProvider,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Submit KYC verification request
   */
  async submitKyc(userId: number, dto: SubmitKycDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.kycStatus === KycStatus.VERIFIED) {
      throw new BadRequestException('User already verified');
    }

    if (user.kycStatus === KycStatus.PENDING) {
      throw new BadRequestException('KYC verification already in progress');
    }

    // Update status to PENDING
    await this.prisma.user.update({
      where: { id: userId },
      data: { kycStatus: KycStatus.PENDING },
    });

    // Log to audit
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'KYC_SUBMIT',
        entity: 'user',
        entityId: userId,
        details: {
          documentType: dto.documentType,
          fullName: dto.fullName,
        },
      },
    });

    // Process verification (mock)
    const result = await this.mockKycProvider.verifyDocument(
      dto.documentType,
      dto.documentNumber,
      dto.fullName,
    );

    // Update user with verification result
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus:
          result.status === 'verified'
            ? KycStatus.VERIFIED
            : KycStatus.REJECTED,
        riskScore: result.riskScore,
      },
    });

    // Log result
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'KYC_RESULT',
        entity: 'user',
        entityId: userId,
        details: {
          status: result.status,
          riskScore: result.riskScore,
          reason: result.reason,
        },
      },
    });

    // Emit event for notifications
    if (result.status === 'verified') {
      await this.eventEmitter.emitAsync('kyc.verified', {
        userId,
        email: user.email,
        username: user.username,
        riskScore: result.riskScore,
      });
    } else {
      await this.eventEmitter.emitAsync('kyc.rejected', {
        userId,
        email: user.email,
        username: user.username,
        riskScore: result.riskScore,
        reason: result.reason,
      });
    }

    return {
      status: result.status,
      riskScore: result.riskScore,
      kycStatus: updatedUser.kycStatus,
    };
  }

  /**
   * Get KYC status for user
   */
  async getKycStatus(userId: number): Promise<KycStatusResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const limits = this.getTransactionLimits(user.kycStatus);

    return {
      userId: user.id,
      kycStatus: user.kycStatus,
      riskScore: user.riskScore,
      canCreateDeal: user.kycStatus === KycStatus.VERIFIED,
      transactionLimit: limits.maxAmount,
    };
  }

  /**
   * Admin: Approve or reject KYC manually
   */
  async approveKyc(
    userId: number,
    decision: 'approve' | 'reject',
    reason?: string,
    adminId?: number,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newStatus =
      decision === 'approve' ? KycStatus.VERIFIED : KycStatus.REJECTED;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { kycStatus: newStatus },
    });

    // Log admin action
    await this.prisma.auditLog.create({
      data: {
        userId: adminId || null,
        action: 'KYC_ADMIN_DECISION',
        entity: 'user',
        entityId: userId,
        details: {
          decision,
          reason,
          targetUser: userId,
        },
      },
    });

    // Emit notification events
    if (decision === 'approve') {
      await this.eventEmitter.emitAsync('kyc.verified', {
        userId,
        email: user.email,
        username: user.username,
        riskScore: user.riskScore,
      });
    } else {
      await this.eventEmitter.emitAsync('kyc.rejected', {
        userId,
        email: user.email,
        username: user.username,
        riskScore: user.riskScore,
        reason,
      });
    }

    return {
      userId: updatedUser.id,
      kycStatus: updatedUser.kycStatus,
      message: `User ${decision === 'approve' ? 'approved' : 'rejected'}`,
    };
  }

  /**
   * Get transaction limits based on KYC status
   */
  getTransactionLimits(kycStatus: KycStatus): {
    maxAmount: number;
    currency: string;
  } {
    const limits = {
      [KycStatus.UNVERIFIED]: 500,
      [KycStatus.PENDING]: 500,
      [KycStatus.VERIFIED]: 10000,
      [KycStatus.REJECTED]: 0,
    };

    return {
      maxAmount: limits[kycStatus] || 0,
      currency: 'USD',
    };
  }

  /**
   * Check if user can create deal with given amount
   */
  async canUserCreateDeal(
    userId: number,
    amount: number,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { allowed: false, reason: 'User not found' };
    }

    if (user.kycStatus === KycStatus.REJECTED) {
      return { allowed: false, reason: 'KYC verification rejected' };
    }

    const limits = this.getTransactionLimits(user.kycStatus);

    if (amount > limits.maxAmount) {
      return {
        allowed: false,
        reason: `Amount exceeds limit for ${user.kycStatus} status. Max: ${limits.maxAmount} ${limits.currency}`,
      };
    }

    return { allowed: true };
  }
}
