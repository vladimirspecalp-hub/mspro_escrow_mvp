import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from '../../modules/notifications/telegram/telegram.service';
import { AuditService } from '../../modules/audit/audit.service';

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly telegramService: TelegramService,
    private readonly auditService: AuditService,
  ) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      message: typeof message === 'string' ? message : (message as any).message || message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logError(exception, status, request);

    await this.logToAudit(request, status);

    if (status >= 500) {
      await this.sendTelegramAlert(exception, request, status);
    }

    response.status(status).json(errorResponse);
  }

  private logError(exception: unknown, status: number, request: Request) {
    const userId = (request as any).user?.id || 'anonymous';
    const errorMessage =
      exception instanceof Error ? exception.message : 'Unknown error';
    const stack = exception instanceof Error ? exception.stack : '';

    const logLevel = this.getLogLevel(status);
    const logMessage = `[${request.method}] ${request.url} - Status: ${status} - User: ${userId} - Error: ${errorMessage}`;

    switch (logLevel) {
      case 'warn':
        this.logger.warn(logMessage);
        break;
      case 'error':
        this.logger.error(logMessage, stack);
        break;
      case 'fatal':
        this.logger.error(`[FATAL] ${logMessage}`, stack);
        break;
      default:
        this.logger.error(logMessage);
    }
  }

  private async logToAudit(request: Request, statusCode: number) {
    try {
      const userId = (request as any).user?.id || null;
      const ipAddress =
        (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        request.socket.remoteAddress ||
        null;
      const userAgent = request.headers['user-agent'] || null;

      await this.auditService.logHttpRequest({
        userId,
        method: request.method,
        path: request.url,
        statusCode,
        duration: 0,
        ipAddress,
        userAgent,
        query: request.query,
      });
    } catch (error) {
      this.logger.error(`Failed to log to audit: ${error.message}`);
    }
  }

  private getLogLevel(status: number): 'warn' | 'error' | 'fatal' {
    if (status >= 500) {
      return 'fatal';
    } else if (status >= 400) {
      return status === 404 ? 'warn' : 'error';
    }
    return 'warn';
  }

  private async sendTelegramAlert(
    exception: unknown,
    request: Request,
    status: number,
  ) {
    const telegramAlertsEnabled = this.configService.get<boolean>(
      'TELEGRAM_ALERTS_ON_ERROR',
      false,
    );

    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    if (!telegramAlertsEnabled || !isProduction) {
      return;
    }

    try {
      const errorMessage =
        exception instanceof Error ? exception.message : 'Unknown error';
      const stack = exception instanceof Error
        ? exception.stack?.split('\n').slice(0, 5).join('\n')
        : '';

      const userId = (request as any).user?.id || 'anonymous';
      const ipAddress = request.headers['x-forwarded-for'] || request.socket.remoteAddress;

      const alertText = `
🚨 <b>CRITICAL ERROR - ${status}</b>

<b>Path:</b> ${request.method} ${request.url}
<b>User ID:</b> ${userId}
<b>IP:</b> ${ipAddress}
<b>Time:</b> ${new Date().toISOString()}

<b>Error:</b> ${errorMessage}

<b>Stack:</b>
<pre>${stack || 'No stack trace'}</pre>
`;

      await this.telegramService.sendMessage(alertText);
    } catch (error) {
      this.logger.error(`Failed to send Telegram alert: ${error.message}`);
    }
  }
}
