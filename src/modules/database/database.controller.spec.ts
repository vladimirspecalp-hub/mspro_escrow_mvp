import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseController } from './database.controller';
import { DatabaseService } from './database.service';

describe('DatabaseController', () => {
  let controller: DatabaseController;
  let service: DatabaseService;

  const mockDatabaseService = {
    checkDatabaseHealth: jest.fn().mockResolvedValue({
      status: 'ok',
      database: 'postgresql',
      timestamp: new Date().toISOString(),
    }),
    getDatabaseStats: jest.fn().mockResolvedValue({
      users: 0,
      deals: 0,
      payments: 0,
      auditLogs: 0,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DatabaseController],
      providers: [
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    controller = module.get<DatabaseController>(DatabaseController);
    service = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('/db/health', () => {
    it('should return database health status', async () => {
      const result = await controller.checkHealth();
      
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('database', 'postgresql');
      expect(result).toHaveProperty('timestamp');
      expect(service.checkDatabaseHealth).toHaveBeenCalled();
    });
  });

  describe('/db/stats', () => {
    it('should return database statistics', async () => {
      const result = await controller.getStats();
      
      expect(result).toEqual({
        users: 0,
        deals: 0,
        payments: 0,
        auditLogs: 0,
      });
      expect(service.getDatabaseStats).toHaveBeenCalled();
    });
  });
});
