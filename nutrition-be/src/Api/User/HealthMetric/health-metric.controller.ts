import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CreateHealthMetricDto } from './dto/create-health-metric.dto';
import { HealthMetricsQueryDto } from './dto/health-metrics-query.dto';
import { UpdateHealthMetricDto } from './dto/update-health-metric.dto';
import { UserHealthMetricService } from './health-metric.service';

@Controller('me/health-metrics')
@Roles('nguoi_dung')
export class UserHealthMetricController {
  constructor(private readonly healthMetricService: UserHealthMetricService) {}

  @Get()
  getMetrics(
    @Req() request: Request & { user?: { sub?: number } },
    @Query() query: HealthMetricsQueryDto,
  ) {
    return this.healthMetricService.getMetrics(request.user?.sub, query);
  }

  @Post()
  createMetric(
    @Req() request: Request & { user?: { sub?: number } },
    @Body() dto: CreateHealthMetricDto,
  ) {
    return this.healthMetricService.createMetric(request.user?.sub, dto);
  }

  @Patch(':id')
  updateMetric(
    @Req() request: Request & { user?: { sub?: number } },
    @Param('id') id: string,
    @Body() dto: UpdateHealthMetricDto,
  ) {
    return this.healthMetricService.updateMetric(
      request.user?.sub,
      Number(id),
      dto,
    );
  }
}
