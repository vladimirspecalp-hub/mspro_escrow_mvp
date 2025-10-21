import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { DealsModule } from '../deals/deals.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [DealsModule, PaymentsModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
