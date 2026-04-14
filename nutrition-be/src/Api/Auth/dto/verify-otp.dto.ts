import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @IsString()
  @Length(6, 6, { message: 'Mã OTP phải có 6 chữ số' })
  maOtp!: string;
}
