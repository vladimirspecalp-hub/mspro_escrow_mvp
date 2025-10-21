import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller('db')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get('health')
  async checkHealth() {
    return this.databaseService.checkDatabaseHealth();
  }

  @Get('stats')
  async getStats() {
    return this.databaseService.getDatabaseStats();
  }
}
