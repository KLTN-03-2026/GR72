import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ChiTietThucDonMauEntity,
  ThucDonMauEntity,
} from './entities/thuc-don-mau.entity';
import { NutritionistMealTemplateController } from './meal-template.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ThucDonMauEntity, ChiTietThucDonMauEntity]),
  ],
  controllers: [NutritionistMealTemplateController],
})
export class NutritionistMealTemplateModule {}
