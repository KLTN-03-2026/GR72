import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  AUTH_COOKIE_NAME,
  RESET_PASSWORD_COOKIE_NAME,
} from '../../common/constants/auth.constants';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('sign-up')
  async signUp(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(body);
    this.setAuthCookie(response, result.accessToken);

    return {
      success: true,
      message: 'Dang ky tai khoan thanh cong',
      data: { user: result.user },
    };
  }

  @Public()
  @Post('register')
  register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.signUp(body, response);
  }

  @Public()
  @Post('sign-in')
  async signIn(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.signIn(body);
    this.setAuthCookie(response, result.accessToken);

    return {
      success: true,
      message: 'Dang nhap thanh cong',
      data: { user: result.user },
    };
  }

  @Public()
  @Post('login')
  login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.signIn(body, response);
  }

  @Post('sign-out')
  signOut(@Res({ passthrough: true }) response: Response) {
    this.clearCookie(response, AUTH_COOKIE_NAME);
    return this.authService.signOut();
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    return this.signOut(response);
  }

  @Get('me')
  getMe(@Req() request: Request & { user?: { sub?: number } }) {
    return this.authService.getMe(request.user?.sub);
  }

  @Public()
  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body);
  }

  @Public()
  @Post('verify-otp')
  async verifyOtp(
    @Body() body: VerifyOtpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.verifyOtp(body);
    response.cookie(RESET_PASSWORD_COOKIE_NAME, result.data.resetToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.COOKIE_SECURE === 'true',
      maxAge: 10 * 60 * 1000,
      path: '/',
    });

    return {
      success: true,
      message: result.message,
      data: null,
    };
  }

  @Public()
  @Post('reset-password')
  async resetPassword(
    @Body() body: ResetPasswordDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.resetPassword(
      body,
      request.cookies?.[RESET_PASSWORD_COOKIE_NAME],
    );
    this.clearCookie(response, RESET_PASSWORD_COOKIE_NAME);

    return result;
  }

  private setAuthCookie(response: Response, accessToken: string) {
    response.cookie(AUTH_COOKIE_NAME, accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.COOKIE_SECURE === 'true',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  private clearCookie(response: Response, name: string) {
    response.clearCookie(name, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.COOKIE_SECURE === 'true',
      path: '/',
    });
  }
}
