import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThanhToanGoiDichVuEntity } from '../Payment/entities/thanh-toan-goi-dich-vu.entity';
import { DangKyGoiDichVuEntity } from '../Subscription/entities/dang-ky-goi-dich-vu.entity';
import { PhanBoDoanhThuBookingEntity } from '../Booking/entities/phan-bo-doanh-thu-booking.entity';
import { ChuyenGiaDinhDuongEntity } from '../ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ThanhToanGoiDichVuEntity,
      DangKyGoiDichVuEntity,
      PhanBoDoanhThuBookingEntity,
      ChuyenGiaDinhDuongEntity,
    ]),
  ],
  controllers: [ReportController],
  providers: [ReportService],
})
export class AdminReportModule {}
