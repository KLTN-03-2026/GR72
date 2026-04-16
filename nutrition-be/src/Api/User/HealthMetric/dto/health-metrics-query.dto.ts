import { IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class HealthMetricsQueryDto {
  @IsOptional()
  @IsNumber({}, { message: 'Trang phải là số' })
  @Min(1, { message: 'Trang phải lớn hơn 0' })
  page?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Giới hạn phải là số' })
  @Min(1, { message: 'Giới hạn phải lớn hơn 0' })
  limit?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày bắt đầu phải là chuỗi ISO' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày kết thúc phải là chuỗi ISO' })
  to?: string;
}
