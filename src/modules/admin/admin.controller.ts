import { Controller, Get, Post, Param, Body, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import { ResolveDealDto } from './dto/resolve-deal.dto';

@Controller('api/v1/admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('disputes')
  async getDisputes() {
    return this.adminService.getDisputes();
  }

  @Post('deals/:id/resolve')
  async resolveDeal(
    @Param('id', ParseIntPipe) dealId: number,
    @Body() dto: ResolveDealDto,
  ) {
    return this.adminService.resolveDeal(dealId, dto);
  }

  @Get('deals')
  async getAllDeals(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAllDeals({
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
