import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { USER_ROLES, USER_STATUSES } from '../user.types';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  hoTen!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  password!: string;

  @IsString()
  @IsIn(USER_ROLES)
  vaiTro!: string;

  @IsString()
  @IsIn(USER_STATUSES)
  trangThai!: string;
}
