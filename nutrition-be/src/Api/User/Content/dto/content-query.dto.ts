import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UserArticleQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  danhMuc?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class UserMealTemplateQueryDto {
  @IsOptional()
  @IsString()
  loaiMucTieu?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class CopyMealPlanFromTemplateDto {
  @IsOptional()
  @IsString()
  ngayApDung?: string;

  @IsOptional()
  @IsString()
  tieuDe?: string;
}

export class UserMealPlanQueryDto {
  @IsOptional()
  @IsIn(['ban_nhap', 'dang_ap_dung', 'hoan_thanh', 'luu_tru'])
  trangThai?: 'ban_nhap' | 'dang_ap_dung' | 'hoan_thanh' | 'luu_tru';

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
