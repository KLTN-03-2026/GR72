import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from '../../common/email/email.module';
import { ChuyenGiaEntity } from '../shared/entities/chuyen-gia.entity';
import { OtpEntity } from '../shared/entities/otp.entity';
import { TaiKhoanEntity } from '../shared/entities/tai-khoan.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaiKhoanEntity, ChuyenGiaEntity, OtpEntity]),
    JwtModule.register({}),
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
