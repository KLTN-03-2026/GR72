import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NutritionistConsultationPackageController } from './consultation-package.controller';
import { NutritionistConsultationPackageService } from './consultation-package.service';
import { GoiTuVanEntity } from '../../Admin/ChuyenGiaDinhDuong/entities/goi-tu-van.entity';
import { ChuyenGiaDinhDuongEntity } from '../../Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GoiTuVanEntity, ChuyenGiaDinhDuongEntity])],
  controllers: [NutritionistConsultationPackageController],
  providers: [NutritionistConsultationPackageService],
  exports: [NutritionistConsultationPackageService],
})
export class NutritionistConsultationPackageModule {}
