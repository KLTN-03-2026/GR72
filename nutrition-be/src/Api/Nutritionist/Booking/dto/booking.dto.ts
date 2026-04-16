import { IsOptional, IsString } from 'class-validator';

export class BookingQueryDto {
  @IsOptional()
  @IsString()
  trangThai?: string;

  @IsOptional()
  @IsString()
  ngayHen?: string;

  @IsOptional()
  @IsString()
  tenUser?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class CompleteBookingDto {
  @IsOptional()
  @IsString()
  ghiChu?: string;
}

export class CancelBookingDto {
  @IsString()
  lyDoHuy!: string;
}

export class BookingResponseDto {
  id!: number;
  maLichHen!: string;
  taiKhoanId!: number;
  tenUser!: string;
  chuyenGiaDinhDuongId!: number;
  goiTuVanId!: number;
  tenGoiTuVan!: string;
  thoiLuongPhut!: number;
  ngayHen!: string;
  gioBatDau!: string;
  gioKetThuc!: string;
  diaDiem!: string | null;
  trangThai!: string;
  trangThaiThanhToan!: string | null;
  trangThaiPhanBoDoanhThu!: string | null;
  mucDich!: string | null;
  ghiChuNutritionist!: string | null;
  giaGoi!: number;
  hoaHongHeThong!: number;
  thuNhapDuKien!: number;
  thuNhapThucNhan!: number;
  refundStatus!: 'not_required' | 'success' | 'failed';
  refundMessage!: string | null;
  taLuc!: Date;
  capNhatLuc!: Date;
}
