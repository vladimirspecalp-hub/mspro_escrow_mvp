import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditService } from './audit.service';
import { AuditRepository } from './audit.repository';
import { PrismaService } from '../../prisma.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AuditService, AuditRepository, PrismaService],
  exports: [AuditService, AuditRepository],
})
export class AuditModule {}
