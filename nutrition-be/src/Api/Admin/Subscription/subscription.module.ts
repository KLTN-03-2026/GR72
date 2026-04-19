import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoiDichVuEntity } from '../Package/entities/goi-dich-vu.entity';
import { TaiKhoanEntity } from '../User/entities/tai-khoan.entity';
import { DangKyGoiDichVuEntity } from './entities/dang-ky-goi-dich-vu.entity';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DangKyGoiDichVuEntity,
      GoiDichVuEntity,
      TaiKhoanEntity,
    ]),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
})
export class AdminSubscriptionModule {}
