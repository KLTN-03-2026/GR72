import {
  IsArray,
  IsBoolean,
  IsJSON,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateFoodDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  nhomThucPhamId?: number;

  @IsOptional()
  @IsString()
  ten?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  moTa?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  theGan?: string[];

  @IsOptional()
  @IsString()
  loaiNguon?: string;

  @IsOptional()
  @IsString()
  tenNguon?: string;

  @IsOptional()
  @IsString()
  maNguon?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  khauPhanThamChieu?: number;

  @IsOptional()
  @IsString()
  donViKhauPhan?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  calories100g?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  protein100g?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  carb100g?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fat100g?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  chatXo100g?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  duong100g?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  natri100g?: number;

  @IsOptional()
  @IsJSON()
  duLieuGoc?: string;

  @IsOptional()
  @IsBoolean()
  daXacMinh?: boolean;
}
