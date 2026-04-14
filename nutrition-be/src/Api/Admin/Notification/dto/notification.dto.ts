import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class NotificationQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['chua_doc', 'da_doc'])
  trangThai?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  @IsIn(['nhan', 'gui'])
  huong?: 'nhan' | 'gui';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class CreateNotificationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  taiKhoanId!: number;

  @IsString()
  @IsNotEmpty()
  loai!: string;

  @IsString()
  @IsNotEmpty()
  tieuDe!: string;

  @IsString()
  @IsNotEmpty()
  noiDung!: string;

  @IsOptional()
  @IsString()
  duongDanHanhDong?: string;
}

export class UpdateNotificationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tieuDe?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  noiDung?: string;

  @IsOptional()
  @IsString()
  duongDanHanhDong?: string;
}
