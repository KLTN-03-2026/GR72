import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { AdminArticleService } from './article.service';
import { ArticleQueryDto } from './dto/article-query.dto';

@Roles('quan_tri')
@Controller('admin/articles')
export class AdminArticleController {
  constructor(private readonly service: AdminArticleService) {}

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get('categories')
  getCategories() {
    return this.service.getCategories();
  }

  @Get('authors')
  getAuthors() {
    return this.service.getAuthorList();
  }

  @Get('public/list')
  getPublicList(@Query() query: ArticleQueryDto) {
    return this.service.getPublicList(query);
  }

  @Get('public/slug/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.service.getBySlug(slug);
  }

  @Get()
  findAll(@Query() query: ArticleQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
