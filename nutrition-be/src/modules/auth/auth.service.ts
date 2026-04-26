import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcrypt';
import { IsNull, Repository } from 'typeorm';
import {
  TaiKhoanEntity,
  type AccountRole,
} from '../shared/entities/tai-khoan.entity';
import { ChuyenGiaEntity } from '../shared/entities/chuyen-gia.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto, type RegisterRole } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

type SessionUser = {
  id: number;
  email: string;
  ho_ten: string;
  vai_tro: AccountRole;
  trang_thai: TaiKhoanEntity['trang_thai'];
};

function normalizeRole(role: RegisterRole): AccountRole {
  if (role === 'expert' || role === 'chuyen_gia_dinh_duong') {
    return 'expert';
  }

  return 'customer';
}

function generateResetCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

@Injectable()
export class AuthService {
  private readonly saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

  constructor(
    @InjectRepository(TaiKhoanEntity)
    private readonly accountRepository: Repository<TaiKhoanEntity>,
    @InjectRepository(ChuyenGiaEntity)
    private readonly expertRepository: Repository<ChuyenGiaEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.accountRepository.findOne({
      where: { email, xoa_luc: IsNull() },
    });

    if (existing) {
      throw new BadRequestException('Email da duoc su dung');
    }

    const now = new Date();
    const role = normalizeRole(dto.vaiTro);
    const account = await this.accountRepository.save(
      this.accountRepository.create({
        email,
        ho_ten: dto.hoTen.trim(),
        mat_khau_ma_hoa: await hash(dto.matKhau.trim(), this.saltRounds),
        vai_tro: role,
        trang_thai: 'hoat_dong',
        so_dien_thoai: null,
        ma_dat_lai_mat_khau: null,
        het_han_ma_dat_lai: null,
        dang_nhap_cuoi_luc: null,
        tao_luc: now,
        cap_nhat_luc: now,
        xoa_luc: null,
      }),
    );

    if (role === 'expert') {
      await this.expertRepository.save(
        this.expertRepository.create({
          tai_khoan_id: account.id,
          chuyen_mon: dto.chuyenMon ?? null,
          mo_ta: dto.moTa ?? null,
          kinh_nghiem: null,
          hoc_vi: null,
          chung_chi: null,
          anh_dai_dien_url: null,
          trang_thai: 'cho_duyet',
          nhan_booking: true,
          tao_luc: now,
          cap_nhat_luc: now,
        }),
      );
    }

    return {
      success: true,
      message: 'Dang ky tai khoan thanh cong',
      data: this.toSessionUser(account),
    };
  }

  async signIn(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const account = await this.accountRepository.findOne({
      where: { email, xoa_luc: IsNull() },
    });

    if (!account) {
      throw new UnauthorizedException('Email hoac mat khau khong dung');
    }

    const matched = await compare(dto.matKhau.trim(), account.mat_khau_ma_hoa);
    if (!matched) {
      throw new UnauthorizedException('Email hoac mat khau khong dung');
    }

    if (account.trang_thai !== 'hoat_dong') {
      throw new UnauthorizedException('Tai khoan khong o trang thai hoat dong');
    }

    account.dang_nhap_cuoi_luc = new Date();
    account.cap_nhat_luc = new Date();
    await this.accountRepository.save(account);

    const user = this.toSessionUser(account);
    const accessToken = await this.jwtService.signAsync(
      {
        sub: account.id,
        email: account.email,
        vai_tro: account.vai_tro,
      },
      {
        secret: process.env.JWT_SECRET ?? 'nutrition-secret',
        expiresIn: '7d',
      },
    );

    return { accessToken, user };
  }

  signOut() {
    return {
      success: true,
      message: 'Dang xuat thanh cong',
      data: null,
    };
  }

  async getMe(userId?: number) {
    if (!userId) {
      throw new UnauthorizedException('Ban chua dang nhap');
    }

    const account = await this.accountRepository.findOne({
      where: { id: userId, xoa_luc: IsNull() },
    });

    if (!account) {
      throw new UnauthorizedException('Phien dang nhap khong hop le');
    }

    return {
      success: true,
      message: 'Lay thong tin dang nhap thanh cong',
      data: this.toSessionUser(account),
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const account = await this.accountRepository.findOne({
      where: { email, xoa_luc: IsNull() },
    });

    if (account) {
      account.ma_dat_lai_mat_khau = generateResetCode();
      account.het_han_ma_dat_lai = new Date(Date.now() + 15 * 60 * 1000);
      account.cap_nhat_luc = new Date();
      await this.accountRepository.save(account);
    }

    return {
      success: true,
      message: 'Neu email ton tai, he thong da tao ma dat lai mat khau',
      data: null,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const account = await this.accountRepository.findOne({
      where: {
        email: dto.email.trim().toLowerCase(),
        xoa_luc: IsNull(),
      },
    });

    if (
      !account ||
      !account.ma_dat_lai_mat_khau ||
      account.ma_dat_lai_mat_khau !== dto.maDatLai.trim().toUpperCase() ||
      !account.het_han_ma_dat_lai ||
      account.het_han_ma_dat_lai.getTime() < Date.now()
    ) {
      throw new BadRequestException('Ma dat lai mat khau khong hop le');
    }

    account.mat_khau_ma_hoa = await hash(
      dto.matKhauMoi.trim(),
      this.saltRounds,
    );
    account.ma_dat_lai_mat_khau = null;
    account.het_han_ma_dat_lai = null;
    account.cap_nhat_luc = new Date();
    await this.accountRepository.save(account);

    return {
      success: true,
      message: 'Dat lai mat khau thanh cong',
      data: null,
    };
  }

  private toSessionUser(account: TaiKhoanEntity): SessionUser {
    return {
      id: Number(account.id),
      email: account.email,
      ho_ten: account.ho_ten,
      vai_tro: account.vai_tro,
      trang_thai: account.trang_thai,
    };
  }
}
