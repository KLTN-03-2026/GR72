import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ThongBaoEntity } from '../../Admin/FoodReview/entities/thong-bao.entity';
import { HoSoEntity } from '../../Admin/User/entities/ho-so.entity';
import { MucTieuEntity } from '../../Admin/User/entities/muc-tieu.entity';
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';
import { ChiSoSucKhoeEntity } from '../HealthAssessment/entities/chi-so-suc-khoe.entity';
import { DanhGiaSucKhoeEntity } from '../HealthAssessment/entities/danh-gia-suc-khoe.entity';
import { TongHopDinhDuongNgayEntity } from '../MealLog/entities/nhat-ky-bua-an.entity';
import { KhuyenNghiAiEntity } from '../Recommendation/entities/khuyen-nghi-ai.entity';

type OnboardingStep = 'ho_so' | 'muc_tieu' | null;

@Injectable()
export class UserDashboardService {
  constructor(
    @InjectRepository(TaiKhoanEntity)
    private readonly userRepository: Repository<TaiKhoanEntity>,
    @InjectRepository(HoSoEntity)
    private readonly profileRepository: Repository<HoSoEntity>,
    @InjectRepository(MucTieuEntity)
    private readonly goalRepository: Repository<MucTieuEntity>,
    @InjectRepository(ChiSoSucKhoeEntity)
    private readonly metricRepository: Repository<ChiSoSucKhoeEntity>,
    @InjectRepository(DanhGiaSucKhoeEntity)
    private readonly assessmentRepository: Repository<DanhGiaSucKhoeEntity>,
    @InjectRepository(TongHopDinhDuongNgayEntity)
    private readonly nutritionSummaryRepository: Repository<TongHopDinhDuongNgayEntity>,
    @InjectRepository(KhuyenNghiAiEntity)
    private readonly recommendationRepository: Repository<KhuyenNghiAiEntity>,
    @InjectRepository(ThongBaoEntity)
    private readonly notificationRepository: Repository<ThongBaoEntity>,
  ) {}

  async getLatestAssessment(userId?: number) {
    const user = await this.getActiveUser(userId);
    const assessment = await this.assessmentRepository.findOne({
      where: { tai_khoan_id: user.id },
      order: { tao_luc: 'DESC', id: 'DESC' },
    });

    return {
      success: true,
      message: 'Lấy đánh giá sức khỏe mới nhất thành công',
      data: assessment ? this.toAssessmentResponse(assessment) : null,
    };
  }

  async getDashboard(userId?: number) {
    const user = await this.getActiveUser(userId);

    const [profile, currentGoal, latestAssessment, latestMetric, recentMetrics, unreadNotifications, nutritionToday, latestRecommendation] =
      await Promise.all([
        this.profileRepository.findOne({
          where: { tai_khoan_id: user.id },
        }),
        this.goalRepository.findOne({
          where: { tai_khoan_id: user.id, trang_thai: 'dang_ap_dung' },
          order: { cap_nhat_luc: 'DESC', id: 'DESC' },
        }),
        this.assessmentRepository.findOne({
          where: { tai_khoan_id: user.id },
          order: { tao_luc: 'DESC', id: 'DESC' },
        }),
        this.metricRepository.findOne({
          where: { tai_khoan_id: user.id },
          order: { do_luc: 'DESC', id: 'DESC' },
        }),
        this.metricRepository.find({
          where: { tai_khoan_id: user.id },
          order: { do_luc: 'DESC', id: 'DESC' },
          take: 12,
        }),
        this.notificationRepository.count({
          where: { tai_khoan_id: user.id, trang_thai: 'chua_doc' },
        }),
        this.getNutritionSummaryForToday(user.id),
        this.getLatestRecommendation(user.id),
      ]);

    const onboardingStep = this.resolveOnboardingStep(profile, currentGoal);
    const recentWeights = recentMetrics
      .filter((metric) => metric.can_nang_kg !== null)
      .map((metric) => ({
        do_luc: metric.do_luc,
        can_nang_kg: Number(metric.can_nang_kg),
      }))
      .reverse();

    return {
      success: true,
      message: 'Lấy dashboard người dùng thành công',
      data: {
        onboarding_completed: onboardingStep === null,
        onboarding_step: onboardingStep,
        redirect_to:
          onboardingStep === 'ho_so'
            ? '/nutrition/profile'
            : onboardingStep === 'muc_tieu'
              ? '/nutrition/goals'
              : '/nutrition/dashboard',
        thieu_du_lieu: this.collectMissingData(profile, currentGoal, latestAssessment),
        ho_so_tom_tat: profile
          ? {
              gioi_tinh: profile.gioi_tinh,
              ngay_sinh: profile.ngay_sinh,
              chieu_cao_cm: profile.chieu_cao_cm
                ? Number(profile.chieu_cao_cm)
                : null,
              can_nang_hien_tai_kg: profile.can_nang_hien_tai_kg
                ? Number(profile.can_nang_hien_tai_kg)
                : null,
              muc_do_van_dong: profile.muc_do_van_dong,
            }
          : null,
        muc_tieu_hien_tai: currentGoal
          ? {
              id: currentGoal.id,
              loai_muc_tieu: currentGoal.loai_muc_tieu,
              trang_thai: currentGoal.trang_thai,
              can_nang_bat_dau_kg: currentGoal.can_nang_bat_dau_kg
                ? Number(currentGoal.can_nang_bat_dau_kg)
                : null,
              can_nang_muc_tieu_kg: currentGoal.can_nang_muc_tieu_kg
                ? Number(currentGoal.can_nang_muc_tieu_kg)
                : null,
              muc_tieu_calories_ngay: currentGoal.muc_tieu_calories_ngay
                ? Number(currentGoal.muc_tieu_calories_ngay)
                : null,
              muc_tieu_protein_g: currentGoal.muc_tieu_protein_g
                ? Number(currentGoal.muc_tieu_protein_g)
                : null,
              muc_tieu_carb_g: currentGoal.muc_tieu_carb_g
                ? Number(currentGoal.muc_tieu_carb_g)
                : null,
              muc_tieu_fat_g: currentGoal.muc_tieu_fat_g
                ? Number(currentGoal.muc_tieu_fat_g)
                : null,
              ngay_bat_dau: currentGoal.ngay_bat_dau,
              ngay_muc_tieu: currentGoal.ngay_muc_tieu,
            }
          : null,
        chi_so_gan_nhat: latestMetric ? this.toMetricSummary(latestMetric) : null,
        bieu_do_can_nang: recentWeights,
        danh_gia_suc_khoe_moi_nhat: latestAssessment
          ? this.toAssessmentResponse(latestAssessment)
          : null,
        dinh_duong_hom_nay: nutritionToday,
        khuyen_nghi_ai_moi_nhat: latestRecommendation,
        thong_bao_chua_doc: unreadNotifications,
      },
    };
  }

  private async getNutritionSummaryForToday(taiKhoanId: number) {
    const today = new Date().toISOString().slice(0, 10);
    const row = await this.nutritionSummaryRepository.findOne({
      where: { tai_khoan_id: taiKhoanId, ngay: today },
      order: { cap_nhat_luc: 'DESC', id: 'DESC' },
    });

    if (!row) {
      return null;
    }

    return {
      ngay: row.ngay,
      tong_calories: this.toNullableNumber(row.tong_calories),
      tong_protein_g: this.toNullableNumber(row.tong_protein_g),
      tong_carb_g: this.toNullableNumber(row.tong_carb_g),
      tong_fat_g: this.toNullableNumber(row.tong_fat_g),
      so_bua_da_ghi: row.so_bua_da_ghi,
      cap_nhat_luc: row.cap_nhat_luc,
    };
  }

  private async getLatestRecommendation(taiKhoanId: number) {
    const row = await this.recommendationRepository.findOne({
      where: { tai_khoan_id: taiKhoanId },
      order: { tao_luc: 'DESC', id: 'DESC' },
    });

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      trang_thai: row.trang_thai,
      loai_khuyen_nghi: row.loai_khuyen_nghi,
      ngay_muc_tieu: row.ngay_muc_tieu,
      muc_tieu_calories: this.toNullableNumber(row.muc_tieu_calories),
      muc_tieu_protein_g: this.toNullableNumber(row.muc_tieu_protein_g),
      muc_tieu_carb_g: this.toNullableNumber(row.muc_tieu_carb_g),
      muc_tieu_fat_g: this.toNullableNumber(row.muc_tieu_fat_g),
      canh_bao: row.canh_bao ?? null,
      ly_giai: row.ly_giai,
      du_lieu_khuyen_nghi: row.du_lieu_khuyen_nghi,
      tao_luc: row.tao_luc,
      cap_nhat_luc: row.cap_nhat_luc,
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

  private collectMissingData(
    profile: HoSoEntity | null,
    goal: MucTieuEntity | null,
    assessment: DanhGiaSucKhoeEntity | null,
  ) {
    const missing: string[] = [];
    const onboardingStep = this.resolveOnboardingStep(profile, goal);

    if (onboardingStep === 'ho_so') {
      missing.push('ho_so');
    }
    if (onboardingStep === 'muc_tieu') {
      missing.push('muc_tieu');
    }
    if (!assessment) {
      missing.push('danh_gia_suc_khoe');
    }

    return missing;
  }

  private async getActiveUser(userId?: number) {
    if (!userId) {
      throw new UnauthorizedException('Ban chua dang nhap');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, xoa_luc: IsNull() },
    });

    if (!user || user.vai_tro !== 'nguoi_dung') {
      throw new UnauthorizedException('Khong tim thay nguoi dung hop le');
    }

    if (user.trang_thai !== 'hoat_dong') {
      throw new ForbiddenException('Tai khoan khong o trang thai hoat dong');
    }

    return user;
  }

  private toMetricSummary(metric: ChiSoSucKhoeEntity) {
    return {
      id: metric.id,
      do_luc: metric.do_luc,
      can_nang_kg: metric.can_nang_kg ? Number(metric.can_nang_kg) : null,
      chieu_cao_cm: metric.chieu_cao_cm ? Number(metric.chieu_cao_cm) : null,
      vong_eo_cm: metric.vong_eo_cm ? Number(metric.vong_eo_cm) : null,
      vong_mong_cm: metric.vong_mong_cm ? Number(metric.vong_mong_cm) : null,
      huyet_ap_tam_thu: metric.huyet_ap_tam_thu,
      huyet_ap_tam_truong: metric.huyet_ap_tam_truong,
      duong_huyet: metric.duong_huyet ? Number(metric.duong_huyet) : null,
      ghi_chu: metric.ghi_chu,
    };
  }

  private toAssessmentResponse(assessment: DanhGiaSucKhoeEntity) {
    return {
      id: assessment.id,
      tai_khoan_id: assessment.tai_khoan_id,
      chi_so_suc_khoe_id: assessment.chi_so_suc_khoe_id,
      muc_tieu_id: assessment.muc_tieu_id,
      bmi: assessment.bmi ? Number(assessment.bmi) : null,
      phan_loai_bmi: assessment.phan_loai_bmi,
      bmr: assessment.bmr ? Number(assessment.bmr) : null,
      tdee: assessment.tdee ? Number(assessment.tdee) : null,
      calories_khuyen_nghi: assessment.calories_khuyen_nghi
        ? Number(assessment.calories_khuyen_nghi)
        : null,
      protein_khuyen_nghi_g: assessment.protein_khuyen_nghi_g
        ? Number(assessment.protein_khuyen_nghi_g)
        : null,
      carb_khuyen_nghi_g: assessment.carb_khuyen_nghi_g
        ? Number(assessment.carb_khuyen_nghi_g)
        : null,
      fat_khuyen_nghi_g: assessment.fat_khuyen_nghi_g
        ? Number(assessment.fat_khuyen_nghi_g)
        : null,
      tom_tat: assessment.tom_tat,
      tao_luc: assessment.tao_luc,
      cap_nhat_luc: assessment.cap_nhat_luc,
    };
  }

  private toNullableNumber(value: unknown) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

}
