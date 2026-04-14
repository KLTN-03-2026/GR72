import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePackageDto {
  @IsString()
  ten!: string;

  @IsOptional()
  @IsString()
  moTa?: string;

  @IsNumber()
  gia!: number;

  @IsOptional()
  @IsNumber()
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
  @IsNumber()
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
  trangThai!: string;
  taLuc!: Date;
  capNhatLuc!: Date;
}
