import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { AUTH_COOKIE_NAME } from '../../common/constants/auth.constants';
import { Public } from '../../common/decorators/public.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // =============================================
  // POST /auth/sign-up
  // =============================================
  @Public()
  @Post('sign-up')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  // =============================================
  // POST /auth/sign-in
  // =============================================
  @Public()
  @Post('sign-in')
  async signIn(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.signIn(body);

    response.cookie(AUTH_COOKIE_NAME, result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.COOKIE_SECURE === 'true',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      success: true,
      message: 'Đăng nhập thành công',
      data: { user: result.user },
    };
  }

  // =============================================
  // POST /auth/sign-out
  // =============================================
  @Post('sign-out')
  async signOut(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.COOKIE_SECURE === 'true',
      path: '/',
    });

    return this.authService.signOut();
  }

  // =============================================
  // GET /auth/me
  // =============================================
  @Get('me')
  async getMe(@Req() request: Request & { user?: { sub?: number } }) {
    return this.authService.getMe(request.user?.sub);
  }

  // =============================================
  // POST /auth/forgot-password
  // =============================================
  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body);
  }

  // =============================================
  // POST /auth/reset-password
  // =============================================
  @Public()
  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  // =============================================
  // POST /auth/send-otp
  // =============================================
  @Public()
  @Post('send-otp')
  async sendOtp(
    @Body() body: { email: string; loai?: 'xac_thuc' | 'dat_lai_mat_khau' },
  ) {
    return this.authService.sendOtp(body.email, body.loai ?? 'xac_thuc');
  }

  // =============================================
  // POST /auth/verify-otp
  // =============================================
  @Public()
  @Post('verify-otp')
  async verifyOtp(@Body() body: VerifyOtpDto) {
    return this.authService.verifyOtp(body);
  }

  // =============================================
  // POST /auth/resend-otp
  // =============================================
  @Public()
  @Post('resend-otp')
  async resendOtp(@Body() body: { email: string }) {
    return this.authService.resendOtp(body.email);
  }
}
