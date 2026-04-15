import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HoSoEntity } from '../../Admin/User/entities/ho-so.entity';
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';
import { UserHealthAssessmentModule } from '../HealthAssessment/health-assessment.module';
import { UserProfileController } from './profile.controller';
import { UserProfileService } from './profile.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaiKhoanEntity, HoSoEntity]),
    UserHealthAssessmentModule,
  ],
  controllers: [UserProfileController],
  providers: [UserProfileService],
})
export class UserProfileModule {}
