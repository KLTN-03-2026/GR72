import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CongThucEntity,
  ThanhPhanCongThucEntity,
} from './entities/cong-thuc.entity';
import { NutritionistRecipeController } from './recipe.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CongThucEntity, ThanhPhanCongThucEntity]),
  ],
  controllers: [NutritionistRecipeController],
})
export class NutritionistRecipeModule {}
