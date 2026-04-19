import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CreateMealLogDto } from './dto/create-meal-log.dto';
import { LogMealPlanDto } from './dto/log-meal-plan.dto';
import { MealLogQueryDto } from './dto/meal-log-query.dto';
import { NutritionSummaryQueryDto } from './dto/nutrition-summary-query.dto';
import { UpdateMealLogDto } from './dto/update-meal-log.dto';
import { UserMealLogService } from './meal-log.service';

@Controller('me')
@Roles('nguoi_dung')
export class UserMealLogController {
  constructor(private readonly mealLogService: UserMealLogService) {}

  @Get('meal-logs')
  getMealLogs(
    @Req() request: Request & { user?: { sub?: number } },
    @Query() query: MealLogQueryDto,
  ) {
    return this.mealLogService.getMealLogs(request.user?.sub, query);
  }

  @Post('meal-logs')
  createMealLog(
    @Req() request: Request & { user?: { sub?: number } },
    @Body() dto: CreateMealLogDto,
  ) {
    return this.mealLogService.createMealLog(request.user?.sub, dto);
  }

  @Get('meal-logs/:id')
  getMealLog(
    @Req() request: Request & { user?: { sub?: number } },
    @Param('id') id: string,
  ) {
    return this.mealLogService.getMealLog(request.user?.sub, Number(id));
  }

  @Patch('meal-logs/:id')
  updateMealLog(
    @Req() request: Request & { user?: { sub?: number } },
    @Param('id') id: string,
    @Body() dto: UpdateMealLogDto,
  ) {
    return this.mealLogService.updateMealLog(
      request.user?.sub,
      Number(id),
      dto,
    );
  }

  @Delete('meal-logs/:id')
  deleteMealLog(
    @Req() request: Request & { user?: { sub?: number } },
    @Param('id') id: string,
  ) {
    return this.mealLogService.deleteMealLog(request.user?.sub, Number(id));
  }

  @Post('meal-plans/:planId/log-meal')
  logMealFromPlan(
    @Req() request: Request & { user?: { sub?: number } },
    @Param('planId') planId: string,
    @Body() dto: LogMealPlanDto,
  ) {
    return this.mealLogService.logMealFromPlan(
      request.user?.sub,
      Number(planId),
      dto,
    );
  }

  @Get('nutrition-summary')
  getNutritionSummary(
    @Req() request: Request & { user?: { sub?: number } },
    @Query() query: NutritionSummaryQueryDto,
  ) {
    return this.mealLogService.getNutritionSummary(request.user?.sub, query);
  }
}
