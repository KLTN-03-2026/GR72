import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LichHenEntity } from './entities/lich-hen.entity';
import { ThanhToanTuVanEntity } from './entities/thanh-toan-tu-van.entity';
import { DanhGiaEntity } from './entities/danh-gia.entity';
import { ChuyenGiaDinhDuongEntity } from '../ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import { TaiKhoanEntity } from '../User/entities/tai-khoan.entity';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LichHenEntity, ThanhToanTuVanEntity, DanhGiaEntity, ChuyenGiaDinhDuongEntity, TaiKhoanEntity]),
  ],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class AdminBookingModule {}
