import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

const STATUSES = [
  'cho_kich_hoat',
  'dang_hoat_dong',
  'het_han',
  'da_huy',
] as const;
const SOURCES = [
  'nguoi_dung_tu_nang_cap',
  'quan_tri_cap',
  'khuyen_mai',
] as const;

export class SubscriptionQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(STATUSES)
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

export class CreateSubscriptionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  taiKhoanId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  goiDichVuId!: number;

  @IsOptional()
  @IsString()
  ngayBatDau?: string;

  @IsOptional()
  @IsString()
  ngayHetHan?: string;

  @IsOptional()
  @IsBoolean()
  tuDongGiaHan?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(SOURCES)
  nguonDangKy?: string;

  @IsOptional()
  @IsString()
  ghiChu?: string;
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsString()
  @IsIn(STATUSES)
  trangThai?: string;

  @IsOptional()
  @IsString()
  ngayBatDau?: string;

  @IsOptional()
  @IsString()
  ngayHetHan?: string;

  @IsOptional()
  @IsBoolean()
  tuDongGiaHan?: boolean;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ghiChu?: string;
}
