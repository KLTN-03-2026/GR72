import { Controller, Get, Req } from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { NutritionistDashboardService } from './dashboard.service';

@Roles('chuyen_gia_dinh_duong')
@Controller('nutritionist/dashboard')
export class NutritionistDashboardController {
  constructor(private readonly service: NutritionistDashboardService) {}

  @Get()
  getDashboard(@Req() req: { user?: { sub: number } }) {
    const userId = req.user?.sub;
    if (!userId) {
      return { success: false, message: 'Khong xac dinh duoc nguoi dung' };
    }
    return this.service.getSummary(userId);
  }
}
