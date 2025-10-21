import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { TelegramService } from '../../modules/notifications/telegram/telegram.service';
import { AuditService } from '../../modules/audit/audit.service';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let telegramService: TelegramService;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: any;

  const mockTelegramService = {
    sendMessage: jest.fn().mockResolvedValue({ success: true }),
  };

  const mockAuditService = {
    logHttpRequest: jest.fn().mockResolvedValue(undefined),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        TELEGRAM_ALERTS_ON_ERROR: true,
        NODE_ENV: 'production',
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HttpExceptionFilter,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: TelegramService,
          useValue: mockTelegramService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);
    telegramService = module.get<TelegramService>(TelegramService);

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/api/v1/test',
      method: 'POST',
      headers: {},
      socket: { remoteAddress: '192.168.1.1' },
      user: null,
    };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('HttpException handling', () => {
    it('should format 400 error response', async () => {
      const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);

      await filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        message: 'Bad Request',
        timestamp: expect.any(String),
        path: '/api/v1/test',
      });
    });

    it('should format 404 error response', async () => {
      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

      await filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 404,
        message: 'Not Found',
        timestamp: expect.any(String),
        path: '/api/v1/test',
      });
    });

    it('should handle complex error messages', async () => {
      const exception = new HttpException(
        { message: ['Field is required', 'Invalid format'] },
        HttpStatus.BAD_REQUEST,
      );

      await filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        message: ['Field is required', 'Invalid format'],
        timestamp: expect.any(String),
        path: '/api/v1/test',
      });
    });
  });

  describe('500 errors', () => {
    it('should handle 500 internal server error', async () => {
      const exception = new Error('Database connection failed');

      await filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 500,
        message: 'Internal server error',
        timestamp: expect.any(String),
        path: '/api/v1/test',
      });
    });

    it('should send Telegram alert for 500 errors in production', async () => {
      const exception = new Error('Critical database error');

      await filter.catch(exception, mockHost);

      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('CRITICAL ERROR - 500'),
      );
      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('Critical database error'),
      );
    });

    it('should not send Telegram alert when disabled', async () => {
      mockConfigService.get = jest.fn((key: string, defaultValue?: any) => {
        if (key === 'TELEGRAM_ALERTS_ON_ERROR') return false;
        if (key === 'NODE_ENV') return 'production';
        return defaultValue;
      });

      const exception = new Error('Test error');
      await filter.catch(exception, mockHost);

      expect(mockTelegramService.sendMessage).not.toHaveBeenCalled();
    });

    it('should not send Telegram alert in development', async () => {
      mockConfigService.get = jest.fn((key: string, defaultValue?: any) => {
        if (key === 'TELEGRAM_ALERTS_ON_ERROR') return true;
        if (key === 'NODE_ENV') return 'development';
        return defaultValue;
      });

      const exception = new Error('Test error');
      await filter.catch(exception, mockHost);

      expect(mockTelegramService.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('error logging', () => {
    it('should include user info in logs', async () => {
      mockRequest.user = { id: 123, role: 'USER' };
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

      await filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });
});
