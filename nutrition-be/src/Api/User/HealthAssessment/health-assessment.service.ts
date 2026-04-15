import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { HoSoEntity } from '../../Admin/User/entities/ho-so.entity';
import { MucTieuEntity } from '../../Admin/User/entities/muc-tieu.entity';
import { ChiSoSucKhoeEntity } from './entities/chi-so-suc-khoe.entity';
import { DanhGiaSucKhoeEntity } from './entities/danh-gia-suc-khoe.entity';

type GoalType = MucTieuEntity['loai_muc_tieu'];

@Injectable()
export class UserHealthAssessmentService {
  constructor(
    @InjectRepository(HoSoEntity)
    private readonly profileRepository: Repository<HoSoEntity>,
    @InjectRepository(MucTieuEntity)
    private readonly goalRepository: Repository<MucTieuEntity>,
    @InjectRepository(ChiSoSucKhoeEntity)
    private readonly metricRepository: Repository<ChiSoSucKhoeEntity>,
    @InjectRepository(DanhGiaSucKhoeEntity)
    private readonly assessmentRepository: Repository<DanhGiaSucKhoeEntity>,
  ) {}

  async recalculateForUser(taiKhoanId: number, manager?: EntityManager) {
    const profileRepository = manager
      ? manager.getRepository(HoSoEntity)
      : this.profileRepository;
    const goalRepository = manager
      ? manager.getRepository(MucTieuEntity)
      : this.goalRepository;
    const metricRepository = manager
      ? manager.getRepository(ChiSoSucKhoeEntity)
      : this.metricRepository;
    const assessmentRepository = manager
      ? manager.getRepository(DanhGiaSucKhoeEntity)
      : this.assessmentRepository;

    const [profile, currentGoal, latestMetric] = await Promise.all([
      profileRepository.findOne({
        where: { tai_khoan_id: taiKhoanId },
      }),
      goalRepository.findOne({
        where: { tai_khoan_id: taiKhoanId, trang_thai: 'dang_ap_dung' },
        order: { cap_nhat_luc: 'DESC', id: 'DESC' },
      }),
      metricRepository.findOne({
        where: { tai_khoan_id: taiKhoanId },
        order: { do_luc: 'DESC', id: 'DESC' },
      }),
    ]);

    if (!profile) {
      return null;
    }

    const weightKg = this.pickNumber(
      latestMetric?.can_nang_kg,
      profile.can_nang_hien_tai_kg,
    );
    const heightCm = this.pickNumber(
      latestMetric?.chieu_cao_cm,
      profile.chieu_cao_cm,
    );
    const age = this.calculateAge(profile.ngay_sinh);
    const activityFactor = this.getActivityFactor(profile.muc_do_van_dong);

    const bmi = heightCm && weightKg ? weightKg / (heightCm / 100) ** 2 : null;
    const bmr =
      heightCm && weightKg && age !== null
        ? this.calculateBmr(weightKg, heightCm, age, profile.gioi_tinh)
        : null;
    const tdee =
      bmr !== null && activityFactor !== null ? bmr * activityFactor : null;

    const caloriesRecommendation = this.calculateCaloriesRecommendation(
      tdee,
      currentGoal?.loai_muc_tieu ?? null,
    );
    const macroRecommendation = this.calculateMacroRecommendation(
      weightKg,
      caloriesRecommendation,
      currentGoal?.loai_muc_tieu ?? null,
    );

    const now = new Date();
    const assessment = assessmentRepository.create({
      tai_khoan_id: taiKhoanId,
      chi_so_suc_khoe_id: latestMetric?.id ?? null,
      muc_tieu_id: currentGoal?.id ?? null,
      bmi: this.toDecimalString(bmi),
      phan_loai_bmi: this.classifyBmi(bmi),
      bmr: this.toDecimalString(bmr),
      tdee: this.toDecimalString(tdee),
      calories_khuyen_nghi: this.toDecimalString(caloriesRecommendation),
      protein_khuyen_nghi_g: this.toDecimalString(
        macroRecommendation?.protein ?? null,
      ),
      carb_khuyen_nghi_g: this.toDecimalString(
        macroRecommendation?.carb ?? null,
      ),
      fat_khuyen_nghi_g: this.toDecimalString(macroRecommendation?.fat ?? null),
      tom_tat: this.buildSummary({
        bmi,
        currentGoal: currentGoal?.loai_muc_tieu ?? null,
        caloriesRecommendation,
      }),
      tao_luc: now,
      cap_nhat_luc: now,
    });

    return assessmentRepository.save(assessment);
  }

  private pickNumber(
    ...values: Array<string | null | undefined>
  ): number | null {
    for (const value of values) {
      if (value === null || value === undefined || value === '') continue;
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return null;
  }

  private calculateAge(ngaySinh: string | null): number | null {
    if (!ngaySinh) return null;

    const birthDate = new Date(ngaySinh);
    if (Number.isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age -= 1;
    }

    return age > 0 ? age : null;
  }

  private calculateBmr(
    weightKg: number,
    heightCm: number,
    age: number,
    gender: HoSoEntity['gioi_tinh'],
  ): number {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;

    if (gender === 'nam') {
      return base + 5;
    }

    if (gender === 'nu') {
      return base - 161;
    }

    return base - 78;
  }

  private getActivityFactor(
    activityLevel: HoSoEntity['muc_do_van_dong'],
  ): number | null {
    switch (activityLevel) {
      case 'it_van_dong':
        return 1.2;
      case 'van_dong_nhe':
        return 1.375;
      case 'van_dong_vua':
        return 1.55;
      case 'nang_dong':
        return 1.725;
      case 'rat_nang_dong':
        return 1.9;
      default:
        return null;
    }
  }

  private calculateCaloriesRecommendation(
    tdee: number | null,
    goalType: GoalType | null,
  ): number | null {
    if (tdee === null) return null;

    switch (goalType) {
      case 'giam_can':
        return Math.max(tdee - 500, 1200);
      case 'tang_can':
        return tdee + 300;
      case 'giu_can':
      default:
        return tdee;
    }
  }

  private calculateMacroRecommendation(
    weightKg: number | null,
    caloriesTarget: number | null,
    goalType: GoalType | null,
  ): { protein: number; carb: number; fat: number } | null {
    if (weightKg === null || caloriesTarget === null) {
      return null;
    }

    const proteinPerKg =
      goalType === 'giam_can' ? 2 : goalType === 'tang_can' ? 1.8 : 1.6;
    const protein = weightKg * proteinPerKg;
    const fatCalories = caloriesTarget * 0.25;
    const fat = fatCalories / 9;
    const carbCalories = Math.max(caloriesTarget - protein * 4 - fat * 9, 0);
    const carb = carbCalories / 4;

    return { protein, carb, fat };
  }

  private classifyBmi(bmi: number | null): string | null {
    if (bmi === null) return null;
    if (bmi < 18.5) return 'thieu_can';
    if (bmi < 25) return 'binh_thuong';
    if (bmi < 30) return 'thua_can';
    return 'beo_phi';
  }

  private buildSummary(params: {
    bmi: number | null;
    currentGoal: GoalType | null;
    caloriesRecommendation: number | null;
  }): string | null {
    const segments: string[] = [];

    if (params.bmi !== null) {
      segments.push(
        `BMI hien tai: ${params.bmi.toFixed(1)} (${this.classifyBmi(params.bmi)})`,
      );
    }

    if (params.currentGoal) {
      segments.push(`Muc tieu dang ap dung: ${params.currentGoal}`);
    }

    if (params.caloriesRecommendation !== null) {
      segments.push(
        `Calories khuyen nghi moi ngay: ${Math.round(params.caloriesRecommendation)} kcal`,
      );
    }

    return segments.length > 0 ? segments.join('. ') : null;
  }

  private toDecimalString(value: number | null): string | null {
    return value === null ? null : value.toFixed(2);
  }
}
