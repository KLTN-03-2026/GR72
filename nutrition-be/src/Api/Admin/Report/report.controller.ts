import { Controller, Get } from '@nestjs/common';
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
}
