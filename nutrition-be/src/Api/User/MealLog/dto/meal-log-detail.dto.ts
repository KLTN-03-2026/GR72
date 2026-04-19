import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class MealLogDetailDto {
  @IsEnum(['thuc_pham', 'cong_thuc'], {
    message: 'Loại nguồn phải là thuc_pham hoặc cong_thuc',
  })
  loaiNguon!: 'thuc_pham' | 'cong_thuc';

  @IsOptional()
  @IsNumber({}, { message: 'ID thực phẩm không hợp lệ' })
  @Min(1, { message: 'ID thực phẩm phải lớn hơn 0' })
  thucPhamId?: number;

  @IsOptional()
  @IsNumber({}, { message: 'ID công thức không hợp lệ' })
  @Min(1, { message: 'ID công thức phải lớn hơn 0' })
  congThucId?: number;

  @IsNumber({}, { message: 'Số lượng phải là số' })
  @Min(0.01, { message: 'Số lượng phải lớn hơn 0' })
  soLuong!: number;

  @IsString({ message: 'Đơn vị phải là chuỗi' })
  @MaxLength(50, { message: 'Đơn vị không được vượt quá 50 ký tự' })
  donVi!: string;
}
