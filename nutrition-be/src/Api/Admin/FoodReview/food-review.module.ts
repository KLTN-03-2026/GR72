import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThucPhamEntity } from '../Food/entities/thuc-pham.entity';
import { TaiKhoanEntity } from '../User/entities/tai-khoan.entity';
import { ThongBaoEntity } from './entities/thong-bao.entity';
import { YeuCauDuyetThucPhamEntity } from './entities/yeu-cau-duyet-thuc-pham.entity';
import { FoodReviewController } from './food-review.controller';
import { FoodReviewService } from './food-review.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      YeuCauDuyetThucPhamEntity,
      ThongBaoEntity,
      ThucPhamEntity,
      TaiKhoanEntity,
    ]),
  ],
  controllers: [FoodReviewController],
  providers: [FoodReviewService],
})
export class AdminFoodReviewModule {}
