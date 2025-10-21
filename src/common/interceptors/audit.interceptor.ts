import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const method = request.method;
    const path = request.path;
    const userId = request.user?.id || null;
    const startTime = Date.now();

    const ipAddress =
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.socket.remoteAddress ||
      null;

    const userAgent = request.headers['user-agent'] || null;

    return next.handle().pipe(
      tap({
        next: async () => {
          if (this.shouldLog(method, path)) {
            const duration = Date.now() - startTime;
            const statusCode = response.statusCode;

            try {
              await this.auditService.logHttpRequest({
                userId,
                method,
                path,
                statusCode,
                duration,
                ipAddress,
                userAgent,
                query: request.query,
              });

              this.logger.log(
                `${method} ${path} ${statusCode} - ${duration}ms | User: ${userId || 'anonymous'}`,
              );
            } catch (error) {
              this.logger.error(`Failed to log audit: ${error.message}`);
            }
          }
        },
        error: async (error) => {
          if (this.shouldLog(method, path)) {
            const duration = Date.now() - startTime;
            const statusCode = error.status || 500;

            try {
              await this.auditService.logHttpRequest({
                userId,
                method,
                path,
                statusCode,
                duration,
                ipAddress,
                userAgent,
                query: request.query,
              });

              this.logger.warn(
                `${method} ${path} ${statusCode} - ${duration}ms | Error: ${error.message}`,
              );
            } catch (logError) {
              this.logger.error(`Failed to log audit: ${logError.message}`);
            }
          }
        },
      }),
    );
  }

  private shouldLog(method: string, path: string): boolean {
    if (path === '/health' || path === '/db/health') {
      return false;
    }

    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return true;
    }

    if (path.startsWith('/api/v1')) {
      return true;
    }

    return false;
  }
}
