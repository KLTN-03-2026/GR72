import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThucPhamEntity } from '../../Admin/Food/entities/thuc-pham.entity';
import { NutritionistFoodController } from './food.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ThucPhamEntity])],
  controllers: [NutritionistFoodController],
})
export class NutritionistFoodModule {}
