import { IsInt, IsPositive, IsString, IsOptional, IsObject } from 'class-validator';

export class CreatePaymentDto {
  @IsInt()
  @IsPositive()
  dealId: number;

  @IsPositive()
  amount: number;

  @IsString()
  currency: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
