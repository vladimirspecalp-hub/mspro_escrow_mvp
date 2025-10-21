import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MockPaymentAdapter } from './adapters/mock.adapter';

export const PAYMENT_ADAPTER = 'PAYMENT_ADAPTER';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: PAYMENT_ADAPTER,
      useClass: MockPaymentAdapter,
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
