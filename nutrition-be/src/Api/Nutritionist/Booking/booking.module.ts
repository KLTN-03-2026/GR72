import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NutritionistBookingController } from './booking.controller';
import { NutritionistBookingService } from './booking.service';
import { LichHenEntity } from '../../Admin/Booking/entities/lich-hen.entity';
import { ThanhToanTuVanEntity } from '../../Admin/Booking/entities/thanh-toan-tu-van.entity';
import { ThongBaoEntity } from '../../Admin/FoodReview/entities/thong-bao.entity';
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LichHenEntity,
      ThanhToanTuVanEntity,
      ThongBaoEntity,
      TaiKhoanEntity,
    ]),
  ],
  controllers: [NutritionistBookingController],
  providers: [NutritionistBookingService],
  exports: [NutritionistBookingService],
})
export class NutritionistBookingModule {}
