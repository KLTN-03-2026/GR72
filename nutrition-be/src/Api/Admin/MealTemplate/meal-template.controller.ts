import { Controller, Delete, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { AdminMealTemplateService } from './meal-template.service';
import { MealTemplateQueryDto } from './dto/meal-template-query.dto';

@Roles('quan_tri')
@Controller('admin/meal-templates')
export class AdminMealTemplateController {
  constructor(private readonly service: AdminMealTemplateService) {}

  @Get('stats')
  getStats() { return this.service.getStats(); }

  @Get('authors')
  getAuthors() { return this.service.getAuthorList(); }

  @Get('public/list')
  getPublicList(@Query() query: MealTemplateQueryDto) { return this.service.getPublicList(query); }

  @Get(':id/chi-tiet')
  getDetails(@Param('id', ParseIntPipe) id: number) { return this.service.getDetailById(id); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Get()
  findAll(@Query() query: MealTemplateQueryDto) { return this.service.findAll(query); }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
