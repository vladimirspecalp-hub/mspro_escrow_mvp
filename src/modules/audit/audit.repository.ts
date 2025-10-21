import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export interface AuditLogData {
  userId?: number | null;
  action: string;
  entity?: string;
  entityId?: number | null;
  details?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  actionContext?: any;
}

@Injectable()
export class AuditRepository {
  private readonly logger = new Logger(AuditRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId ?? null,
          action: data.action,
          entity: data.entity || 'system',
          entityId: data.entityId ?? null,
          details: data.details || {},
          ipAddress: data.ipAddress ?? null,
          userAgent: data.userAgent ?? null,
          actionContext: data.actionContext || {},
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`);
    }
  }

  async findByUserId(userId: number, limit = 100) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findByAction(action: string, limit = 100) {
    return this.prisma.auditLog.findMany({
      where: { action },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async cleanOldLogs(daysToKeep: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}
