import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DanhGiaEntity } from '../../Admin/Booking/entities/danh-gia.entity';
import { LichHenEntity } from '../../Admin/Booking/entities/lich-hen.entity';
import { PhanBoDoanhThuBookingEntity } from '../../Admin/Booking/entities/phan-bo-doanh-thu-booking.entity';
import { ThanhToanTuVanEntity } from '../../Admin/Booking/entities/thanh-toan-tu-van.entity';
import { ChuyenGiaDinhDuongEntity } from '../../Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import { GoiTuVanEntity } from '../../Admin/ChuyenGiaDinhDuong/entities/goi-tu-van.entity';
import { ThongBaoEntity } from '../../Admin/FoodReview/entities/thong-bao.entity';
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';
import { NutritionistPublicController } from './nutritionist-public.controller';
import { UserConsultationController } from './user-consultation.controller';
import { UserConsultationService } from './user-consultation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaiKhoanEntity,
      ChuyenGiaDinhDuongEntity,
      GoiTuVanEntity,
      DanhGiaEntity,
      LichHenEntity,
      ThanhToanTuVanEntity,
      PhanBoDoanhThuBookingEntity,
      ThongBaoEntity,
    ]),
  ],
  controllers: [NutritionistPublicController, UserConsultationController],
  providers: [UserConsultationService],
  exports: [UserConsultationService],
})
export class UserConsultationModule {}
