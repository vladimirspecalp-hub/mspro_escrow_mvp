import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto';

@Controller('api/v1/deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  create(@Body() createDealDto: CreateDealDto) {
    return this.dealsService.createDeal(createDealDto);
  }

  @Get()
  findAll() {
    return this.dealsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.dealsService.findOne(id);
  }

  @Post(':id/confirm')
  confirm(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    return this.dealsService.confirmExecution(id, userId);
  }

  @Post(':id/accept')
  accept(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    return this.dealsService.acceptByBuyer(id, userId);
  }

  @Post(':id/dispute')
  dispute(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId', ParseIntPipe) userId: number,
    @Body('reason') reason?: string,
  ) {
    return this.dealsService.raiseDispute(id, userId, reason);
  }

  @Post(':id/fund')
  fund(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    return this.dealsService.fundDeal(id, userId);
  }

  @Post(':id/cancel')
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId', ParseIntPipe) userId: number,
    @Body('reason') reason?: string,
  ) {
    return this.dealsService.cancelDeal(id, userId, reason);
  }
}
