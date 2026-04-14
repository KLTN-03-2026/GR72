import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThanhToanGoiDichVuEntity } from '../Payment/entities/thanh-toan-goi-dich-vu.entity';
import { DangKyGoiDichVuEntity } from '../Subscription/entities/dang-ky-goi-dich-vu.entity';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [TypeOrmModule.forFeature([ThanhToanGoiDichVuEntity, DangKyGoiDichVuEntity])],
  controllers: [ReportController],
  providers: [ReportService],
})
export class AdminReportModule {}
