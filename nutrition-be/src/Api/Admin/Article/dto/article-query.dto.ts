import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class ArticleQueryDto {
  @IsOptional() @IsString()
  tieuDe?: string;

  @IsOptional() @IsString()
  trangThai?: string;

  @IsOptional() @IsString()
  danhMuc?: string;

  @IsOptional() @IsString()
  tacGiaId?: string;

  @IsOptional() @Transform(({ value }) => (value ? String(value) : '1'))
  @IsString()
  page?: string;

  @IsOptional() @Transform(({ value }) => (value ? String(value) : '10'))
  @IsString()
  limit?: string;
}
