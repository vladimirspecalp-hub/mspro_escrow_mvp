import { Controller, Get, Post, Param, ParseIntPipe } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async getAllPayments() {
    return this.paymentsService.getAllPayments();
  }

  @Get('deal/:dealId')
  async getPaymentsByDeal(@Param('dealId', ParseIntPipe) dealId: number) {
    return this.paymentsService.getPaymentsByDeal(dealId);
  }

  @Get('deal/:dealId/status')
  async getPaymentStatus(@Param('dealId', ParseIntPipe) dealId: number) {
    return this.paymentsService.getPaymentStatus(dealId);
  }
}
