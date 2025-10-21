import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MockPaymentAdapter } from './adapters/mock.adapter';
import { PAYMENT_ADAPTER } from './adapters/payment-adapter.interface';

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
