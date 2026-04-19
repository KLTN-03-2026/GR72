import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NutritionistConsultationPackageController } from './consultation-package.controller';
import { NutritionistConsultationPackageService } from './consultation-package.service';
import { GoiTuVanEntity } from '../../Admin/ChuyenGiaDinhDuong/entities/goi-tu-van.entity';
import { ChuyenGiaDinhDuongEntity } from '../../Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import { LichHenEntity } from '../../Admin/Booking/entities/lich-hen.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GoiTuVanEntity,
      ChuyenGiaDinhDuongEntity,
      LichHenEntity,
    ]),
  ],
  controllers: [NutritionistConsultationPackageController],
  providers: [NutritionistConsultationPackageService],
  exports: [NutritionistConsultationPackageService],
})
export class NutritionistConsultationPackageModule {}
