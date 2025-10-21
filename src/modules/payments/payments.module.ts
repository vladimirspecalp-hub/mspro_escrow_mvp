import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../prisma.service';
import { MockPaymentAdapter } from './adapters/mock.adapter';

export const PAYMENT_ADAPTER = 'PAYMENT_ADAPTER';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PrismaService,
    {
      provide: PAYMENT_ADAPTER,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get<string>('FEATURE_PAYMENT_PROVIDER', 'mock');

        if (provider === 'mock') {
          return new MockPaymentAdapter();
        }

        throw new Error(`Unknown payment provider: ${provider}`);
      },
      inject: [ConfigService],
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
