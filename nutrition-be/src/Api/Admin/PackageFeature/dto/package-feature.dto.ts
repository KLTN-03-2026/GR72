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

const LIMIT_TYPES = ['ngay', 'thang', 'khong_gioi_han'] as const;

export class CreatePackageFeatureDto {
  @IsString()
  @IsNotEmpty()
  maChucNang!: string;

  @IsString()
  @IsNotEmpty()
  tenChucNang!: string;

  @IsOptional()
  @IsString()
  moTa?: string;

  @IsOptional()
  @IsBoolean()
  duocPhepSuDung?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  gioiHanSoLan?: number | null;

  @IsOptional()
  @IsString()
  @IsIn(LIMIT_TYPES)
  gioiHanTheo?: string;
}

export class UpdatePackageFeatureDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tenChucNang?: string;

  @IsOptional()
  @IsString()
  moTa?: string;

  @IsOptional()
  @IsBoolean()
  duocPhepSuDung?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  gioiHanSoLan?: number | null;

  @IsOptional()
  @IsString()
  @IsIn(LIMIT_TYPES)
  gioiHanTheo?: string;
}
