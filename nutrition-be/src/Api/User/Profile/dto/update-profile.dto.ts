import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

type UserGender = 'nam' | 'nu' | 'khac';
type UserActivityLevel =
  | 'it_van_dong'
  | 'van_dong_nhe'
  | 'van_dong_vua'
  | 'nang_dong'
  | 'rat_nang_dong';

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  hoTen?: string;

  @IsOptional()
  @IsEnum(['nam', 'nu', 'khac'], { message: 'Giới tính không hợp lệ' })
  gioiTinh?: UserGender;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh không hợp lệ' })
  ngaySinh?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Chiều cao phải là số' })
  @Min(1, { message: 'Chiều cao phải lớn hơn 0' })
  chieuCaoCm?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Cân nặng hiện tại phải là số' })
  @Min(1, { message: 'Cân nặng hiện tại phải lớn hơn 0' })
  canNangHienTaiKg?: number;

  @IsOptional()
  @IsEnum(
    [
      'it_van_dong',
      'van_dong_nhe',
      'van_dong_vua',
      'nang_dong',
      'rat_nang_dong',
    ],
    { message: 'Mức độ vận động không hợp lệ' },
  )
  mucDoVanDong?: UserActivityLevel;

  @IsOptional()
  @IsArray({ message: 'Chế độ ăn ưu tiên phải là mảng' })
  @ArrayMaxSize(50)
  @IsString({ each: true, message: 'Chế độ ăn ưu tiên phải là chuỗi' })
  cheDoAnUuTien?: string[];

  @IsOptional()
  @IsArray({ message: 'Dị ứng phải là mảng' })
  @ArrayMaxSize(50)
  @IsString({ each: true, message: 'Dị ứng phải là chuỗi' })
  diUng?: string[];

  @IsOptional()
  @IsArray({ message: 'Thực phẩm không thích phải là mảng' })
  @ArrayMaxSize(50)
  @IsString({ each: true, message: 'Thực phẩm không thích phải là chuỗi' })
  thucPhamKhongThich?: string[];

  @IsOptional()
  @Matches(/^(https?:\/\/\S+|\/api\/uploads\/\S+)$/, {
    message: 'Ảnh đại diện URL không hợp lệ',
  })
  anhDaiDienUrl?: string;
}
