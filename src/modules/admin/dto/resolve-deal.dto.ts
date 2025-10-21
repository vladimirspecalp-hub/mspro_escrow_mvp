import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber } from 'class-validator';

export enum ResolutionAction {
  COMPLETE = 'COMPLETE',
  REFUND = 'REFUND',
  CANCEL = 'CANCEL',
}

export class ResolveDealDto {
  @IsNumber()
  @IsNotEmpty()
  adminId: number;

  @IsEnum(ResolutionAction)
  @IsNotEmpty()
  action: ResolutionAction;

  @IsString()
  @IsOptional()
  reason?: string;
}
