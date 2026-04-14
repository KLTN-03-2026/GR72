import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaiVietEntity } from '../../Nutritionist/Article/entities/bai-viet.entity';
import { AdminArticleController } from './article.controller';
import { AdminArticleService } from './article.service';

@Module({
  imports: [TypeOrmModule.forFeature([BaiVietEntity])],
  controllers: [AdminArticleController],
  providers: [AdminArticleService],
})
export class AdminArticleModule {}
