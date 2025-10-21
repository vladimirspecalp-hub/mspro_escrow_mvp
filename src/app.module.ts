import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { HealthModule } from './modules/health/health.module';
import { DatabaseModule } from './modules/database/database.module';
import { DealsModule } from './modules/deals/deals.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AdminModule } from './modules/admin/admin.module';
import { FraudModule } from './hooks/kyc_fraud/fraud.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { KycModule } from './modules/kyc/kyc.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: 60000,
          limit: config.get('RATE_LIMIT_GUEST', 20),
        },
      ],
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    HealthModule,
    DatabaseModule,
    DealsModule,
    PaymentsModule,
    WebhooksModule,
    AdminModule,
    FraudModule,
    NotificationsModule,
    KycModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes('*');
  }
}
