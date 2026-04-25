import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ReportService } from './report.service';

@Roles('quan_tri')
@Controller('admin/reports')
export class ReportController {
  constructor(private readonly service: ReportService) {}

  @Get('revenue')
  getRevenue() {
    return this.service.getRevenue();
  }

  @Get('packages')
  getPackageStats() {
    return this.service.getPackageStats();
  }

  @Get('system-revenue')
  getSystemRevenue(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.service.getSystemRevenue({ startDate, endDate });
  }
}
