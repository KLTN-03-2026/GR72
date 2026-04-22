import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChuyenGiaDinhDuongEntity } from '../Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import { LichHenEntity } from '../Admin/Booking/entities/lich-hen.entity';
import { TaiKhoanEntity } from '../Admin/User/entities/tai-khoan.entity';
import { TinNhanEntity } from './entities/tin-nhan.entity';
import { ConsultationChatController } from './consultation-chat.controller';
import { ConsultationChatService } from './consultation-chat.service';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      LichHenEntity,
      TinNhanEntity,
      TaiKhoanEntity,
      ChuyenGiaDinhDuongEntity,
    ]),
  ],
  controllers: [ConsultationChatController],
  providers: [ConsultationChatService],
  exports: [ConsultationChatService],
})
export class ConsultationChatModule {}
