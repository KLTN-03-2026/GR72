import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NhomThucPhamEntity } from '../../Admin/Food/entities/nhom-thuc-pham.entity';
import { ThucPhamEntity } from '../../Admin/Food/entities/thuc-pham.entity';
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';
import { UserFoodController } from './food.controller';
import { UserFoodService } from './food.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaiKhoanEntity,
      NhomThucPhamEntity,
      ThucPhamEntity,
    ]),
  ],
  controllers: [UserFoodController],
  providers: [UserFoodService],
})
export class UserFoodModule {}
