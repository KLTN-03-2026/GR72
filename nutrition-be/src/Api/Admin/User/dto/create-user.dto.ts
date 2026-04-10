import { IsEmail, IsIn, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { USER_ROLES, USER_STATUSES } from '../user.types';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  hoTen!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  matKhau!: string;

  @IsString()
  @IsIn(USER_ROLES)
  vaiTro!: string;

  @IsString()
  @IsIn(USER_STATUSES)
  trangThai!: string;
}
