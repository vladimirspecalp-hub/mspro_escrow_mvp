import { Injectable, NestMiddleware, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);
  private readonly storage = new Map<string, RateLimitInfo>();
  private readonly windowMs = 60000; // 1 minute
  private cleanupInterval: NodeJS.Timeout;

  constructor(private readonly configService: ConfigService) {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  async use(req: Request, res: Response, next: NextFunction) {
    if (!this.configService.get<boolean>('RATE_LIMIT_ENABLED', true)) {
      return next();
    }

    const user = (req as any).user;

    if (user?.role === 'ADMIN' || user?.role === 'MODERATOR') {
      return next();
    }

    const key = this.getKey(req, user);
    const limit = user
      ? this.configService.get<number>('RATE_LIMIT_USER', 100)
      : this.configService.get<number>('RATE_LIMIT_GUEST', 20);

    const now = Date.now();
    let info = this.storage.get(key);

    if (!info || now > info.resetTime) {
      info = {
        count: 0,
        resetTime: now + this.windowMs,
      };
    }

    const currentCount = info.count + 1;

    if (currentCount > limit) {
      const retryAfter = Math.ceil((info.resetTime - now) / 1000);
      res.setHeader('X-RateLimit-Limit', limit.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', new Date(info.resetTime).toISOString());
      res.setHeader('Retry-After', retryAfter.toString());

      this.logger.warn(
        `Rate limit exceeded for ${user ? `user ${user.id}` : 'guest'} (${key})`,
      );

      return res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many requests, please try again later',
        retryAfter,
      });
    }

    info.count = currentCount;
    this.storage.set(key, info);

    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - info.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(info.resetTime).toISOString());

    next();
  }

  private getKey(req: Request, user: any): string {
    if (user?.id) {
      return `user:${user.id}`;
    }

    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    return `ip:${ip}`;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, info] of this.storage.entries()) {
      if (now > info.resetTime) {
        this.storage.delete(key);
      }
    }
  }
}
