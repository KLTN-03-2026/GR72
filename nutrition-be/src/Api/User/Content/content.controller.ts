import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  CopyMealPlanFromTemplateDto,
  UserArticleQueryDto,
  UserMealPlanQueryDto,
  UserMealTemplateQueryDto,
} from './dto/content-query.dto';
import { UserContentService } from './content.service';

@Controller()
@Roles('nguoi_dung')
export class UserContentController {
  constructor(private readonly contentService: UserContentService) {}

  @Get('articles')
  getPublishedArticles(
    @Req() request: Request & { user?: { sub?: number } },
    @Query() query: UserArticleQueryDto,
  ) {
    return this.contentService.getPublishedArticles(request.user?.sub, query);
  }

  @Get('articles/:slug')
  getPublishedArticleDetail(
    @Req() request: Request & { user?: { sub?: number } },
    @Param('slug') slug: string,
  ) {
    return this.contentService.getPublishedArticleDetail(
      request.user?.sub,
      slug,
    );
  }

  @Get('meal-templates')
  getPublishedMealTemplates(
    @Req() request: Request & { user?: { sub?: number } },
    @Query() query: UserMealTemplateQueryDto,
  ) {
    return this.contentService.getPublishedMealTemplates(
      request.user?.sub,
      query,
    );
  }

  @Get('meal-templates/:id')
  getPublishedMealTemplateDetail(
    @Req() request: Request & { user?: { sub?: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.contentService.getPublishedMealTemplateDetail(
      request.user?.sub,
      id,
    );
  }

  @Post('me/meal-plans/from-template/:templateId')
  copyMealPlanFromTemplate(
    @Req() request: Request & { user?: { sub?: number } },
    @Param('templateId', ParseIntPipe) templateId: number,
    @Body() dto: CopyMealPlanFromTemplateDto,
  ) {
    return this.contentService.copyMealPlanFromTemplate(
      request.user?.sub,
      templateId,
      dto,
    );
  }

  @Get('me/meal-plans')
  getUserMealPlans(
    @Req() request: Request & { user?: { sub?: number } },
    @Query() query: UserMealPlanQueryDto,
  ) {
    return this.contentService.getUserMealPlans(request.user?.sub, query);
  }

  @Get('me/meal-plans/:id')
  getUserMealPlanDetail(
    @Req() request: Request & { user?: { sub?: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.contentService.getUserMealPlanDetail(request.user?.sub, id);
  }
}
