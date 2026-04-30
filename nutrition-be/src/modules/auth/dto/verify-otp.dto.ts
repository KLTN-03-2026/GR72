import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Email khong hop le' })
  email!: string;

  @IsString()
  @Length(6, 6, { message: 'OTP phai gom 6 chu so' })
  @Matches(/^\d{6}$/, { message: 'OTP phai gom 6 chu so' })
  otp!: string;
}
