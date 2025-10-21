import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class ProcessWebhookDto {
  @IsString()
  @IsNotEmpty()
  provider: string;

  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsString()
  @IsNotEmpty()
  eventType: string;

  @IsObject()
  payload: Record<string, any>;

  @IsString()
  @IsOptional()
  signature?: string;
}
