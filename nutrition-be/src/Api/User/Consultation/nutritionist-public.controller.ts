import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../../common/decorators/roles.decorator';
import { NutritionistQueryDto } from './dto/nutritionist-query.dto';
import { UserConsultationService } from './user-consultation.service';

@Controller('nutritionists')
@Roles('nguoi_dung')
export class NutritionistPublicController {
  constructor(private readonly consultationService: UserConsultationService) {}

  @Get()
  findAll(
    @Req() request: Request & { user?: { sub?: number } },
    @Query() query: NutritionistQueryDto,
  ) {
    return this.consultationService.getPublicNutritionists(
      request.user?.sub,
      query,
    );
  }

  @Get(':id')
  findOne(
    @Req() request: Request & { user?: { sub?: number } },
    @Param('id') id: string,
  ) {
    return this.consultationService.getPublicNutritionistDetail(
      request.user?.sub,
      Number(id),
    );
  }
}
