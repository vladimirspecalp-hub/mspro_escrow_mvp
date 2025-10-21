import { IsInt, IsPositive, IsString, Length, IsOptional, Matches } from 'class-validator';

export class CreateDealDto {
  @IsInt()
  @IsPositive()
  buyerId: number;

  @IsInt()
  @IsPositive()
  sellerId: number;

  @IsString()
  @Length(3, 200)
  title: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be a 3-letter code (e.g., USD, EUR)' })
  currency?: string;
}
