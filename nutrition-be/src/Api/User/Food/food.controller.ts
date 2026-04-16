import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserFoodsQueryDto } from './dto/user-foods-query.dto';
import { UserFoodService } from './food.service';

@Controller('foods')
@Roles('nguoi_dung')
export class UserFoodController {
  constructor(private readonly foodService: UserFoodService) {}

  @Get()
  findAll(
    @Req() request: Request & { user?: { sub?: number } },
    @Query() query: UserFoodsQueryDto,
  ) {
    return this.foodService.findAll(request.user?.sub, query);
  }

  @Get(':id')
  findOne(
    @Req() request: Request & { user?: { sub?: number } },
    @Param('id') id: string,
  ) {
    return this.foodService.findOne(request.user?.sub, Number(id));
  }
}
