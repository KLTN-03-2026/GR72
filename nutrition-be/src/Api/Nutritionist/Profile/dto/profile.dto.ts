import { IsOptional, IsString, IsUrl, MaxLength, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
  @ValidateIf((o) => typeof o.anhDaiDienUrl === 'string' && o.anhDaiDienUrl.trim() !== '')
  @IsUrl({}, { message: 'Avatar URL khong hop le' })
  @IsOptional()
  @MaxLength(255)
  anhDaiDienUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  moTa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  chuyenMon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  gioLamViec?: string;
}

export class ProfileResponseDto {
  id!: number;
  hoTen!: string;
  vaiTro!: string;
  trangThai!: string;
  anhDaiDienUrl!: string | null;
  moTa!: string | null;
  chuyenMon!: string | null;
  gioLamViec!: string | null;
  diemDanhGiaTrungBinh!: number;
  soLuotDanhGia!: number;
  tongBooking!: number;
  taoLuc!: Date;
  capNhatLuc!: Date;
}
