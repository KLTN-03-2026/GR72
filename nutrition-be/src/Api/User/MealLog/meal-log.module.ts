import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThucPhamEntity } from '../../Admin/Food/entities/thuc-pham.entity';
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';
import { CongThucEntity } from '../../Nutritionist/Recipe/entities/cong-thuc.entity';
import {
  ChiTietKeHoachAnEntity,
  KeHoachAnEntity,
} from '../MealPlan/entities/ke-hoach-an.entity';
import {
  ChiTietNhatKyBuaAnEntity,
  NhatKyBuaAnEntity,
  TongHopDinhDuongNgayEntity,
} from './entities/nhat-ky-bua-an.entity';
import { UserMealLogController } from './meal-log.controller';
import { UserMealLogService } from './meal-log.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaiKhoanEntity,
      ThucPhamEntity,
      CongThucEntity,
      KeHoachAnEntity,
      ChiTietKeHoachAnEntity,
      NhatKyBuaAnEntity,
      ChiTietNhatKyBuaAnEntity,
      TongHopDinhDuongNgayEntity,
    ]),
  ],
  controllers: [UserMealLogController],
  providers: [UserMealLogService],
  exports: [UserMealLogService],
})
export class UserMealLogModule {}
