import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { UserGoalService } from './goal.service';

@Controller('me/goals')
@Roles('nguoi_dung')
export class UserGoalController {
  constructor(private readonly goalService: UserGoalService) {}

  @Get()
  getGoals(@Req() request: Request & { user?: { sub?: number } }) {
    return this.goalService.getGoals(request.user?.sub);
  }

  @Get('current')
  getCurrentGoal(@Req() request: Request & { user?: { sub?: number } }) {
    return this.goalService.getCurrentGoal(request.user?.sub);
  }

  @Post()
  createGoal(
    @Req() request: Request & { user?: { sub?: number } },
    @Body() dto: CreateGoalDto,
  ) {
    return this.goalService.createGoal(request.user?.sub, dto);
  }

  @Patch(':id')
  updateGoal(
    @Req() request: Request & { user?: { sub?: number } },
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.goalService.updateGoal(request.user?.sub, Number(id), dto);
  }
}
