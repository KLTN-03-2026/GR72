import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { MealLogDetailDto } from './meal-log-detail.dto';

export class CreateMealLogDto {
  @IsDateString({}, { message: 'Ngày ghi không hợp lệ' })
  ngayGhi!: string;

  @IsEnum(['bua_sang', 'bua_trua', 'bua_toi', 'bua_phu'], {
    message: 'Loại bữa ăn không hợp lệ',
  })
  loaiBuaAn!: 'bua_sang' | 'bua_trua' | 'bua_toi' | 'bua_phu';

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  @MaxLength(1000, { message: 'Ghi chú không được vượt quá 1000 ký tự' })
  ghiChu?: string;

  @IsArray({ message: 'Chi tiết bữa ăn phải là mảng' })
  @ArrayMinSize(1, { message: 'Bữa ăn phải có ít nhất một món' })
  @ValidateNested({ each: true })
  @Type(() => MealLogDetailDto)
  chiTiet!: MealLogDetailDto[];
}
