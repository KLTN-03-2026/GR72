import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HoSoEntity } from '../../Admin/User/entities/ho-so.entity';
import { MucTieuEntity } from '../../Admin/User/entities/muc-tieu.entity';
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';
import { UserHealthAssessmentModule } from '../HealthAssessment/health-assessment.module';
import { UserGoalController } from './goal.controller';
import { UserGoalService } from './goal.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaiKhoanEntity, HoSoEntity, MucTieuEntity]),
    UserHealthAssessmentModule,
  ],
  controllers: [UserGoalController],
  providers: [UserGoalService],
})
export class UserGoalModule {}
