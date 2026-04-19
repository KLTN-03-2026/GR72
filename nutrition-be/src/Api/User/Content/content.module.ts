import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';
import { BaiVietEntity } from '../../Nutritionist/Article/entities/bai-viet.entity';
import {
  ChiTietThucDonMauEntity,
  ThucDonMauEntity,
} from '../../Nutritionist/MealTemplate/entities/thuc-don-mau.entity';
import { CongThucEntity } from '../../Nutritionist/Recipe/entities/cong-thuc.entity';
import { ThucPhamEntity } from '../../Admin/Food/entities/thuc-pham.entity';
import {
  ChiTietKeHoachAnEntity,
  KeHoachAnEntity,
} from '../MealPlan/entities/ke-hoach-an.entity';
import { UserContentController } from './content.controller';
import { UserContentService } from './content.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaiKhoanEntity,
      BaiVietEntity,
      ThucDonMauEntity,
      ChiTietThucDonMauEntity,
      CongThucEntity,
      ThucPhamEntity,
      KeHoachAnEntity,
      ChiTietKeHoachAnEntity,
    ]),
  ],
  controllers: [UserContentController],
  providers: [UserContentService],
})
export class UserContentModule {}
