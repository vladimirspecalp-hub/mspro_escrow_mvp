import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import { RateLimitMiddleware } from './rate-limit.middleware';

describe('RateLimitMiddleware', () => {
  let middleware: RateLimitMiddleware;
  let req: any;
  let res: any;
  let next: jest.Mock;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        RATE_LIMIT_ENABLED: true,
        RATE_LIMIT_USER: 100,
        RATE_LIMIT_GUEST: 20,
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitMiddleware,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    middleware = module.get<RateLimitMiddleware>(RateLimitMiddleware);
    next = jest.fn();
    res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('guest users', () => {
    beforeEach(() => {
      req = {
        socket: { remoteAddress: '192.168.1.1' },
        headers: {},
        user: null,
      };
    });

    it('should allow requests within limit', async () => {
      await middleware.use(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '20');
    });

    it('should block requests exceeding guest limit', async () => {
      for (let i = 0; i < 20; i++) {
        await middleware.use(req, res, next);
      }

      await middleware.use(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: expect.any(String),
        }),
      );
    });
  });

  describe('authenticated users', () => {
    beforeEach(() => {
      req = {
        socket: { remoteAddress: '192.168.1.2' },
        headers: {},
        user: { id: 1, role: 'USER' },
      };
    });

    it('should allow requests within user limit', async () => {
      await middleware.use(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '100');
    });
  });

  describe('admin users', () => {
    beforeEach(() => {
      req = {
        socket: { remoteAddress: '192.168.1.3' },
        headers: {},
        user: { id: 2, role: 'ADMIN' },
      };
    });

    it('should allow unlimited requests for admins', async () => {
      for (let i = 0; i < 200; i++) {
        await middleware.use(req, res, next);
      }
      expect(next).toHaveBeenCalledTimes(200);
    });
  });

  describe('rate limiting disabled', () => {
    beforeEach(() => {
      mockConfigService.get = jest.fn((key: string, defaultValue?: any) => {
        if (key === 'RATE_LIMIT_ENABLED') return false;
        return defaultValue;
      });

      req = {
        socket: { remoteAddress: '192.168.1.4' },
        headers: {},
        user: null,
      };
    });

    it('should allow all requests when disabled', async () => {
      for (let i = 0; i < 100; i++) {
        await middleware.use(req, res, next);
      }
      expect(next).toHaveBeenCalledTimes(100);
    });
  });
});
