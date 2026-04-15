import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import type { SignOptions } from 'jsonwebtoken';
import { DataSource, EntityManager, IsNull, Repository } from 'typeorm';
import { OtpEntity } from './entities/otp.entity';
import { HoSoEntity } from '../Admin/User/entities/ho-so.entity';
import { MucTieuEntity } from '../Admin/User/entities/muc-tieu.entity';
import { TaiKhoanEntity } from '../Admin/User/entities/tai-khoan.entity';
import { EmailService } from '../../common/email/email.service';
import {
  ChuyenGiaDinhDuongEntity,
  RegistrationPaymentStatus,
} from '../Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import type { PackageStatus } from '../Admin/Package/entities/goi-dich-vu.entity';
import { DangKyGoiDichVuEntity } from '../Admin/Subscription/entities/dang-ky-goi-dich-vu.entity';
import { GoiDichVuEntity } from '../Admin/Package/entities/goi-dich-vu.entity';
import { generatePaymentUrl } from '../../common/vnpay/vnpay.util';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

type OnboardingStep = 'ho_so' | 'muc_tieu' | null;

type AuthenticatedUserPayload = {
  id: number;
  email: string;
  ho_ten: string;
  vai_tro: TaiKhoanEntity['vai_tro'];
  trang_thai: TaiKhoanEntity['trang_thai'];
  onboarding_completed: boolean;
  onboarding_step: OnboardingStep;
  redirect_to: string;
};

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
  private readonly registrationFee = Number(
    process.env.NUTRITIONIST_REGISTRATION_FEE ?? 500000,
  );

  constructor(
    @InjectRepository(TaiKhoanEntity)
    private readonly userRepository: Repository<TaiKhoanEntity>,
    @InjectRepository(HoSoEntity)
    private readonly hoSoRepository: Repository<HoSoEntity>,
    @InjectRepository(MucTieuEntity)
    private readonly goalRepository: Repository<MucTieuEntity>,
    @InjectRepository(OtpEntity)
    private readonly otpRepository: Repository<OtpEntity>,
    private readonly dataSource: DataSource,
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

    const isPasswordMatched = await this.comparePassword(
      password,
      user.mat_khau_ma_hoa,
    );

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
    const sessionUser = await this.buildAuthenticatedUser(user);

    return {
      accessToken,
      user: sessionUser,
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

  async getMe(userId?: number) {
    if (!userId) {
      throw new UnauthorizedException('Ban chua dang nhap');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, xoa_luc: IsNull() },
    });

    if (!user) {
      throw new UnauthorizedException('Phien dang nhap khong hop le');
    }

    return {
      success: true,
      message: 'Lấy thông tin đăng nhập thành công',
      data: await this.buildAuthenticatedUser(user),
    };
  }

  // =============================================
  // REGISTER
  // =============================================
  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const hoTen = dto.hoTen.trim();
    const matKhau = dto.matKhau.trim();
    const requestedRole =
      dto.vaiTro === 'chuyen_gia_dinh_duong'
        ? 'chuyen_gia_dinh_duong'
        : 'nguoi_dung';
    const isNutritionistRegistration =
      requestedRole === 'chuyen_gia_dinh_duong';

    const existing = await this.userRepository.findOne({
      where: { email, xoa_luc: IsNull() },
    });

    if (existing) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    const now = new Date();
    const passwordHash = await this.hashPassword(matKhau);

    const registrationResult = await this.dataSource.transaction(
      async (manager) => {
        const savedUser = await manager.save(
          TaiKhoanEntity,
          manager.create(TaiKhoanEntity, {
            email,
            ho_ten: hoTen,
            mat_khau_ma_hoa: passwordHash,
            vai_tro: requestedRole,
            trang_thai: isNutritionistRegistration
              ? 'khong_hoat_dong'
              : 'hoat_dong',
            ma_dat_lai_mat_khau: null,
            het_han_ma_dat_lai: null,
            dang_nhap_cuoi_luc: null,
            tao_luc: now,
            cap_nhat_luc: now,
            xoa_luc: null,
          }),
        );

        await manager.save(
          HoSoEntity,
          manager.create(HoSoEntity, {
            tai_khoan_id: savedUser.id,
            tao_luc: now,
            cap_nhat_luc: now,
          }),
        );

        let paymentUrl: string | null = null;

        if (isNutritionistRegistration) {
          const savedProfile = await manager.save(
            ChuyenGiaDinhDuongEntity,
            manager.create(ChuyenGiaDinhDuongEntity, {
              tai_khoan_id: savedUser.id,
              chuyen_mon: dto.chuyenMon ?? null,
              mo_ta: dto.moTa ?? null,
              kinh_nghiem: dto.kinhNghiem ?? null,
              hoc_vi: dto.hocVi ?? null,
              chung_chi: dto.chungChi ?? null,
              gio_lam_viec: dto.gioLamViec ?? null,
              anh_dai_dien_url: dto.anhDaiDienUrl ?? null,
              trang_thai: 'cho_duyet',
              trang_thai_thanh_toan:
                'dang_cho_thanh_toan' as RegistrationPaymentStatus,
              tao_luc: now,
              cap_nhat_luc: now,
            }),
          );

          const payment = this.createPaymentUrl(savedProfile.id);
          savedProfile.vnp_txn_ref = payment.txnRef;
          savedProfile.cap_nhat_luc = now;
          await manager.save(ChuyenGiaDinhDuongEntity, savedProfile);
          paymentUrl = payment.paymentUrl;
        } else {
          await this.grantFreePackage(savedUser.id, manager, now);
        }

        return { savedUser, paymentUrl };
      },
    );

    const { savedUser, paymentUrl } = registrationResult;

    if (!isNutritionistRegistration) {
      try {
        await this.emailService.sendWelcome(email, hoTen);
      } catch {
        // Không ảnh hưởng luồng đăng ký nếu gửi email thất bại
      }
    }

    return {
      success: true,
      message: isNutritionistRegistration
        ? 'Đăng ký tài khoản thành công. Vui lòng thanh toán phí đăng ký.'
        : 'Đăng ký tài khoản thành công',
      data: {
        id: savedUser.id,
        email: savedUser.email,
        ho_ten: savedUser.ho_ten,
        vai_tro: savedUser.vai_tro,
        trang_thai: savedUser.trang_thai,
        trang_thai_thanh_toan: isNutritionistRegistration
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

    const resetCode = generateResetCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

    user.ma_dat_lai_mat_khau = resetCode;
    user.het_han_ma_dat_lai = expiresAt;
    user.cap_nhat_luc = now;
    await this.userRepository.save(user);

    await this.otpRepository.update(
      { email, loai: 'dat_lai_mat_khau', da_su_dung: false },
      { da_su_dung: true },
    );

    try {
      await this.emailService.sendPasswordReset(email, resetCode);
    } catch {
      user.ma_dat_lai_mat_khau = null;
      user.het_han_ma_dat_lai = null;
      user.cap_nhat_luc = new Date();
      await this.userRepository.save(user);
      throw new InternalServerErrorException(
        'Khong the gui email dat lai mat khau luc nay',
      );
    }

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
    const maDatLai = dto.maDatLai.trim().toUpperCase();

    const user = await this.userRepository.findOne({
      where: { email, xoa_luc: IsNull() },
    });

    if (!user) {
      throw new BadRequestException('Tài khoản không tồn tại');
    }

    if (!user.ma_dat_lai_mat_khau || user.ma_dat_lai_mat_khau !== maDatLai) {
      throw new BadRequestException(
        'Mã đặt lại không hợp lệ hoặc đã được sử dụng',
      );
    }

    if (!user.het_han_ma_dat_lai || new Date() > user.het_han_ma_dat_lai) {
      throw new BadRequestException('Mã đặt lại đã hết hạn');
    }

    user.mat_khau_ma_hoa = await this.hashPassword(matKhauMoi);
    user.ma_dat_lai_mat_khau = null;
    user.het_han_ma_dat_lai = null;
    user.cap_nhat_luc = new Date();
    await this.userRepository.save(user);

    await this.otpRepository.update(
      { email, loai: 'dat_lai_mat_khau', da_su_dung: false },
      { da_su_dung: true },
    );

    return {
      success: true,
      message: 'Đặt lại mật khẩu thành công',
      data: null,
    };
  }

  // =============================================
  // SEND OTP
  // =============================================
  async sendOtp(
    email: string,
    loai: 'xac_thuc' | 'dat_lai_mat_khau' = 'xac_thuc',
  ) {
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
        expiresIn: (process.env.JWT_EXPIRES_IN ??
          '7d') as SignOptions['expiresIn'],
      },
    );
  }

  private async hashPassword(password: string): Promise<string> {
    return hash(password, this.saltRounds);
  }

  private async comparePassword(
    plain: string,
    hashed: string,
  ): Promise<boolean> {
    const { compare } = await import('bcrypt');
    return compare(plain, hashed);
  }

  private createPaymentUrl(profileId: number): {
    paymentUrl: string;
    txnRef: string;
  } {
    const txnRef = `${profileId}_${Date.now()}`;

    return {
      txnRef,
      paymentUrl: generatePaymentUrl({
        amount: this.registrationFee,
        orderDescription: `Phi dang ky Chuyen gia Dinh duong #${profileId}`,
        orderType: 'billpayment',
        txnRef,
      }),
    };
  }

  private async grantFreePackage(
    userId: number,
    manager: EntityManager = this.dataSource.manager,
    now: Date = new Date(),
  ) {
    const freePackage = await manager.findOne(GoiDichVuEntity, {
      where: {
        la_goi_mien_phi: true,
        trang_thai: 'dang_kinh_doanh' as PackageStatus,
        xoa_luc: IsNull(),
      },
      order: {
        thu_tu_hien_thi: 'ASC',
        id: 'ASC',
      },
    });

    if (!freePackage) {
      throw new BadRequestException(
        'He thong chua cau hinh goi mien phi mac dinh',
      );
    }

    await manager.save(
      DangKyGoiDichVuEntity,
      manager.create(DangKyGoiDichVuEntity, {
        tai_khoan_id: userId,
        goi_dich_vu_id: freePackage.id,
        ma_dang_ky: generateMaDangKy(),
        trang_thai: 'dang_hoat_dong' as any,
        ngay_bat_dau: now,
        ngay_het_han: this.resolveSubscriptionEndDate(
          now,
          freePackage.thoi_han_ngay,
        ),
        tu_dong_gia_han: false,
        nguon_dang_ky: 'khuyen_mai' as any,
        ghi_chu: 'Goi mien phi mac dinh duoc gan khi dang ky tai khoan.',
        tao_luc: now,
        cap_nhat_luc: now,
      }),
    );
  }

  private resolveSubscriptionEndDate(
    startDate: Date,
    durationDays: number | null,
  ): Date | null {
    if (!durationDays || durationDays <= 0) {
      return null;
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);
    return endDate;
  }

  private async buildAuthenticatedUser(
    user: TaiKhoanEntity,
  ): Promise<AuthenticatedUserPayload> {
    if (user.vai_tro !== 'nguoi_dung') {
      return {
        id: user.id,
        email: user.email,
        ho_ten: user.ho_ten,
        vai_tro: user.vai_tro,
        trang_thai: user.trang_thai,
        onboarding_completed: true,
        onboarding_step: null,
        redirect_to: this.getDefaultRedirectForRole(user.vai_tro),
      };
    }

    const [profile, activeGoal] = await Promise.all([
      this.hoSoRepository.findOne({
        where: { tai_khoan_id: user.id },
      }),
      this.goalRepository.findOne({
        where: {
          tai_khoan_id: user.id,
          trang_thai: 'dang_ap_dung',
        },
        order: {
          cap_nhat_luc: 'DESC',
          id: 'DESC',
        },
      }),
    ]);

    const onboardingStep = this.resolveOnboardingStep(profile, activeGoal);

    return {
      id: user.id,
      email: user.email,
      ho_ten: user.ho_ten,
      vai_tro: user.vai_tro,
      trang_thai: user.trang_thai,
      onboarding_completed: onboardingStep === null,
      onboarding_step: onboardingStep,
      redirect_to:
        onboardingStep === 'ho_so'
          ? '/nutrition/profile'
          : onboardingStep === 'muc_tieu'
            ? '/nutrition/goals'
            : '/nutrition/dashboard',
    };
  }

  private resolveOnboardingStep(
    profile: HoSoEntity | null,
    activeGoal: MucTieuEntity | null,
  ): OnboardingStep {
    const isProfileCompleted =
      !!profile &&
      profile.gioi_tinh !== null &&
      profile.ngay_sinh !== null &&
      profile.chieu_cao_cm !== null &&
      profile.can_nang_hien_tai_kg !== null &&
      profile.muc_do_van_dong !== null;

    if (!isProfileCompleted) {
      return 'ho_so';
    }

    if (!activeGoal) {
      return 'muc_tieu';
    }

    return null;
  }

  private getDefaultRedirectForRole(role: TaiKhoanEntity['vai_tro']): string {
    switch (role) {
      case 'quan_tri':
        return '/admin/users';
      case 'chuyen_gia_dinh_duong':
        return '/nutritionist/dashboard';
      case 'nguoi_dung':
      default:
        return '/nutrition/dashboard';
    }
  }
}
