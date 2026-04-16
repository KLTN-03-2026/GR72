import { IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class MealLogQueryDto {
  @IsOptional()
  @IsDateString({}, { message: 'Ngày không hợp lệ' })
  date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Từ ngày không hợp lệ' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Đến ngày không hợp lệ' })
  to?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Trang phải là số' })
  @Min(1, { message: 'Trang phải lớn hơn 0' })
  page?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Giới hạn phải là số' })
  @Min(1, { message: 'Giới hạn phải lớn hơn 0' })
  limit?: number;
}
