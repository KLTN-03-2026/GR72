import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThucPhamEntity } from '../Food/entities/thuc-pham.entity';
import { ThongBaoEntity } from '../FoodReview/entities/thong-bao.entity';
import { YeuCauDuyetThucPhamEntity } from '../FoodReview/entities/yeu-cau-duyet-thuc-pham.entity';
import { GoiDichVuEntity } from '../Package/entities/goi-dich-vu.entity';
import { ThanhToanGoiDichVuEntity } from '../Payment/entities/thanh-toan-goi-dich-vu.entity';
import { DangKyGoiDichVuEntity } from '../Subscription/entities/dang-ky-goi-dich-vu.entity';
import { TaiKhoanEntity } from '../User/entities/tai-khoan.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaiKhoanEntity,
      ThucPhamEntity,
      YeuCauDuyetThucPhamEntity,
      ThongBaoEntity,
      DangKyGoiDichVuEntity,
      ThanhToanGoiDichVuEntity,
      GoiDichVuEntity,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class AdminDashboardModule {}
