import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HoSoEntity } from './entities/ho-so.entity';
import { TaiKhoanEntity } from './entities/tai-khoan.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaiKhoanEntity, HoSoEntity])],
  controllers: [UserController],
  providers: [UserService],
  exports: [TypeOrmModule],
})
export class AdminUserModule {}
