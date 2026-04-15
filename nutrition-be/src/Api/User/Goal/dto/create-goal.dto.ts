import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

type GoalType = 'giam_can' | 'tang_can' | 'giu_can';

export class CreateGoalDto {
  @IsEnum(['giam_can', 'tang_can', 'giu_can'], {
    message: 'Loại mục tiêu không hợp lệ',
  })
  loaiMucTieu!: GoalType;

  @IsOptional()
  @IsNumber({}, { message: 'Cân nặng bắt đầu phải là số' })
  @Min(1, { message: 'Cân nặng bắt đầu phải lớn hơn 0' })
  canNangBatDauKg?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Cân nặng mục tiêu phải là số' })
  @Min(1, { message: 'Cân nặng mục tiêu phải lớn hơn 0' })
  canNangMucTieuKg?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Mục tiêu calories phải là số' })
  @Min(1, { message: 'Mục tiêu calories phải lớn hơn 0' })
  mucTieuCaloriesNgay?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Mục tiêu protein phải là số' })
  @Min(1, { message: 'Mục tiêu protein phải lớn hơn 0' })
  mucTieuProteinG?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Mục tiêu carb phải là số' })
  @Min(1, { message: 'Mục tiêu carb phải lớn hơn 0' })
  mucTieuCarbG?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Mục tiêu fat phải là số' })
  @Min(1, { message: 'Mục tiêu fat phải lớn hơn 0' })
  mucTieuFatG?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  ngayBatDau?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày mục tiêu không hợp lệ' })
  ngayMucTieu?: string;
}
