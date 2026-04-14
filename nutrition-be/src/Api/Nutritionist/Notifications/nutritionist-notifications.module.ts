import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThongBaoEntity } from '../../Admin/FoodReview/entities/thong-bao.entity';
import { NutritionistNotificationsController } from './nutritionist-notifications.controller';
import { NutritionistNotificationsService } from './nutritionist-notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([ThongBaoEntity])],
  controllers: [NutritionistNotificationsController],
  providers: [NutritionistNotificationsService],
})
export class NutritionistNotificationsModule {}
