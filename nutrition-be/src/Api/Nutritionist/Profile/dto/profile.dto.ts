import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  anhDaiDienUrl?: string;

  @IsOptional()
  @IsString()
  moTa?: string;

  @IsOptional()
  @IsString()
  chuyenMon?: string;

  @IsOptional()
  @IsString()
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
