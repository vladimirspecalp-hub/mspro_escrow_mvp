import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class SubmitKycDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  documentType: string;

  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  dateOfBirth?: string;
}

export class ApproveKycDto {
  @IsString()
  @IsNotEmpty()
  decision: 'approve' | 'reject';

  @IsString()
  @IsOptional()
  reason?: string;
}

export class KycStatusResponseDto {
  userId: number;
  kycStatus: string;
  riskScore: number;
  canCreateDeal: boolean;
  transactionLimit: number;
}
