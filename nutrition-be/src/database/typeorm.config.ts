import { join } from 'node:path';
import { NhomThucPhamEntity } from '../Api/Admin/Food/entities/nhom-thuc-pham.entity';
import { ThucPhamEntity } from '../Api/Admin/Food/entities/thuc-pham.entity';
import { ThongBaoEntity } from '../Api/Admin/FoodReview/entities/thong-bao.entity';
import { YeuCauDuyetThucPhamEntity } from '../Api/Admin/FoodReview/entities/yeu-cau-duyet-thuc-pham.entity';
import { GoiDichVuEntity } from '../Api/Admin/Package/entities/goi-dich-vu.entity';
import { ChucNangGoiDichVuEntity } from '../Api/Admin/PackageFeature/entities/chuc-nang-goi-dich-vu.entity';
import { DangKyGoiDichVuEntity } from '../Api/Admin/Subscription/entities/dang-ky-goi-dich-vu.entity';
import { ThanhToanGoiDichVuEntity } from '../Api/Admin/Payment/entities/thanh-toan-goi-dich-vu.entity';
import { BaiVietEntity } from '../Api/Nutritionist/Article/entities/bai-viet.entity';
import { CongThucEntity, ThanhPhanCongThucEntity } from '../Api/Nutritionist/Recipe/entities/cong-thuc.entity';
import { ThucDonMauEntity, ChiTietThucDonMauEntity } from '../Api/Nutritionist/MealTemplate/entities/thuc-don-mau.entity';
import { ChuyenGiaDinhDuongEntity } from '../Api/Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import { GoiTuVanEntity } from '../Api/Admin/ChuyenGiaDinhDuong/entities/goi-tu-van.entity';
import { LichHenEntity } from '../Api/Admin/Booking/entities/lich-hen.entity';
import { ThanhToanTuVanEntity } from '../Api/Admin/Booking/entities/thanh-toan-tu-van.entity';
import { DanhGiaEntity } from '../Api/Admin/Booking/entities/danh-gia.entity';
import { TaiKhoanEntity } from '../Api/Admin/User/entities/tai-khoan.entity';
import { HoSoEntity } from '../Api/Admin/User/entities/ho-so.entity';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { DataSourceOptions } from 'typeorm';

export function getTypeOrmConfig(): TypeOrmModuleOptions & DataSourceOptions {
  return {
    type: 'mysql',
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_DATABASE ?? 'do_an',
    entities: [TaiKhoanEntity, HoSoEntity, NhomThucPhamEntity, ThucPhamEntity, YeuCauDuyetThucPhamEntity, ThongBaoEntity, GoiDichVuEntity, ChucNangGoiDichVuEntity, DangKyGoiDichVuEntity, ThanhToanGoiDichVuEntity, BaiVietEntity, CongThucEntity, ThanhPhanCongThucEntity, ThucDonMauEntity, ChiTietThucDonMauEntity, ChuyenGiaDinhDuongEntity, GoiTuVanEntity, LichHenEntity, ThanhToanTuVanEntity, DanhGiaEntity],
    migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
    synchronize: false,
    autoLoadEntities: true,
  };
}
