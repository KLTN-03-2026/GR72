import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UserFoodsQueryDto {
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm không hợp lệ' })
  keyword?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Nhóm thực phẩm không hợp lệ' })
  @Min(1, { message: 'Nhóm thực phẩm phải lớn hơn 0' })
  nhomThucPhamId?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Trang phải là số' })
  @Min(1, { message: 'Trang phải lớn hơn 0' })
  page?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Giới hạn phải là số' })
  @Min(1, { message: 'Giới hạn phải lớn hơn 0' })
  limit?: number;
}
