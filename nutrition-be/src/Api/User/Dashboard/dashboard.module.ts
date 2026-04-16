import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThongBaoEntity } from '../../Admin/FoodReview/entities/thong-bao.entity';
import { HoSoEntity } from '../../Admin/User/entities/ho-so.entity';
import { MucTieuEntity } from '../../Admin/User/entities/muc-tieu.entity';
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';
import { ChiSoSucKhoeEntity } from '../HealthAssessment/entities/chi-so-suc-khoe.entity';
import { DanhGiaSucKhoeEntity } from '../HealthAssessment/entities/danh-gia-suc-khoe.entity';
import { TongHopDinhDuongNgayEntity } from '../MealLog/entities/nhat-ky-bua-an.entity';
import { KhuyenNghiAiEntity } from '../Recommendation/entities/khuyen-nghi-ai.entity';
import { UserDashboardController } from './dashboard.controller';
import { UserDashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaiKhoanEntity,
      HoSoEntity,
      MucTieuEntity,
      ChiSoSucKhoeEntity,
      DanhGiaSucKhoeEntity,
      TongHopDinhDuongNgayEntity,
      KhuyenNghiAiEntity,
      ThongBaoEntity,
    ]),
  ],
  controllers: [UserDashboardController],
  providers: [UserDashboardService],
})
export class UserDashboardModule {}
