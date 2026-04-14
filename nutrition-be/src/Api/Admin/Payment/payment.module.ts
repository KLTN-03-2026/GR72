import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DangKyGoiDichVuEntity } from '../Subscription/entities/dang-ky-goi-dich-vu.entity';
import { ThanhToanGoiDichVuEntity } from './entities/thanh-toan-goi-dich-vu.entity';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ThanhToanGoiDichVuEntity, DangKyGoiDichVuEntity]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class AdminPaymentModule {}
