import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { ProcessWebhookDto } from './dto/webhook.dto';

@Controller('api/v1/payments/webhook')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async processWebhook(@Body() dto: ProcessWebhookDto) {
    return this.webhooksService.processWebhook(dto);
  }
}
