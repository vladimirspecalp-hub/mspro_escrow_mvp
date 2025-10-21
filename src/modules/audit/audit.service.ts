import { Injectable, Logger } from '@nestjs/common';
import { AuditRepository, AuditLogData } from './audit.repository';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly ttlDays: number;

  constructor(
    private readonly repository: AuditRepository,
    private readonly configService: ConfigService,
  ) {
    this.ttlDays = this.configService.get<number>('AUDIT_LOG_TTL_DAYS', 7);
  }

  /**
   * Log action to audit trail
   */
  async logAction(
    userId: number | null,
    action: string,
    details?: any,
  ): Promise<void> {
    const data: AuditLogData = {
      userId,
      action,
      entity: 'system',
      details: {
        ...details,
        timestamp: new Date().toISOString(),
      },
    };

    await this.repository.create(data);
    this.logger.log(`Audit: ${action} by user ${userId || 'system'}`);
  }

  /**
   * Log HTTP request
   */
  async logHttpRequest(data: {
    userId?: number | null;
    method: string;
    path: string;
    statusCode: number;
    duration: number;
    ipAddress?: string | null;
    userAgent?: string | null;
    query?: any;
  }): Promise<void> {
    const auditData: AuditLogData = {
      userId: data.userId ?? null,
      action: `HTTP_${data.method}`,
      entity: 'http_request',
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      actionContext: {
        method: data.method,
        path: data.path,
        statusCode: data.statusCode,
        duration: data.duration,
        query: data.query || {},
        timestamp: new Date().toISOString(),
      },
      details: {
        statusCode: data.statusCode,
        duration: data.duration,
      },
    };

    await this.repository.create(auditData);
  }

  /**
   * Log business event with full context
   */
  async logEvent(data: {
    userId?: number | null;
    action: string;
    entity: string;
    entityId?: number | null;
    details?: any;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    const auditData: AuditLogData = {
      userId: data.userId ?? null,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId ?? null,
      details: data.details || {},
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
    };

    await this.repository.create(auditData);
  }

  /**
   * Get audit logs for user
   */
  async getUserLogs(userId: number, limit = 100) {
    return this.repository.findByUserId(userId, limit);
  }

  /**
   * Get audit logs by action
   */
  async getLogsByAction(action: string, limit = 100) {
    return this.repository.findByAction(action, limit);
  }

  /**
   * Clean old audit logs based on TTL
   */
  async cleanOldLogs(): Promise<number> {
    const deleted = await this.repository.cleanOldLogs(this.ttlDays);
    this.logger.log(`Cleaned ${deleted} old audit logs (older than ${this.ttlDays} days)`);
    return deleted;
  }
}
