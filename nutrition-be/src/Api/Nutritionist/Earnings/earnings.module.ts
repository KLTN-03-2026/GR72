import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NutritionistEarningsController } from './earnings.controller';
import { NutritionistEarningsService } from './earnings.service';
import { LichHenEntity } from '../../Admin/Booking/entities/lich-hen.entity';
import { ThanhToanTuVanEntity } from '../../Admin/Booking/entities/thanh-toan-tu-van.entity';
import { ChuyenGiaDinhDuongEntity } from '../../Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LichHenEntity, ThanhToanTuVanEntity, ChuyenGiaDinhDuongEntity]),
  ],
  controllers: [NutritionistEarningsController],
  providers: [NutritionistEarningsService],
  exports: [NutritionistEarningsService],
})
export class NutritionistEarningsModule {}
