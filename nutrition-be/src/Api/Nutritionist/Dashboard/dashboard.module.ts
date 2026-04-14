import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaiVietEntity } from '../Article/entities/bai-viet.entity';
import { CongThucEntity } from '../Recipe/entities/cong-thuc.entity';
import { ThucDonMauEntity } from '../MealTemplate/entities/thuc-don-mau.entity';
import { YeuCauDuyetThucPhamEntity } from '../../Admin/FoodReview/entities/yeu-cau-duyet-thuc-pham.entity';
import { ThongBaoEntity } from '../../Admin/FoodReview/entities/thong-bao.entity';
import { NutritionistDashboardController } from './dashboard.controller';
import { NutritionistDashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BaiVietEntity,
      CongThucEntity,
      ThucDonMauEntity,
      YeuCauDuyetThucPhamEntity,
      ThongBaoEntity,
    ]),
  ],
  controllers: [NutritionistDashboardController],
  providers: [NutritionistDashboardService],
})
export class NutritionistDashboardModule {}
