import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { DatabaseController } from './database.controller';
import { DatabaseService } from './database.service';

@Module({
  controllers: [DatabaseController],
  providers: [DatabaseService, PrismaService],
  exports: [DatabaseService, PrismaService],
})
export class DatabaseModule {}
