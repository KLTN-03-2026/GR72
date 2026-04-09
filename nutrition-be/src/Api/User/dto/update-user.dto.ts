import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { USER_ROLES, USER_STATUSES } from '../user.types';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  hoTen?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @IsIn(USER_ROLES)
  vaiTro?: string;

  @IsOptional()
  @IsString()
  @IsIn(USER_STATUSES)
  trangThai?: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
