import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CreateFoodDto } from './dto/create-food.dto';
import { FoodsQueryDto } from './dto/foods-query.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { FoodService } from './food.service';

type RequestUser = {
  id?: number;
  sub?: number;
};

@Roles('quan_tri')
@Controller('admin/foods')
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @Get('meta')
  getMeta() {
    return this.foodService.getMeta();
  }

  @Post()
  create(
    @Body() body: CreateFoodDto,
    @Req() request: Request & { user?: RequestUser },
  ) {
    return this.foodService.create(
      body,
      request.user?.id ?? request.user?.sub ?? null,
    );
  }

  @Get()
  findAll(@Query() query: FoodsQueryDto) {
    return this.foodService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.foodService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateFoodDto,
    @Req() request: Request & { user?: RequestUser },
  ) {
    return this.foodService.update(
      id,
      body,
      request.user?.id ?? request.user?.sub ?? null,
    );
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user?: RequestUser },
  ) {
    return this.foodService.remove(
      id,
      request.user?.id ?? request.user?.sub ?? null,
    );
  }
}
