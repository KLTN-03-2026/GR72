import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { BookingService } from './booking.service';

@Roles('quan_tri')
@Controller('admin/bookings')
export class BookingController {
  constructor(private readonly service: BookingService) {}

  @Get('reports')
  getReports(
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Query('nutritionist_id') nutritionist_id?: string,
  ) {
    return this.service.getReports({ start_date, end_date, nutritionist_id });
  }

  @Get('reports/by-nutritionist')
  getReportsByNutritionist(
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
  ) {
    return this.service.getReportsByNutritionist({ start_date, end_date });
  }

  @Get()
  findBookings(
    @Query('trang_thai') trang_thai?: string,
    @Query('nutritionist_id') nutritionist_id?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findBookings({
      trang_thai,
      nutritionist_id,
      start_date,
      end_date,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  getBookingDetail(@Param('id', ParseIntPipe) id: number) {
    return this.service.getBookingDetail(id);
  }
}
