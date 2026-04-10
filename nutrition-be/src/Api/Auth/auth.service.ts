import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare } from 'bcrypt';
import type { SignOptions } from 'jsonwebtoken';
import { IsNull, Repository } from 'typeorm';
import { TaiKhoanEntity } from '../Admin/User/entities/tai-khoan.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(TaiKhoanEntity)
    private readonly userRepository: Repository<TaiKhoanEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const password = dto.password.trim();

    const user = await this.userRepository.findOne({
      where: {
        email,
        xoa_luc: IsNull(),
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoac mat khau khong dung');
    }

    const isPasswordMatched = await compare(password, user.mat_khau_ma_hoa);

    if (!isPasswordMatched) {
      throw new UnauthorizedException('Email hoac mat khau khong dung');
    }

    if (user.trang_thai !== 'hoat_dong') {
      throw new UnauthorizedException('Tai khoan khong o trang thai hoat dong');
    }

    user.dang_nhap_cuoi_luc = new Date();
    user.cap_nhat_luc = new Date();
    await this.userRepository.save(user);

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        vai_tro: user.vai_tro,
      },
      {
        secret: process.env.JWT_SECRET ?? 'nutrition-secret',
        expiresIn: (process.env.JWT_EXPIRES_IN ??
          '7d') as SignOptions['expiresIn'],
      },
    );

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        ho_ten: user.ho_ten,
        vai_tro: user.vai_tro,
        trang_thai: user.trang_thai,
      },
    };
  }

  logout() {
    return {
      success: true,
      message: 'Dang xuat thanh cong',
      data: null,
    };
  }
}
