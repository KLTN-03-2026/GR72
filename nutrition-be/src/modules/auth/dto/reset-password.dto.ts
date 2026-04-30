import { IsEmail, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Email khong hop le' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Mat khau moi phai co it nhat 8 ky tu' })
  matKhauMoi!: string;

  @IsString()
  @MinLength(8, { message: 'Xac nhan mat khau phai co it nhat 8 ky tu' })
  xacNhanMatKhau!: string;
}
