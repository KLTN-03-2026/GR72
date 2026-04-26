import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export type RegisterRole = 'customer' | 'expert' | 'nguoi_dung' | 'chuyen_gia_dinh_duong';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['customer', 'expert', 'nguoi_dung', 'chuyen_gia_dinh_duong'])
  vaiTro!: RegisterRole;

  @IsString()
  @IsNotEmpty({ message: 'Ho ten khong duoc de trong' })
  @MaxLength(150)
  hoTen!: string;

  @IsEmail({}, { message: 'Email khong hop le' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Mat khau phai co it nhat 8 ky tu' })
  matKhau!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  chuyenMon?: string;

  @IsOptional()
  @IsString()
  moTa?: string;
}

