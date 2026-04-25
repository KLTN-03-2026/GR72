import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtConfigModule } from '../../../common/config/jwt-config.module';
import { NutritionistProfileController } from './profile.controller';
import { NutritionistProfileService } from './profile.service';
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';
import { ChuyenGiaDinhDuongEntity } from '../../Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import { DanhGiaEntity } from '../../Admin/Booking/entities/danh-gia.entity';

@Module({
  imports: [
    JwtConfigModule,
    TypeOrmModule.forFeature([
      TaiKhoanEntity,
      ChuyenGiaDinhDuongEntity,
      DanhGiaEntity,
    ]),
  ],
  controllers: [NutritionistProfileController],
  providers: [NutritionistProfileService],
  exports: [NutritionistProfileService],
})
export class NutritionistProfileModule {}
