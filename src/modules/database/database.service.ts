import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class DatabaseService {
  constructor(private prisma: PrismaService) {}

  async checkDatabaseHealth(): Promise<{ status: string; database: string; timestamp: string }> {
    const isHealthy = await this.prisma.healthCheck();
    
    return {
      status: isHealthy ? 'ok' : 'error',
      database: 'postgresql',
      timestamp: new Date().toISOString(),
    };
  }

  async getDatabaseStats(): Promise<{
    users: number;
    deals: number;
    payments: number;
    auditLogs: number;
  }> {
    const [users, deals, payments, auditLogs] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.deal.count(),
      this.prisma.payment.count(),
      this.prisma.auditLog.count(),
    ]);

    return {
      users,
      deals,
      payments,
      auditLogs,
    };
  }
}
