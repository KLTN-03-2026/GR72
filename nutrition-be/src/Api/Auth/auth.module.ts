import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from '../../common/email/email.module';
import { HoSoEntity } from '../Admin/User/entities/ho-so.entity';
import { MucTieuEntity } from '../Admin/User/entities/muc-tieu.entity';
import { TaiKhoanEntity } from '../Admin/User/entities/tai-khoan.entity';
import { OtpEntity } from './entities/otp.entity';
import { ChuyenGiaDinhDuongEntity } from '../Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import { ThongBaoEntity } from '../Admin/FoodReview/entities/thong-bao.entity';
import { DangKyGoiDichVuEntity } from '../Admin/Subscription/entities/dang-ky-goi-dich-vu.entity';
import { GoiDichVuEntity } from '../Admin/Package/entities/goi-dich-vu.entity';
import { AuthController } from './auth.controller';
import { VnpayCallbackController } from './vnpay-callback.controller';
import { AuthService } from './auth.service';
import { VnpayCallbackService } from './vnpay-callback.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaiKhoanEntity,
      HoSoEntity,
      MucTieuEntity,
      OtpEntity,
      ChuyenGiaDinhDuongEntity,
      ThongBaoEntity,
      DangKyGoiDichVuEntity,
      GoiDichVuEntity,
    ]),
    JwtModule.register({}),
    EmailModule,
  ],
  controllers: [AuthController, VnpayCallbackController],
  providers: [AuthService, VnpayCallbackService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
