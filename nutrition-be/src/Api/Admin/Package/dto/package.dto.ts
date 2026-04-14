import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

const CYCLE_TYPES = ['thang', 'quy', 'nam', 'tron_doi'] as const;
const STATUSES = ['ban_nhap', 'dang_kinh_doanh', 'ngung_kinh_doanh'] as const;

export class CreatePackageDto {
  @IsString()
  @IsNotEmpty()
  tenGoi!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  moTa?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  giaNiemYet!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  giaKhuyenMai?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  thoiHanNgay?: number;

  @IsString()
  @IsIn(CYCLE_TYPES)
  loaiChuKy!: string;

  @IsOptional()
  @IsString()
  @IsIn(STATUSES)
  trangThai?: string;

  @IsOptional()
  @IsBoolean()
  laGoiMienPhi?: boolean;

  @IsOptional()
  @IsBoolean()
  goiNoiBat?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  thuTuHienThi?: number;
}

export class UpdatePackageDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tenGoi?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  moTa?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  giaNiemYet?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  giaKhuyenMai?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  thoiHanNgay?: number;

  @IsOptional()
  @IsString()
  @IsIn(CYCLE_TYPES)
  loaiChuKy?: string;

  @IsOptional()
  @IsString()
  @IsIn(STATUSES)
  trangThai?: string;

  @IsOptional()
  @IsBoolean()
  laGoiMienPhi?: boolean;

  @IsOptional()
  @IsBoolean()
  goiNoiBat?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  thuTuHienThi?: number;
}
