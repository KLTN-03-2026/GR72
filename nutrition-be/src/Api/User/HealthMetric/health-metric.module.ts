import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HoSoEntity } from '../../Admin/User/entities/ho-so.entity';
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';
import { UserHealthAssessmentModule } from '../HealthAssessment/health-assessment.module';
import { ChiSoSucKhoeEntity } from '../HealthAssessment/entities/chi-so-suc-khoe.entity';
import { UserHealthMetricController } from './health-metric.controller';
import { UserHealthMetricService } from './health-metric.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaiKhoanEntity, HoSoEntity, ChiSoSucKhoeEntity]),
    UserHealthAssessmentModule,
  ],
  controllers: [UserHealthMetricController],
  providers: [UserHealthMetricService],
})
export class UserHealthMetricModule {}
