import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { AUTH_COOKIE_NAME } from '../../common/constants/auth.constants';
import { Public } from '../../common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(body);

    response.cookie(AUTH_COOKIE_NAME, result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.COOKIE_SECURE === 'true',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      success: true,
      message: 'Dang nhap thanh cong',
      data: {
        user: result.user,
      },
    };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.COOKIE_SECURE === 'true',
      path: '/',
    });

    return this.authService.logout();
  }

  @Get('me')
  getMe(@Req() request: Request & { user?: unknown }) {
    return {
      success: true,
      message: 'Lay thong tin dang nhap thanh cong',
      data: request.user ?? null,
    };
  }
}
