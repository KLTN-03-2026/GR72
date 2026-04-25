import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LichHenEntity } from '../Admin/Booking/entities/lich-hen.entity';
import { ChuyenGiaDinhDuongEntity } from '../Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import { TaiKhoanEntity } from '../Admin/User/entities/tai-khoan.entity';
import { ConsultationCallController } from './consultation-call.controller';
import { ConsultationCallService } from './consultation-call.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LichHenEntity,
      ChuyenGiaDinhDuongEntity,
      TaiKhoanEntity,
    ]),
  ],
  controllers: [ConsultationCallController],
  providers: [ConsultationCallService],
  exports: [ConsultationCallService],
})
export class ConsultationCallModule {}

