import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { NutritionistEarningsService } from './earnings.service';

@UseGuards(JwtAuthGuard)
@Roles('chuyen_gia_dinh_duong')
@Controller('nutritionist/earnings')
export class NutritionistEarningsController {
  constructor(private readonly earningsService: NutritionistEarningsService) {}

  @Get()
  async getEarnings(
    @Req() req: any,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const userId = req.user?.sub;
    return this.earningsService.getEarnings(userId, { startDate, endDate });
  }
}
