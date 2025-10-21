import { Module } from '@nestjs/common';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';
import { DatabaseModule } from '../database/database.module';
import { PaymentsModule } from '../payments/payments.module';
import { FraudModule } from '../../hooks/kyc_fraud/fraud.module';
import { KycModule } from '../kyc/kyc.module';

@Module({
  imports: [DatabaseModule, PaymentsModule, FraudModule, KycModule],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}
