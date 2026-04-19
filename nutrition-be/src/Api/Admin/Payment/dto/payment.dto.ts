import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

const PAYMENT_STATUSES = [
  'cho_thanh_toan',
  'thanh_cong',
  'that_bai',
  'da_hoan_tien',
] as const;

export class PaymentQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(PAYMENT_STATUSES)
  trangThai?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  goiDichVuId?: number;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
