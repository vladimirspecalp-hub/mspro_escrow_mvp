import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { KycService } from './kyc.service';
import { SubmitKycDto, ApproveKycDto } from './dto/kyc.dto';
import { AdminGuard } from '../admin/guards/admin.guard';

@Controller('api/v1/kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  /**
   * POST /api/v1/kyc/submit
   * Submit KYC verification request
   */
  @Post('submit')
  @HttpCode(HttpStatus.OK)
  async submitKyc(@Body() dto: SubmitKycDto, @Request() req: any) {
    const userId = req.user?.userId || 1; // Mock user ID for testing
    return this.kycService.submitKyc(userId, dto);
  }

  /**
   * GET /api/v1/kyc/status/:userId
   * Get KYC status for user
   */
  @Get('status/:userId')
  async getStatus(@Param('userId', ParseIntPipe) userId: number) {
    return this.kycService.getKycStatus(userId);
  }

  /**
   * PATCH /api/v1/kyc/approve/:userId
   * Admin: Approve or reject KYC
   */
  @Patch('approve/:userId')
  @UseGuards(AdminGuard)
  async approveKyc(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: ApproveKycDto,
    @Request() req: any,
  ) {
    const adminId = req.admin?.id;
    return this.kycService.approveKyc(userId, dto.decision, dto.reason, adminId);
  }
}
