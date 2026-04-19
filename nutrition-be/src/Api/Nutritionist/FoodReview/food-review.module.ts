import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { YeuCauDuyetThucPhamEntity } from '../../Admin/FoodReview/entities/yeu-cau-duyet-thuc-pham.entity';
import { ThongBaoEntity } from '../../Admin/FoodReview/entities/thong-bao.entity';
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';
import { NutritionistFoodReviewController } from './food-review.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      YeuCauDuyetThucPhamEntity,
      ThongBaoEntity,
      TaiKhoanEntity,
    ]),
  ],
  controllers: [NutritionistFoodReviewController],
})
export class NutritionistFoodReviewModule {}
