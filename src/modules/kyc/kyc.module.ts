import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { MockKycProvider } from './providers/mock.provider';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [KycController],
  providers: [KycService, MockKycProvider, PrismaService],
  exports: [KycService],
})
export class KycModule {}
