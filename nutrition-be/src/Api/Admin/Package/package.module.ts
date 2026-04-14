import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoiDichVuEntity } from './entities/goi-dich-vu.entity';
import { PackageController } from './package.controller';
import { PackageService } from './package.service';

@Module({
  imports: [TypeOrmModule.forFeature([GoiDichVuEntity])],
  controllers: [PackageController],
  providers: [PackageService],
  exports: [TypeOrmModule],
})
export class AdminPackageModule {}
