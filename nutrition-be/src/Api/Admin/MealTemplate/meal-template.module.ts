import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ThucDonMauEntity,
  ChiTietThucDonMauEntity,
} from '../../Nutritionist/MealTemplate/entities/thuc-don-mau.entity';
import { AdminMealTemplateController } from './meal-template.controller';
import { AdminMealTemplateService } from './meal-template.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ThucDonMauEntity, ChiTietThucDonMauEntity]),
  ],
  controllers: [AdminMealTemplateController],
  providers: [AdminMealTemplateService],
})
export class AdminMealTemplateModule {}
