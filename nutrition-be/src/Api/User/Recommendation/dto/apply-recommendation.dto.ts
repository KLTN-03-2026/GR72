import { IsDateString, IsOptional } from 'class-validator';

export class ApplyRecommendationDto {
  @IsOptional()
  @IsDateString({}, { message: 'Ngày áp dụng không hợp lệ' })
  ngayApDung?: string;
}
