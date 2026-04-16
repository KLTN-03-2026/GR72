import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { MealLogDetailDto } from './meal-log-detail.dto';

export class UpdateMealLogDto {
  @IsOptional()
  @IsDateString({}, { message: 'Ngày ghi không hợp lệ' })
  ngayGhi?: string;

  @IsOptional()
  @IsEnum(['bua_sang', 'bua_trua', 'bua_toi', 'bua_phu'], {
    message: 'Loại bữa ăn không hợp lệ',
  })
  loaiBuaAn?: 'bua_sang' | 'bua_trua' | 'bua_toi' | 'bua_phu';

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  @MaxLength(1000, { message: 'Ghi chú không được vượt quá 1000 ký tự' })
  ghiChu?: string;

  @IsOptional()
  @IsArray({ message: 'Chi tiết bữa ăn phải là mảng' })
  @ValidateNested({ each: true })
  @Type(() => MealLogDetailDto)
  chiTiet?: MealLogDetailDto[];
}
