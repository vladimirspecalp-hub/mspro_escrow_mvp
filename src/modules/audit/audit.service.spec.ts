import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuditService } from './audit.service';
import { AuditRepository } from './audit.repository';

describe('AuditService', () => {
  let service: AuditService;
  let repository: AuditRepository;

  const mockRepository = {
    create: jest.fn(),
    findByUserId: jest.fn(),
    findByAction: jest.fn(),
    cleanOldLogs: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'AUDIT_LOG_TTL_DAYS') return 7;
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: AuditRepository,
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repository = module.get<AuditRepository>(AuditRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logAction', () => {
    it('should log action with userId', async () => {
      await service.logAction(1, 'TEST_ACTION', { test: 'data' });

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 1,
        action: 'TEST_ACTION',
        entity: 'system',
        details: expect.objectContaining({
          test: 'data',
          timestamp: expect.any(String),
        }),
      });
    });

    it('should log action without userId', async () => {
      await service.logAction(null, 'SYSTEM_ACTION');

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: null,
        action: 'SYSTEM_ACTION',
        entity: 'system',
        details: expect.objectContaining({
          timestamp: expect.any(String),
        }),
      });
    });
  });

  describe('logHttpRequest', () => {
    it('should log HTTP request with full context', async () => {
      await service.logHttpRequest({
        userId: 1,
        method: 'POST',
        path: '/api/v1/test',
        statusCode: 200,
        duration: 150,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        query: { page: '1' },
      });

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 1,
        action: 'HTTP_POST',
        entity: 'http_request',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        actionContext: expect.objectContaining({
          method: 'POST',
          path: '/api/v1/test',
          statusCode: 200,
          duration: 150,
          query: { page: '1' },
        }),
        details: {
          statusCode: 200,
          duration: 150,
        },
      });
    });
  });

  describe('logEvent', () => {
    it('should log business event with entity details', async () => {
      await service.logEvent({
        userId: 1,
        action: 'DEAL_CREATED',
        entity: 'deal',
        entityId: 123,
        details: { amount: 1000 },
      });

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 1,
        action: 'DEAL_CREATED',
        entity: 'deal',
        entityId: 123,
        details: { amount: 1000 },
        ipAddress: null,
        userAgent: null,
      });
    });
  });

  describe('getUserLogs', () => {
    it('should retrieve user logs', async () => {
      const mockLogs = [{ id: 1, action: 'TEST' }];
      mockRepository.findByUserId.mockResolvedValue(mockLogs);

      const result = await service.getUserLogs(1, 50);

      expect(result).toEqual(mockLogs);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(1, 50);
    });
  });

  describe('getLogsByAction', () => {
    it('should retrieve logs by action', async () => {
      const mockLogs = [{ id: 1, action: 'DEAL_CREATED' }];
      mockRepository.findByAction.mockResolvedValue(mockLogs);

      const result = await service.getLogsByAction('DEAL_CREATED');

      expect(result).toEqual(mockLogs);
      expect(mockRepository.findByAction).toHaveBeenCalledWith('DEAL_CREATED', 100);
    });
  });

  describe('cleanOldLogs', () => {
    it('should clean old logs based on TTL', async () => {
      mockRepository.cleanOldLogs.mockResolvedValue(42);

      const result = await service.cleanOldLogs();

      expect(result).toBe(42);
      expect(mockRepository.cleanOldLogs).toHaveBeenCalledWith(7);
    });
  });
});
