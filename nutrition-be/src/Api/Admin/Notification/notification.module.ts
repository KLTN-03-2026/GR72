import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThongBaoEntity } from '../FoodReview/entities/thong-bao.entity';
import { TaiKhoanEntity } from '../User/entities/tai-khoan.entity';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([ThongBaoEntity, TaiKhoanEntity])],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class AdminNotificationModule {}
