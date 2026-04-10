import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodGroupController } from './food-group.controller';
import { FoodController } from './food.controller';
import { FoodService } from './food.service';
import { NhomThucPhamEntity } from './entities/nhom-thuc-pham.entity';
import { ThucPhamEntity } from './entities/thuc-pham.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ThucPhamEntity, NhomThucPhamEntity])],
  controllers: [FoodController, FoodGroupController],
  providers: [FoodService],
  exports: [TypeOrmModule],
})
export class AdminFoodModule {}
