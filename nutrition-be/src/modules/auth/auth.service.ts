import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcrypt';
import { IsNull, Repository } from 'typeorm';
import { EmailService } from '../../common/email/email.service';
import {
  TaiKhoanEntity,
  type AccountRole,
} from '../shared/entities/tai-khoan.entity';
import { ChuyenGiaEntity } from '../shared/entities/chuyen-gia.entity';
import { OtpEntity } from '../shared/entities/otp.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto, type RegisterRole } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

type SessionUser = {
  id: number;
  email: string;
  ho_ten: string;
  vai_tro: AccountRole;
  trang_thai: TaiKhoanEntity['trang_thai'];
};

type AuthSession = {
  accessToken: string;
  user: SessionUser;
};

function normalizeRole(role: RegisterRole): AccountRole {
  if (role === 'expert' || role === 'chuyen_gia_dinh_duong') {
    return 'expert';
  }

  return 'customer';
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

@Injectable()
export class AuthService {
  private readonly saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

  constructor(
    @InjectRepository(TaiKhoanEntity)
    private readonly accountRepository: Repository<TaiKhoanEntity>,
    @InjectRepository(ChuyenGiaEntity)
    private readonly expertRepository: Repository<ChuyenGiaEntity>,
    @InjectRepository(OtpEntity)
    private readonly otpRepository: Repository<OtpEntity>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthSession> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.accountRepository.findOne({
      where: { email, xoa_luc: IsNull() },
    });

    if (existing) {
      throw new BadRequestException('Email da duoc su dung');
    }

    if (dto.matKhau !== dto.xacNhanMatKhau) {
      throw new BadRequestException('Xac nhan mat khau khong khop');
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
          chuyen_mon: dto.chuyenMon?.trim() || null,
          mo_ta: dto.moTa?.trim() || null,
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

    return this.createAuthSession(account);
  }

  async signIn(dto: LoginDto): Promise<AuthSession> {
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

    return this.createAuthSession(account);
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
      await this.otpRepository.update(
        { email, loai: 'dat_lai_mat_khau', da_su_dung: false },
        { da_su_dung: true },
      );

      const otp = generateOtp();
      await this.otpRepository.save(
        this.otpRepository.create({
          email,
          ma_otp: await hash(otp, this.saltRounds),
          loai: 'dat_lai_mat_khau',
          da_su_dung: false,
          het_han_luc: new Date(Date.now() + 10 * 60 * 1000),
          tao_luc: new Date(),
        }),
      );

      await this.emailService.sendOtp(email, otp);
    }

    return {
      success: true,
      message: 'Neu email ton tai, he thong da gui ma OTP dat lai mat khau',
      data: null,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const email = dto.email.trim().toLowerCase();
    const account = await this.accountRepository.findOne({
      where: { email, xoa_luc: IsNull() },
    });

    if (!account) {
      throw new BadRequestException('OTP khong hop le hoac da het han');
    }

    const otp = await this.otpRepository.findOne({
      where: { email, loai: 'dat_lai_mat_khau', da_su_dung: false },
      order: { tao_luc: 'DESC' },
    });

    if (!otp || otp.het_han_luc.getTime() < Date.now()) {
      throw new BadRequestException('OTP khong hop le hoac da het han');
    }

    const matched = await compare(dto.otp.trim(), otp.ma_otp);
    if (!matched) {
      throw new BadRequestException('OTP khong hop le hoac da het han');
    }

    otp.da_su_dung = true;
    await this.otpRepository.save(otp);

    const resetToken = await this.jwtService.signAsync(
      {
        sub: account.id,
        email: account.email,
        purpose: 'password_reset',
      },
      {
        secret: process.env.JWT_SECRET ?? 'nutrition-secret',
        expiresIn: '10m',
      },
    );

    return {
      success: true,
      message: 'Xac minh OTP thanh cong',
      data: { resetToken },
    };
  }

  async resetPassword(dto: ResetPasswordDto, resetToken?: string) {
    if (dto.matKhauMoi !== dto.xacNhanMatKhau) {
      throw new BadRequestException('Xac nhan mat khau khong khop');
    }

    if (!resetToken) {
      throw new UnauthorizedException('Phien dat lai mat khau khong hop le');
    }

    let payload: { sub?: number; email?: string; purpose?: string };
    try {
      payload = await this.jwtService.verifyAsync(resetToken, {
        secret: process.env.JWT_SECRET ?? 'nutrition-secret',
      });
    } catch {
      throw new UnauthorizedException('Phien dat lai mat khau khong hop le');
    }

    if (
      payload.purpose !== 'password_reset' ||
      payload.email !== dto.email.trim().toLowerCase()
    ) {
      throw new UnauthorizedException('Phien dat lai mat khau khong hop le');
    }

    const account = await this.accountRepository.findOne({
      where: { id: Number(payload.sub), email: payload.email, xoa_luc: IsNull() },
    });

    if (!account) {
      throw new UnauthorizedException('Phien dat lai mat khau khong hop le');
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

  private async createAuthSession(account: TaiKhoanEntity): Promise<AuthSession> {
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
