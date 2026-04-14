import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import type { SignOptions } from 'jsonwebtoken';
import { IsNull, Repository } from 'typeorm';
import { OtpEntity } from './entities/otp.entity';
import { HoSoEntity } from '../Admin/User/entities/ho-so.entity';
import { TaiKhoanEntity } from '../Admin/User/entities/tai-khoan.entity';
import { ThongBaoEntity } from '../Admin/FoodReview/entities/thong-bao.entity';
import { EmailService } from '../../common/email/email.service';
import {
  ChuyenGiaDinhDuongEntity,
  RegistrationPaymentStatus,
} from '../Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import { DangKyGoiDichVuEntity } from '../Admin/Subscription/entities/dang-ky-goi-dich-vu.entity';
import { GoiDichVuEntity } from '../Admin/Package/entities/goi-dich-vu.entity';
import { generatePaymentUrl } from '../../common/vnpay/vnpay.util';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateResetCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

function generateMaDangKy(): string {
  return `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}

@Injectable()
export class AuthService {
  private readonly saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
  private readonly registrationFee = Number(process.env.NUTRITIONIST_REGISTRATION_FEE ?? 500000);

  constructor(
    @InjectRepository(TaiKhoanEntity)
    private readonly userRepository: Repository<TaiKhoanEntity>,
    @InjectRepository(HoSoEntity)
    private readonly hoSoRepository: Repository<HoSoEntity>,
    @InjectRepository(OtpEntity)
    private readonly otpRepository: Repository<OtpEntity>,
    @InjectRepository(ChuyenGiaDinhDuongEntity)
    private readonly cgRepo: Repository<ChuyenGiaDinhDuongEntity>,
    @InjectRepository(ThongBaoEntity)
    private readonly notifRepo: Repository<ThongBaoEntity>,
    @InjectRepository(DangKyGoiDichVuEntity)
    private readonly subscriptionRepo: Repository<DangKyGoiDichVuEntity>,
    @InjectRepository(GoiDichVuEntity)
    private readonly packageRepo: Repository<GoiDichVuEntity>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  // =============================================
  // SIGN IN
  // =============================================
  async signIn(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const password = dto.matKhau.trim();

    const user = await this.userRepository.findOne({
      where: { email, xoa_luc: IsNull() },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const isPasswordMatched = await this.comparePassword(password, user.mat_khau_ma_hoa);

    if (!isPasswordMatched) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (user.trang_thai !== 'hoat_dong') {
      throw new UnauthorizedException('Tài khoản không ở trạng thái hoạt động');
    }

    user.dang_nhap_cuoi_luc = new Date();
    user.cap_nhat_luc = new Date();
    await this.userRepository.save(user);

    const accessToken = await this.signToken(user);

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

  // =============================================
  // SIGN OUT
  // =============================================
  signOut() {
    return {
      success: true,
      message: 'Đăng xuất thành công',
      data: null,
    };
  }

  // =============================================
  // REGISTER
  // =============================================
  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const hoTen = dto.hoTen.trim();
    const matKhau = dto.matKhau.trim();

    const existing = await this.userRepository.findOne({
      where: { email, xoa_luc: IsNull() },
    });

    if (existing) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    const now = new Date();
    const passwordHash = await this.hashPassword(matKhau);

    const savedUser = await this.userRepository.save(
      this.userRepository.create({
        email,
        ho_ten: hoTen,
        mat_khau_ma_hoa: passwordHash,
        vai_tro: dto.vaiTro,
        trang_thai: 'hoat_dong',
        ma_dat_lai_mat_khau: null,
        het_han_ma_dat_lai: null,
        dang_nhap_cuoi_luc: null,
        tao_luc: now,
        cap_nhat_luc: now,
        xoa_luc: null,
      }),
    );

    await this.hoSoRepository.save(
      this.hoSoRepository.create({
        tai_khoan_id: savedUser.id,
        tao_luc: now,
        cap_nhat_luc: now,
      }),
    );

    // Tự động cấp gói miễn phí cho user mới
    await this.grantFreePackage(savedUser.id);

    // Nếu đăng ký làm Nutritionist → tạo hồ sơ + redirect thanh toán
    let paymentUrl: string | null = null;
    if (dto.vaiTro === 'chuyen_gia_dinh_duong') {
      const profile = this.cgRepo.create({
        tai_khoan_id: savedUser.id,
        chuyen_mon: dto.chuyenMon ?? null,
        mo_ta: dto.moTa ?? null,
        kinh_nghiem: dto.kinhNghiem ?? null,
        hoc_vi: dto.hocVi ?? null,
        chung_chi: dto.chungChi ?? null,
        gio_lam_viec: dto.gioLamViec ?? null,
        anh_dai_dien_url: dto.anhDaiDienUrl ?? null,
        trang_thai: 'cho_duyet',
        trang_thai_thanh_toan: 'chua_thanh_toan' as RegistrationPaymentStatus,
        tao_luc: now,
        cap_nhat_luc: now,
      });
      const savedProfile = await this.cgRepo.save(profile);
      paymentUrl = this.createPaymentUrl(savedProfile.id);
    } else {
      try {
        await this.emailService.sendWelcome(email, hoTen);
      } catch {
        // Không ảnh hưởng luồng đăng ký nếu gửi email thất bại
      }
    }

    return {
      success: true,
      message: dto.vaiTro === 'chuyen_gia_dinh_duong'
        ? 'Đăng ký tài khoản thành công. Vui lòng thanh toán phí đăng ký.'
        : 'Đăng ký tài khoản thành công',
      data: {
        id: savedUser.id,
        email: savedUser.email,
        ho_ten: savedUser.ho_ten,
        vai_tro: savedUser.vai_tro,
        trang_thai: savedUser.trang_thai,
        trang_thai_thanh_toan: dto.vaiTro === 'chuyen_gia_dinh_duong'
          ? 'dang_cho_thanh_toan'
          : undefined,
      },
      ...(paymentUrl ? { payment_url: paymentUrl } : {}),
    };
  }

  // =============================================
  // FORGOT PASSWORD
  // =============================================
  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.userRepository.findOne({
      where: { email, xoa_luc: IsNull() },
    });

    if (!user) {
      return {
        success: true,
        message: 'Nếu email tồn tại, chúng tôi đã gửi mã đặt lại mật khẩu',
        data: null,
      };
    }

    await this.otpRepository.update(
      { email, loai: 'dat_lai_mat_khau', da_su_dung: false },
      { da_su_dung: true },
    );

    const resetCode = generateResetCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

    await this.otpRepository.save(
      this.otpRepository.create({
        email,
        ma_otp: resetCode,
        loai: 'dat_lai_mat_khau',
        da_su_dung: false,
        het_han_luc: expiresAt,
        tao_luc: now,
      }),
    );

    await this.emailService.sendPasswordReset(email, resetCode);

    return {
      success: true,
      message: 'Nếu email tồn tại, chúng tôi đã gửi mã đặt lại mật khẩu',
      data: null,
    };
  }

  // =============================================
  // RESET PASSWORD
  // =============================================
  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const matKhauMoi = dto.matKhauMoi.trim();
    const maDatLai = dto.maDatLai.trim();

    const otp = await this.otpRepository.findOne({
      where: {
        email,
        ma_otp: maDatLai,
        loai: 'dat_lai_mat_khau',
        da_su_dung: false,
      },
    });

    if (!otp) {
      throw new BadRequestException('Mã đặt lại không hợp lệ hoặc đã được sử dụng');
    }

    if (new Date() > otp.het_han_luc) {
      throw new BadRequestException('Mã đặt lại đã hết hạn');
    }

    const user = await this.userRepository.findOne({
      where: { email, xoa_luc: IsNull() },
    });

    if (!user) {
      throw new BadRequestException('Tài khoản không tồn tại');
    }

    user.mat_khau_ma_hoa = await this.hashPassword(matKhauMoi);
    user.cap_nhat_luc = new Date();
    await this.userRepository.save(user);

    await this.otpRepository.update(otp.id, { da_su_dung: true });

    return {
      success: true,
      message: 'Đặt lại mật khẩu thành công',
      data: null,
    };
  }

  // =============================================
  // SEND OTP
  // =============================================
  async sendOtp(email: string, loai: 'xac_thuc' | 'dat_lai_mat_khau' = 'xac_thuc') {
    const normalizedEmail = email.trim().toLowerCase();

    await this.otpRepository.update(
      { email: normalizedEmail, loai, da_su_dung: false },
      { da_su_dung: true },
    );

    const otpCode = generateOtp();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

    await this.otpRepository.save(
      this.otpRepository.create({
        email: normalizedEmail,
        ma_otp: otpCode,
        loai,
        da_su_dung: false,
        het_han_luc: expiresAt,
        tao_luc: now,
      }),
    );

    await this.emailService.sendOtp(normalizedEmail, otpCode);

    return {
      success: true,
      message: 'Đã gửi mã OTP đến email của bạn',
      data: null,
    };
  }

  // =============================================
  // VERIFY OTP
  // =============================================
  async verifyOtp(dto: VerifyOtpDto) {
    const email = dto.email.trim().toLowerCase();
    const maOtp = dto.maOtp.trim();

    const otp = await this.otpRepository.findOne({
      where: {
        email,
        ma_otp: maOtp,
        loai: 'xac_thuc',
        da_su_dung: false,
      },
    });

    if (!otp) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã được sử dụng');
    }

    if (new Date() > otp.het_han_luc) {
      throw new BadRequestException('Mã OTP đã hết hạn');
    }

    await this.otpRepository.update(otp.id, { da_su_dung: true });

    return {
      success: true,
      message: 'Xác thực OTP thành công',
      data: { email },
    };
  }

  // =============================================
  // RESEND OTP
  // =============================================
  async resendOtp(email: string) {
    return this.sendOtp(email, 'xac_thuc');
  }

  // =============================================
  // PRIVATE HELPERS
  // =============================================
  private async signToken(user: TaiKhoanEntity): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        ho_ten: user.ho_ten,
        vai_tro: user.vai_tro,
      },
      {
        secret: process.env.JWT_SECRET ?? 'nutrition-secret',
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'],
      },
    );
  }

  private async hashPassword(password: string): Promise<string> {
    return hash(password, this.saltRounds);
  }

  private async comparePassword(plain: string, hashed: string): Promise<boolean> {
    const { compare } = await import('bcrypt');
    return compare(plain, hashed);
  }

  private createPaymentUrl(profileId: number): string {
    return generatePaymentUrl(
      {
        amount: this.registrationFee,
        orderDescription: `Phi dang ky Chuyen gia Dinh duong #${profileId}`,
        orderType: 'billpayment',
      },
      profileId,
    );
  }

  private async notifyAdminsForRegistration(profileId: number, hoTen: string) {
    const admins = await this.userRepository.find({ where: { vai_tro: 'quan_tri' as any } });
    const now = new Date();
    const notifications = admins.map((admin) =>
      this.notifRepo.create({
        tai_khoan_id: admin.id,
        loai: 'dang_ky_nutritionist',
        tieu_de: 'Don dang ky chuyen gia dinh duong moi (dang ky tai khoan)',
        noi_dung: `Co don dang ky chuyen gia dinh duong #${profileId} (${hoTen}) can duyet. Nguoi dang ky da thanh toan phi. Vui long kiem tra trang thai thanh toan truoc khi duyet.`,
        trang_thai: 'chua_doc',
        duong_dan_hanh_dong: '/admin/nutritionist-registrations',
        tao_luc: now,
        cap_nhat_luc: now,
      }),
    );
    if (notifications.length > 0) {
      await this.notifRepo.save(notifications);
    }
  }

  private async grantFreePackage(userId: number) {
    try {
      const freePackage = await this.packageRepo.findOne({
        where: { la_goi_mien_phi: true, xoa_luc: IsNull() },
      });
      if (!freePackage) return;

      const existingActive = await this.subscriptionRepo.findOne({
        where: { tai_khoan_id: userId, trang_thai: 'dang_hoat_dong' as any },
      });
      if (existingActive) return;

      const now = new Date();

      await this.subscriptionRepo.save(
        this.subscriptionRepo.create({
          tai_khoan_id: userId,
          goi_dich_vu_id: freePackage.id,
          ma_dang_ky: generateMaDangKy(),
          trang_thai: 'dang_hoat_dong' as any,
          ngay_bat_dau: now,
          ngay_het_han: null,
          tu_dong_gia_han: false,
          nguon_dang_ky: 'nguoi_dung_tu_nang_cap' as any,
          ghi_chu: 'Goi mac dinh khi dang ky tai khoan.',
          tao_luc: now,
          cap_nhat_luc: now,
        }),
      );
    } catch {
      // Không ảnh hưởng luồng đăng ký nếu cấp gói thất bại
    }
  }
}
