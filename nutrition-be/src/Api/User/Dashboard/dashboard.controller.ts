import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserDashboardService } from './dashboard.service';

@Controller('me')
@Roles('nguoi_dung')
export class UserDashboardController {
  constructor(private readonly dashboardService: UserDashboardService) {}

  @Get('dashboard')
  getDashboard(@Req() request: Request & { user?: { sub?: number } }) {
    return this.dashboardService.getDashboard(request.user?.sub);
  }

  @Get('health-assessments/latest')
  getLatestAssessment(@Req() request: Request & { user?: { sub?: number } }) {
    return this.dashboardService.getLatestAssessment(request.user?.sub);
  }
}
