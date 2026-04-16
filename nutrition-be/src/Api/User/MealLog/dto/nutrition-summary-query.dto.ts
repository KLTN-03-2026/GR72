import { IsDateString, IsOptional } from 'class-validator';

export class NutritionSummaryQueryDto {
  @IsOptional()
  @IsDateString({}, { message: 'Ngày không hợp lệ' })
  date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Từ ngày không hợp lệ' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Đến ngày không hợp lệ' })
  to?: string;
}
