import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuditMiddleware.name);

  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime;
        const userId = (req as any).user?.id || null;
        
        const ipAddress = 
          (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
          req.socket.remoteAddress ||
          null;

        const userAgent = req.headers['user-agent'] || null;

        const actionContext = {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          query: req.query,
          timestamp: new Date().toISOString(),
        };

        const shouldLog = this.shouldLogRequest(req.method, req.path, res.statusCode);

        if (shouldLog) {
          await this.prisma.auditLog.create({
            data: {
              userId,
              action: `HTTP_${req.method}`,
              entity: 'http_request',
              entityId: null,
              ipAddress,
              userAgent,
              actionContext,
              details: {
                url: req.originalUrl,
                statusCode: res.statusCode,
                duration,
              },
            },
          });

          this.logger.log(
            `${req.method} ${req.path} ${res.statusCode} - ${duration}ms | IP: ${ipAddress?.slice(0, 15)}`,
          );
        }
      } catch (error) {
        this.logger.error(`Failed to log audit: ${error.message}`);
      }
    });

    next();
  }

  private shouldLogRequest(method: string, path: string, statusCode: number): boolean {
    if (path === '/health' || path === '/db/health') {
      return false;
    }

    if (statusCode >= 400) {
      return true;
    }

    if (method !== 'GET') {
      return true;
    }

    if (path.startsWith('/api/v1')) {
      return true;
    }

    return false;
  }
}
