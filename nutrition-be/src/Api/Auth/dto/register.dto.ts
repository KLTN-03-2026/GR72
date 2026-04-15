import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Loại tài khoản không được để trống' })
  @IsIn(['nguoi_dung', 'chuyen_gia_dinh_duong'], {
    message: 'Loại tài khoản không hợp lệ',
  })
  vaiTro!: 'nguoi_dung' | 'chuyen_gia_dinh_duong';

  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @MaxLength(150)
  hoTen!: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  matKhau!: string;

  // ====== Nutritionist fields (required only when vaiTro = 'chuyen_gia_dinh_duong') ======

  @ValidateIf((o) => o.vaiTro === 'chuyen_gia_dinh_duong')
  @IsString()
  @IsNotEmpty({ message: 'Chuyên môn không được để trống' })
  @MaxLength(500)
  chuyenMon?: string;

  @IsOptional()
  @IsString()
  moTa?: string;

  @IsOptional()
  @IsString()
  kinhNghiem?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  hocVi?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  chungChi?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  gioLamViec?: string;

  @ValidateIf((o) => !!o.anhDaiDienUrl && o.anhDaiDienUrl.trim() !== '')
  @IsUrl({}, { message: 'Avatar URL không hợp lệ' })
  @IsOptional()
  anhDaiDienUrl?: string;
}
