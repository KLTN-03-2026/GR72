import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../../common/decorators/roles.decorator';
import { FoodReviewQueryDto } from './dto/food-review-query.dto';
import { ApproveReviewDto, RejectReviewDto } from './dto/review-action.dto';
import { FoodReviewService } from './food-review.service';

type RequestUser = {
  id?: number;
  sub?: number;
};

@Roles('quan_tri')
@Controller('admin/food-review-requests')
export class FoodReviewController {
  constructor(private readonly foodReviewService: FoodReviewService) {}

  @Get()
  findAll(@Query() query: FoodReviewQueryDto) {
    return this.foodReviewService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.foodReviewService.findOne(id);
  }

  @Patch(':id/approve')
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ApproveReviewDto,
    @Req() request: Request & { user?: RequestUser },
  ) {
    const actorId = request.user?.id ?? request.user?.sub ?? 0;
    return this.foodReviewService.approve(id, body, actorId);
  }

  @Patch(':id/reject')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: RejectReviewDto,
    @Req() request: Request & { user?: RequestUser },
  ) {
    const actorId = request.user?.id ?? request.user?.sub ?? 0;
    return this.foodReviewService.reject(id, body, actorId);
  }
}
