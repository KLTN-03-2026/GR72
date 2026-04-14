import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoiDichVuEntity } from '../Package/entities/goi-dich-vu.entity';
import { ChucNangGoiDichVuEntity } from './entities/chuc-nang-goi-dich-vu.entity';
import { PackageFeatureController } from './package-feature.controller';
import { PackageFeatureService } from './package-feature.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChucNangGoiDichVuEntity, GoiDichVuEntity]),
  ],
  controllers: [PackageFeatureController],
  providers: [PackageFeatureService],
})
export class AdminPackageFeatureModule {}
