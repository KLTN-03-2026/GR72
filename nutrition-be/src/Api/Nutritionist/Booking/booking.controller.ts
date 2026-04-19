import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { NutritionistBookingService } from './booking.service';
import {
  BookingQueryDto,
  CompleteBookingDto,
  CancelBookingDto,
} from './dto/booking.dto';

@UseGuards(JwtAuthGuard)
@Roles('chuyen_gia_dinh_duong')
@Controller('nutritionist/bookings')
export class NutritionistBookingController {
  constructor(private readonly bookingService: NutritionistBookingService) {}

  @Get()
  async findAll(@Req() req: any, @Query() query: BookingQueryDto) {
    return this.bookingService.findAll(req.user?.sub, query);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.bookingService.findOne(req.user?.sub, id);
  }

  @Patch(':id/confirm')
  async confirm(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.bookingService.confirm(req.user?.sub, id);
  }

  @Patch(':id/complete')
  async complete(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompleteBookingDto,
  ) {
    return this.bookingService.complete(req.user?.sub, id, dto);
  }

  @Patch(':id/cancel')
  async cancel(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingService.cancel(req.user?.sub, id, dto);
  }

  @Patch(':id/refund-check')
  async checkRefundStatus(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingService.fakeRefundSuccess(req.user?.sub, id);
  }
}
