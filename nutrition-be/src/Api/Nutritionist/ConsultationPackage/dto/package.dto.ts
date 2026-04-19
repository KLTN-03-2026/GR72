import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const MIN_PACKAGE_DURATION_MINUTES = 15;
const MAX_PACKAGE_DURATION_MINUTES = 240;

export class CreatePackageDto {
  @IsString()
  ten!: string;

  @IsOptional()
  @IsString()
  moTa?: string;

  @IsNumber()
  gia!: number;

  @IsOptional()
  @IsInt()
  @Min(MIN_PACKAGE_DURATION_MINUTES)
  @Max(MAX_PACKAGE_DURATION_MINUTES)
  thoiLuongPhut?: number;

  @IsOptional()
  @IsNumber()
  soLanDungMienPhi?: number;
}

export class UpdatePackageDto {
  @IsOptional()
  @IsString()
  ten?: string;

  @IsOptional()
  @IsString()
  moTa?: string;

  @IsOptional()
  @IsNumber()
  gia?: number;

  @IsOptional()
  @IsInt()
  @Min(MIN_PACKAGE_DURATION_MINUTES)
  @Max(MAX_PACKAGE_DURATION_MINUTES)
  thoiLuongPhut?: number;

  @IsOptional()
  @IsNumber()
  soLanDungMienPhi?: number;

  @IsOptional()
  @IsString()
  trangThai?: string;
}

export class PackageResponseDto {
  id!: number;
  chuyenGiaDinhDuongId!: number;
  ten!: string;
  moTa!: string | null;
  gia!: number;
  thoiLuongPhut!: number;
  soLanDungMienPhi!: number;
  soLuotSuDung!: number;
  trangThai!: string;
  taLuc!: Date;
  capNhatLuc!: Date;
}
