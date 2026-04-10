import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

// Spec "quan-ly-tai-khoan.md" nói rõ:
// "Không bao gồm đổi role, đổi trạng thái và reset mật khẩu thủ công, vì đó là chức năng riêng."
// → Đã loại bỏ vaiTro và trangThai khỏi DTO này.
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  hoTen?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
