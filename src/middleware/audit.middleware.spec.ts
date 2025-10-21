import { Test, TestingModule } from '@nestjs/testing';
import { AuditMiddleware } from './audit.middleware';
import { PrismaService } from '../prisma.service';
import { Request, Response } from 'express';

describe('AuditMiddleware', () => {
  let middleware: AuditMiddleware;
  let prismaService: PrismaService;

  const mockPrismaService = {
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditMiddleware,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    middleware = module.get<AuditMiddleware>(AuditMiddleware);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should log POST requests to API', async () => {
    const mockReq = {
      method: 'POST',
      path: '/api/v1/deals',
      originalUrl: '/api/v1/deals',
      headers: {
        'user-agent': 'test-agent',
        'x-forwarded-for': '127.0.0.1',
      },
      query: {},
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as Request;

    const mockRes = {
      statusCode: 201,
      on: jest.fn((event, callback) => {
        if (event === 'finish') {
          setTimeout(callback, 0);
        }
      }),
    } as unknown as Response;

    const mockNext = jest.fn();

    await middleware.use(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'HTTP_POST',
          entity: 'http_request',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        }),
      }),
    );
  });

  it('should not log health check requests', async () => {
    const mockReq = {
      method: 'GET',
      path: '/health',
      originalUrl: '/health',
      headers: {},
      query: {},
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as Request;

    const mockRes = {
      statusCode: 200,
      on: jest.fn((event, callback) => {
        if (event === 'finish') {
          setTimeout(callback, 0);
        }
      }),
    } as unknown as Response;

    const mockNext = jest.fn();

    await middleware.use(mockReq, mockRes, mockNext);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockPrismaService.auditLog.create).not.toHaveBeenCalled();
  });

  it('should log requests with error status codes', async () => {
    const mockReq = {
      method: 'GET',
      path: '/api/v1/deals/999',
      originalUrl: '/api/v1/deals/999',
      headers: {},
      query: {},
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as Request;

    const mockRes = {
      statusCode: 404,
      on: jest.fn((event, callback) => {
        if (event === 'finish') {
          setTimeout(callback, 0);
        }
      }),
    } as unknown as Response;

    const mockNext = jest.fn();

    await middleware.use(mockReq, mockRes, mockNext);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
  });
});
