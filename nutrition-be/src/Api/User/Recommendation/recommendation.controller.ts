import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ApplyRecommendationDto } from './dto/apply-recommendation.dto';
import { UserRecommendationService } from './recommendation.service';

@Controller('me/recommendations')
@Roles('nguoi_dung')
export class UserRecommendationController {
  constructor(
    private readonly recommendationService: UserRecommendationService,
  ) {}

  @Get('nutrition')
  getNutritionRecommendations(
    @Req() request: Request & { user?: { sub?: number } },
  ) {
    return this.recommendationService.getNutritionRecommendations(
      request.user?.sub,
    );
  }

  @Get('meals/next')
  getNextMealRecommendations(
    @Req() request: Request & { user?: { sub?: number } },
  ) {
    return this.recommendationService.getNextMealRecommendations(
      request.user?.sub,
    );
  }

  @Get('meal-plans/daily')
  getDailyMealPlanRecommendations(
    @Req() request: Request & { user?: { sub?: number } },
  ) {
    return this.recommendationService.getDailyMealPlanRecommendations(
      request.user?.sub,
    );
  }

  @Get('health-management')
  getHealthManagementRecommendations(
    @Req() request: Request & { user?: { sub?: number } },
  ) {
    return this.recommendationService.getHealthManagementRecommendations(
      request.user?.sub,
    );
  }

  @Post(':id/apply')
  applyRecommendation(
    @Req() request: Request & { user?: { sub?: number } },
    @Param('id') id: string,
    @Body() dto: ApplyRecommendationDto,
  ) {
    return this.recommendationService.applyRecommendation(
      request.user?.sub,
      Number(id),
      dto,
    );
  }
}
