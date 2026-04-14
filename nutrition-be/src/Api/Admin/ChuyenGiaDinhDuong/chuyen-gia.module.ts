import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChuyenGiaDinhDuongEntity } from './entities/chuyen-gia-dinh-duong.entity';
import { GoiTuVanEntity } from './entities/goi-tu-van.entity';
import { ChuyenGiaController } from './chuyen-gia.controller';
import { ChuyenGiaService } from './chuyen-gia.service';
import { TaiKhoanEntity } from '../User/entities/tai-khoan.entity';
import { ThongBaoEntity } from '../FoodReview/entities/thong-bao.entity';
import { DangKyGoiDichVuEntity } from '../Subscription/entities/dang-ky-goi-dich-vu.entity';
import { GoiDichVuEntity } from '../Package/entities/goi-dich-vu.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChuyenGiaDinhDuongEntity,
      GoiTuVanEntity,
      TaiKhoanEntity,
      ThongBaoEntity,
      DangKyGoiDichVuEntity,
      GoiDichVuEntity,
    ]),
  ],
  controllers: [ChuyenGiaController],
  providers: [ChuyenGiaService],
  exports: [ChuyenGiaService],
})
export class AdminChuyenGiaModule {}
