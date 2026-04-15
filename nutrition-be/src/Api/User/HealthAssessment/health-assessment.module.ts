import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HoSoEntity } from '../../Admin/User/entities/ho-so.entity';
import { MucTieuEntity } from '../../Admin/User/entities/muc-tieu.entity';
import { ChiSoSucKhoeEntity } from './entities/chi-so-suc-khoe.entity';
import { DanhGiaSucKhoeEntity } from './entities/danh-gia-suc-khoe.entity';
import { UserHealthAssessmentService } from './health-assessment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HoSoEntity,
      MucTieuEntity,
      ChiSoSucKhoeEntity,
      DanhGiaSucKhoeEntity,
    ]),
  ],
  providers: [UserHealthAssessmentService],
  exports: [UserHealthAssessmentService],
})
export class UserHealthAssessmentModule {}
