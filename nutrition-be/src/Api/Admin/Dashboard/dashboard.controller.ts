import { Controller, Get } from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';

@Roles('quan_tri')
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  getDashboard() {
    return this.service.getDashboard();
  }
}
