import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaiVietEntity } from './entities/bai-viet.entity';
import { NutritionistArticleController } from './article.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BaiVietEntity])],
  controllers: [NutritionistArticleController],
})
export class NutritionistArticleModule {}
