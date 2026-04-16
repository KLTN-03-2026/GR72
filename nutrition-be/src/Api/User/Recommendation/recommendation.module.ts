import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThucPhamEntity } from '../../Admin/Food/entities/thuc-pham.entity';
import { ThongBaoEntity } from '../../Admin/FoodReview/entities/thong-bao.entity';
import { HoSoEntity } from '../../Admin/User/entities/ho-so.entity';
import { MucTieuEntity } from '../../Admin/User/entities/muc-tieu.entity';
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';
import { CongThucEntity } from '../../Nutritionist/Recipe/entities/cong-thuc.entity';
import { ChiSoSucKhoeEntity } from '../HealthAssessment/entities/chi-so-suc-khoe.entity';
import { DanhGiaSucKhoeEntity } from '../HealthAssessment/entities/danh-gia-suc-khoe.entity';
import { NhatKyBuaAnEntity, TongHopDinhDuongNgayEntity } from '../MealLog/entities/nhat-ky-bua-an.entity';
import { ChiTietKeHoachAnEntity, KeHoachAnEntity } from '../MealPlan/entities/ke-hoach-an.entity';
import { ChiTietThucDonMauEntity, ThucDonMauEntity } from '../../Nutritionist/MealTemplate/entities/thuc-don-mau.entity';
import { KhuyenNghiAiEntity } from './entities/khuyen-nghi-ai.entity';
import { UserRecommendationController } from './recommendation.controller';
import { UserRecommendationService } from './recommendation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaiKhoanEntity,
      HoSoEntity,
      MucTieuEntity,
      ChiSoSucKhoeEntity,
      DanhGiaSucKhoeEntity,
      NhatKyBuaAnEntity,
      TongHopDinhDuongNgayEntity,
      ThucPhamEntity,
      CongThucEntity,
      ThucDonMauEntity,
      ChiTietThucDonMauEntity,
      KeHoachAnEntity,
      ChiTietKeHoachAnEntity,
      KhuyenNghiAiEntity,
      ThongBaoEntity,
    ]),
  ],
  controllers: [UserRecommendationController],
  providers: [UserRecommendationService],
})
export class UserRecommendationModule {}
