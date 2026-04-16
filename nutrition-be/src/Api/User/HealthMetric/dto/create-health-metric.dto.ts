import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateHealthMetricDto {
  @IsOptional()
  @IsDateString({}, { message: 'Thời điểm đo không hợp lệ' })
  doLuc?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Cân nặng phải là số' })
  @Min(1, { message: 'Cân nặng phải lớn hơn 0' })
  canNangKg?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Chiều cao phải là số' })
  @Min(1, { message: 'Chiều cao phải lớn hơn 0' })
  chieuCaoCm?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Vòng eo phải là số' })
  @Min(1, { message: 'Vòng eo phải lớn hơn 0' })
  vongEoCm?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Vòng mông phải là số' })
  @Min(1, { message: 'Vòng mông phải lớn hơn 0' })
  vongMongCm?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Huyết áp tâm thu phải là số' })
  @Min(1, { message: 'Huyết áp tâm thu phải lớn hơn 0' })
  huyetApTamThu?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Huyết áp tâm trương phải là số' })
  @Min(1, { message: 'Huyết áp tâm trương phải lớn hơn 0' })
  huyetApTamTruong?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Đường huyết phải là số' })
  @Min(0, { message: 'Đường huyết không được âm' })
  duongHuyet?: number;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  @MaxLength(1000, { message: 'Ghi chú không được vượt quá 1000 ký tự' })
  ghiChu?: string;
}
