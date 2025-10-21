import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { DatabaseModule } from './modules/database/database.module';
import { DealsModule } from './modules/deals/deals.module';

@Module({
  imports: [HealthModule, DatabaseModule, DealsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
