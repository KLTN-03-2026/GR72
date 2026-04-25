import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { ThucPhamEntity } from '../../Admin/Food/entities/thuc-pham.entity';
import { ThongBaoEntity } from '../../Admin/FoodReview/entities/thong-bao.entity';
import { HoSoEntity } from '../../Admin/User/entities/ho-so.entity';
import { MucTieuEntity } from '../../Admin/User/entities/muc-tieu.entity';
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';
import { ChiSoSucKhoeEntity } from '../HealthAssessment/entities/chi-so-suc-khoe.entity';
import { DanhGiaSucKhoeEntity } from '../HealthAssessment/entities/danh-gia-suc-khoe.entity';
import {
  NhatKyBuaAnEntity,
  TongHopDinhDuongNgayEntity,
} from '../MealLog/entities/nhat-ky-bua-an.entity';
import {
  ChiTietKeHoachAnEntity,
  KeHoachAnEntity,
} from '../MealPlan/entities/ke-hoach-an.entity';
import {
  ChiTietThucDonMauEntity,
  ThucDonMauEntity,
} from '../../Nutritionist/MealTemplate/entities/thuc-don-mau.entity';
import { CongThucEntity } from '../../Nutritionist/Recipe/entities/cong-thuc.entity';
import { ApplyRecommendationDto } from './dto/apply-recommendation.dto';
import { KhuyenNghiAiEntity } from './entities/khuyen-nghi-ai.entity';

type RecommendationPlanDetail = {
  id?: unknown;
  ngay_so?: unknown;
  loai_bua_an?: unknown;
  cong_thuc_id?: unknown;
  thuc_pham_id?: unknown;
  so_luong?: unknown;
  don_vi?: unknown;
  calories?: unknown;
  protein_g?: unknown;
  carb_g?: unknown;
  fat_g?: unknown;
  ghi_chu?: unknown;
  thu_tu?: unknown;
};

type NutritionMacroBundle = {
  calories: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
};

@Injectable()
export class UserRecommendationService {
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
    @InjectRepository(NhatKyBuaAnEntity)
    private readonly mealLogRepository: Repository<NhatKyBuaAnEntity>,
    @InjectRepository(ThucPhamEntity)
    private readonly foodRepository: Repository<ThucPhamEntity>,
    @InjectRepository(CongThucEntity)
    private readonly recipeRepository: Repository<CongThucEntity>,
    @InjectRepository(ThucDonMauEntity)
    private readonly mealTemplateRepository: Repository<ThucDonMauEntity>,
    @InjectRepository(ChiTietThucDonMauEntity)
    private readonly mealTemplateDetailRepository: Repository<ChiTietThucDonMauEntity>,
    @InjectRepository(KeHoachAnEntity)
    private readonly mealPlanRepository: Repository<KeHoachAnEntity>,
    @InjectRepository(ChiTietKeHoachAnEntity)
    private readonly mealPlanDetailRepository: Repository<ChiTietKeHoachAnEntity>,
    @InjectRepository(KhuyenNghiAiEntity)
    private readonly recommendationRepository: Repository<KhuyenNghiAiEntity>,
    @InjectRepository(ThongBaoEntity)
    private readonly notificationRepository: Repository<ThongBaoEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getNutritionRecommendations(userId?: number) {
    const context = await this.getContext(userId);
    const targetCalories =
      context.goal?.muc_tieu_calories_ngay !== null &&
      context.goal?.muc_tieu_calories_ngay !== undefined
        ? Number(context.goal.muc_tieu_calories_ngay)
        : context.assessment?.calories_khuyen_nghi
          ? Number(context.assessment.calories_khuyen_nghi)
          : null;
    const consumedCalories = context.summaryToday
      ? Number(context.summaryToday.tong_calories)
      : 0;
    const calorieGap =
      targetCalories !== null
        ? Number((targetCalories - consumedCalories).toFixed(2))
        : null;

    const foods = await this.foodRepository.find({
      where: { xoa_luc: IsNull() },
      relations: ['nhom_thuc_pham'],
      take: 40,
      order: { da_xac_minh: 'DESC', ten: 'ASC' },
    });

    const filteredFoods = foods.filter((food) =>
      this.isFoodAllowed(food, context.profile),
    );
    const prioritize = [...filteredFoods]
      .sort((a, b) => {
        const scoreA =
          this.scoreFoodForGoal(a, context.goal?.loai_muc_tieu ?? null) +
          this.scoreDietPreferenceForFood(a, context.profile);
        const scoreB =
          this.scoreFoodForGoal(b, context.goal?.loai_muc_tieu ?? null) +
          this.scoreDietPreferenceForFood(b, context.profile);
        return scoreB - scoreA;
      })
      .slice(0, 5)
      .map((food) => this.toFoodSuggestion(food));

    const limitFoods = [...filteredFoods]
      .sort(
        (a, b) =>
          Number(b.duong_100g) +
          Number(b.natri_100g) -
          (Number(a.duong_100g) + Number(a.natri_100g)),
      )
      .slice(0, 3)
      .map((food) => this.toFoodSuggestion(food));

    const warnings: string[] = [];
    if (calorieGap !== null && calorieGap < 0) {
      warnings.push(
        'Bạn đã vượt mục tiêu calories hôm nay, nên ưu tiên món nhẹ và giàu protein.',
      );
    }
    if (context.profile?.di_ung?.length) {
      warnings.push(
        `Đã loại trừ thực phẩm liên quan đến dị ứng: ${context.profile.di_ung.join(', ')}.`,
      );
    }

    const recommendation = await this.saveRecommendation(context.user.id, {
      loai: 'nutrition',
      mucTieuCalories: targetCalories,
      mucTieuProtein:
        context.goal?.muc_tieu_protein_g ??
        context.assessment?.protein_khuyen_nghi_g ??
        null,
      mucTieuCarb:
        context.goal?.muc_tieu_carb_g ??
        context.assessment?.carb_khuyen_nghi_g ??
        null,
      mucTieuFat:
        context.goal?.muc_tieu_fat_g ??
        context.assessment?.fat_khuyen_nghi_g ??
        null,
      warnings,
      lyGiai:
        calorieGap === null
          ? 'Khuyến nghị được xây dựng từ hồ sơ, mục tiêu và danh mục thực phẩm hiện có.'
          : `Mức chênh calories hôm nay hiện là ${Math.round(calorieGap)} kcal so với mục tiêu.`,
      duLieu: {
        calorie_gap: calorieGap,
        foods_uu_tien: prioritize,
        foods_han_che: limitFoods,
      },
    });

    return {
      success: true,
      message: 'Lấy khuyến nghị dinh dưỡng thành công',
      data: this.toRecommendationResponse(recommendation),
    };
  }

  async getNextMealRecommendations(userId?: number) {
    const context = await this.getContext(userId);
    const nextMealType = await this.detectNextMealType(context.user.id);
    const targetCalories =
      context.goal?.muc_tieu_calories_ngay !== null &&
      context.goal?.muc_tieu_calories_ngay !== undefined
        ? Number(context.goal.muc_tieu_calories_ngay)
        : context.assessment?.calories_khuyen_nghi
          ? Number(context.assessment.calories_khuyen_nghi)
          : 1800;
    const mealTargetCalories = Math.max(targetCalories / 4, 250);

    const recipes = await this.recipeRepository.find({
      where: { trang_thai: 'xuat_ban', xoa_luc: IsNull() },
      take: 10,
      order: { tao_luc: 'DESC' },
    });

    const suggestions = recipes
      .filter((recipe) => this.isRecipeAllowed(recipe, context.profile))
      .map((recipe) => ({
        id: recipe.id,
        ten: recipe.ten,
        mo_ta: recipe.mo_ta,
        calories: Number(recipe.tong_calories || 0),
        protein_g: Number(recipe.tong_protein_g || 0),
        carb_g: Number(recipe.tong_carb_g || 0),
        fat_g: Number(recipe.tong_fat_g || 0),
        score:
          this.scoreRecipeForMeal(recipe, mealTargetCalories) +
          this.scoreDietPreferenceForRecipe(recipe, context.profile),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ score, ...rest }) => rest);

    if (suggestions.length === 0) {
      // Không có recipes xuat_ban — vẫn trả 200 với cảnh báo
      const emptyRecommendation = await this.saveRecommendation(context.user.id, {
        loai: 'meal_next',
        mucTieuCalories: mealTargetCalories,
        mucTieuProtein: null,
        mucTieuCarb: null,
        mucTieuFat: null,
        warnings: ['Hiện chưa có công thức nào được xuất bản để gợi ý.'],
        lyGiai: `Chưa có công thức món ăn nào được xuất bản để gợi ý cho bữa ăn tiếp theo.`,
        duLieu: {
          loai_bua_an_goi_y: nextMealType,
          recipes: [],
        },
      });
      return {
        success: true,
        message: 'Chưa có gợi ý bữa ăn',
        data: this.toRecommendationResponse(emptyRecommendation),
      };
    }

    const recommendation = await this.saveRecommendation(context.user.id, {
      loai: 'meal_next',
      mucTieuCalories: mealTargetCalories,
      mucTieuProtein: null,
      mucTieuCarb: null,
      mucTieuFat: null,
      warnings: [],
      lyGiai: `Gợi ý cho ${nextMealType} dựa trên mục tiêu hiện tại và lượng calories còn lại trong ngày.`,
      duLieu: {
        loai_bua_an_goi_y: nextMealType,
        recipes: suggestions,
      },
    });

    return {
      success: true,
      message: 'Lấy gợi ý bữa ăn tiếp theo thành công',
      data: this.toRecommendationResponse(recommendation),
    };
  }

  async getDailyMealPlanRecommendations(userId?: number) {
    const context = await this.getContext(userId);
    const targetCalories =
      context.goal?.muc_tieu_calories_ngay !== null &&
      context.goal?.muc_tieu_calories_ngay !== undefined
        ? Number(context.goal.muc_tieu_calories_ngay)
        : context.assessment?.calories_khuyen_nghi
          ? Number(context.assessment.calories_khuyen_nghi)
          : 1800;

    const templates = await this.mealTemplateRepository.find({
      where: { trang_thai: 'xuat_ban', xoa_luc: IsNull() },
      order: { tao_luc: 'DESC' },
      take: 20,
    });

    const candidateTemplates = templates.filter((template) => {
      if (!context.goal?.loai_muc_tieu) return true;
      return (
        !template.loai_muc_tieu_phu_hop ||
        template.loai_muc_tieu_phu_hop === context.goal.loai_muc_tieu
      );
    });

    if (!candidateTemplates.length) {
      // Không có template xuat_ban — vẫn trả 200 với cảnh báo
      const emptyRecommendation = await this.saveRecommendation(context.user.id, {
        loai: 'meal_plan_daily',
        mucTieuCalories: targetCalories,
        mucTieuProtein: null,
        mucTieuCarb: null,
        mucTieuFat: null,
        warnings: ['Hiện chưa có thực đơn mẫu nào được xuất bản. Hãy thử lại sau hoặc liên hệ chuyên gia dinh dưỡng.'],
        lyGiai: `Chưa có thực đơn mẫu phù hợp để gợi ý. Vui lòng thiết lập mục tiêu và thử lại sau.`,
        duLieu: {
          thuc_don_mau_id: null,
          tieu_de: null,
          mo_ta: null,
          loai_muc_tieu_phu_hop: null,
          calories_muc_tieu: targetCalories,
          chi_tiet: [],
        },
      });
      return {
        success: true,
        message: 'Chưa có thực đơn mẫu để gợi ý',
        data: this.toRecommendationResponse(emptyRecommendation),
      };
    }

    const detailRows = await this.mealTemplateDetailRepository.find({
      where: candidateTemplates.map((template) => ({
        thuc_don_mau_id: template.id,
      })),
      order: { ngay_so: 'ASC', loai_bua_an: 'ASC', thu_tu: 'ASC' },
    });

    const detailsByTemplate = new Map<number, ChiTietThucDonMauEntity[]>();
    for (const detail of detailRows) {
      const current = detailsByTemplate.get(detail.thuc_don_mau_id) ?? [];
      current.push(detail);
      detailsByTemplate.set(detail.thuc_don_mau_id, current);
    }

    const matchingTemplates = (
      await Promise.all(
        candidateTemplates.map(async (template) => {
          const details = detailsByTemplate.get(template.id) ?? [];
          const enrichedDetails = await Promise.all(
            details.map((detail) => this.enrichMealPlanDetail(detail)),
          );

          return {
            template,
            details: enrichedDetails,
            distance: Math.abs(
              Number(template.calories_muc_tieu || targetCalories) -
                targetCalories,
            ),
            preferenceScore: this.scoreTemplateForDietPreference(
              enrichedDetails,
              context.profile,
            ),
          };
        }),
      )
    ).filter((item) => item.preferenceScore > Number.NEGATIVE_INFINITY);

    matchingTemplates.sort((a, b) => {
      if (b.preferenceScore !== a.preferenceScore) {
        return b.preferenceScore - a.preferenceScore;
      }
      return a.distance - b.distance;
    });

    const selectedBundle = matchingTemplates[0];
    if (!selectedBundle) {
      // Không có template nào phù hợp sau khi lọc — trả 200 với cảnh báo
      const emptyRecommendation = await this.saveRecommendation(context.user.id, {
        loai: 'meal_plan_daily',
        mucTieuCalories: targetCalories,
        mucTieuProtein: null,
        mucTieuCarb: null,
        mucTieuFat: null,
        warnings: ['Không tìm thấy thực đơn mẫu phù hợp với mục tiêu hiện tại.'],
        lyGiai: `Hệ thống chưa có thực đơn mẫu phù hợp với loại mục tiêu của bạn. Vui lòng liên hệ chuyên gia để được tư vấn.`,
        duLieu: {
          thuc_don_mau_id: null,
          tieu_de: null,
          mo_ta: null,
          loai_muc_tieu_phu_hop: null,
          calories_muc_tieu: targetCalories,
          chi_tiet: [],
        },
      });
      return {
        success: true,
        message: 'Không tìm thấy thực đơn phù hợp',
        data: this.toRecommendationResponse(emptyRecommendation),
      };
    }

    const selected = selectedBundle.template;
    const details = selectedBundle.details;

    const recommendation = await this.saveRecommendation(context.user.id, {
      loai: 'meal_plan_daily',
      mucTieuCalories: Number(selected.calories_muc_tieu || targetCalories),
      mucTieuProtein: null,
      mucTieuCarb: null,
      mucTieuFat: null,
      warnings: [],
      lyGiai: `Chọn thực đơn mẫu gần nhất với mục tiêu calories và loại mục tiêu hiện tại.`,
      duLieu: {
        thuc_don_mau_id: selected.id,
        tieu_de: selected.tieu_de,
        mo_ta: selected.mo_ta,
        loai_muc_tieu_phu_hop: selected.loai_muc_tieu_phu_hop,
        calories_muc_tieu: Number(selected.calories_muc_tieu || targetCalories),
        chi_tiet: details,
      },
    });

    return {
      success: true,
      message: 'Lấy gợi ý thực đơn ngày thành công',
      data: this.toRecommendationResponse(recommendation),
    };
  }

  async getHealthManagementRecommendations(userId?: number) {
    const context = await this.getContext(userId);
    const actions: string[] = [];
    const warnings: string[] = [];

    if (
      context.assessment?.phan_loai_bmi === 'thua_can' ||
      context.assessment?.phan_loai_bmi === 'beo_phi'
    ) {
      actions.push('Duy trì deficit calories nhẹ 300-500 kcal mỗi ngày.');
      actions.push('Ưu tiên hoạt động thể lực tối thiểu 30 phút mỗi ngày.');
    } else if (context.assessment?.phan_loai_bmi === 'thieu_can') {
      actions.push('Tăng bữa phụ giàu năng lượng lành mạnh trong ngày.');
      actions.push('Tăng protein và theo dõi cân nặng hàng tuần.');
    } else {
      actions.push(
        'Duy trì phân bổ bữa ăn đều trong ngày và theo dõi trend calories 7 ngày.',
      );
    }

    if (
      context.latestMetric?.huyet_ap_tam_thu &&
      context.latestMetric.huyet_ap_tam_thu >= 140
    ) {
      warnings.push(
        'Huyết áp tâm thu gần nhất đang cao, nên giảm natri và theo dõi thêm.',
      );
    }

    if (
      context.latestMetric?.duong_huyet &&
      Number(context.latestMetric.duong_huyet) >= 126
    ) {
      warnings.push(
        'Đường huyết gần nhất cao hơn ngưỡng tham khảo, cần theo dõi sát.',
      );
    }

    const recentSummaries = await this.nutritionSummaryRepository.find({
      where: { tai_khoan_id: context.user.id },
      order: { ngay: 'DESC' },
      take: 7,
    });

    const averageCalories =
      recentSummaries.length > 0
        ? recentSummaries.reduce(
            (sum, item) => sum + Number(item.tong_calories),
            0,
          ) / recentSummaries.length
        : null;

    const recommendation = await this.saveRecommendation(context.user.id, {
      loai: 'health_management',
      mucTieuCalories:
        context.goal?.muc_tieu_calories_ngay ??
        context.assessment?.calories_khuyen_nghi ??
        null,
      mucTieuProtein: null,
      mucTieuCarb: null,
      mucTieuFat: null,
      warnings,
      lyGiai:
        'Khuyến nghị quản lý sức khỏe được tổng hợp từ assessment mới nhất, metric gần nhất và lịch sử ăn uống gần đây.',
      duLieu: {
        actions,
        average_calories_7d:
          averageCalories !== null ? Number(averageCalories.toFixed(2)) : null,
        bmi: context.assessment?.bmi ? Number(context.assessment.bmi) : null,
        phan_loai_bmi: context.assessment?.phan_loai_bmi ?? null,
      },
    });

    return {
      success: true,
      message: 'Lấy khuyến nghị quản lý sức khỏe thành công',
      data: this.toRecommendationResponse(recommendation),
    };
  }

  async applyRecommendation(
    userId: number | undefined,
    recommendationId: number,
    dto: ApplyRecommendationDto,
  ) {
    if (!Number.isFinite(recommendationId) || recommendationId <= 0) {
      throw new BadRequestException('ID khuyến nghị không hợp lệ');
    }

    const user = await this.getActiveUser(userId);
    const recommendation = await this.recommendationRepository.findOne({
      where: { id: recommendationId, tai_khoan_id: user.id },
    });

    if (!recommendation) {
      throw new NotFoundException('Khong tim thay khuyen nghi');
    }

    const payload = recommendation.du_lieu_khuyen_nghi;
    const appliedDate =
      dto.ngayApDung ??
      recommendation.ngay_muc_tieu ??
      new Date().toISOString().slice(0, 10);

    if (
      recommendation.loai_khuyen_nghi !== 'meal_plan_daily' &&
      recommendation.loai_khuyen_nghi !== 'meal_next'
    ) {
      recommendation.trang_thai = 'da_ap_dung';
      recommendation.cap_nhat_luc = new Date();
      await this.recommendationRepository.save(recommendation);

      return {
        success: true,
        message: 'Đã đánh dấu áp dụng khuyến nghị thành công',
        data: this.toRecommendationResponse(recommendation),
      };
    }

    const plan = await this.dataSource.transaction(async (manager) => {
      const mealPlanRepository = manager.getRepository(KeHoachAnEntity);
      const mealPlanDetailRepository = manager.getRepository(
        ChiTietKeHoachAnEntity,
      );
      const notificationRepository = manager.getRepository(ThongBaoEntity);
      const recommendationRepository =
        manager.getRepository(KhuyenNghiAiEntity);

      const now = new Date();
      const createdPlan = await mealPlanRepository.save(
        mealPlanRepository.create({
          tai_khoan_id: user.id,
          loai_nguon: 'khuyen_nghi_ai',
          nguon_id: recommendation.id,
          tieu_de:
            typeof payload.tieu_de === 'string'
              ? payload.tieu_de
              : `Kế hoạch từ khuyến nghị #${recommendation.id}`,
          mo_ta:
            typeof payload.mo_ta === 'string'
              ? payload.mo_ta
              : recommendation.ly_giai,
          ngay_ap_dung: appliedDate,
          trang_thai: 'dang_ap_dung',
          tong_calories: recommendation.muc_tieu_calories,
          tong_protein_g: recommendation.muc_tieu_protein_g,
          tong_carb_g: recommendation.muc_tieu_carb_g,
          tong_fat_g: recommendation.muc_tieu_fat_g,
          tao_luc: now,
          cap_nhat_luc: now,
        }),
      );

      const details: RecommendationPlanDetail[] = Array.isArray(
        payload.chi_tiet,
      )
        ? (payload.chi_tiet as RecommendationPlanDetail[])
        : Array.isArray(payload.recipes)
          ? (payload.recipes as Array<Record<string, unknown>>).map(
              (recipe, index) => ({
                ngay_so: 1,
                loai_bua_an: payload.loai_bua_an_goi_y ?? 'bua_phu',
                cong_thuc_id: recipe.id,
                thuc_pham_id: null,
                so_luong: 1,
                don_vi: 'phan',
                calories: recipe.calories,
                protein_g: recipe.protein_g,
                carb_g: recipe.carb_g,
                fat_g: recipe.fat_g,
                ghi_chu: 'Tạo từ gợi ý bữa ăn tiếp theo',
                thu_tu: index + 1,
              }),
            )
          : [];

      if (!details.length) {
        throw new BadRequestException(
          'Khuyến nghị này không có dữ liệu để áp dụng thành kế hoạch ăn',
        );
      }

      for (const [index, detail] of details.entries()) {
        const enrichedDetail =
          await this.enrichRecommendationPlanDetail(detail);
        await mealPlanDetailRepository.save(
          mealPlanDetailRepository.create({
            ke_hoach_an_id: createdPlan.id,
            loai_bua_an: (enrichedDetail.loai_bua_an as any) ?? 'bua_phu',
            cong_thuc_id: this.toNullableInt(enrichedDetail.cong_thuc_id),
            thuc_pham_id: this.toNullableInt(enrichedDetail.thuc_pham_id),
            so_luong:
              enrichedDetail.so_luong !== undefined &&
              enrichedDetail.so_luong !== null
                ? Number(enrichedDetail.so_luong).toFixed(2)
                : '1.00',
            don_vi:
              typeof enrichedDetail.don_vi === 'string'
                ? enrichedDetail.don_vi
                : 'phan',
            calories:
              enrichedDetail.calories !== undefined &&
              enrichedDetail.calories !== null
                ? Number(enrichedDetail.calories).toFixed(2)
                : null,
            protein_g:
              enrichedDetail.protein_g !== undefined &&
              enrichedDetail.protein_g !== null
                ? Number(enrichedDetail.protein_g).toFixed(2)
                : null,
            carb_g:
              enrichedDetail.carb_g !== undefined &&
              enrichedDetail.carb_g !== null
                ? Number(enrichedDetail.carb_g).toFixed(2)
                : null,
            fat_g:
              enrichedDetail.fat_g !== undefined &&
              enrichedDetail.fat_g !== null
                ? Number(enrichedDetail.fat_g).toFixed(2)
                : null,
            ghi_chu:
              typeof enrichedDetail.ghi_chu === 'string'
                ? enrichedDetail.ghi_chu
                : `Chi tiết #${index + 1} từ khuyến nghị`,
            thu_tu: this.toNullableInt(enrichedDetail.thu_tu) ?? index + 1,
            tao_luc: now,
            cap_nhat_luc: now,
          }),
        );
      }

      recommendation.ke_hoach_an_da_ap_dung_id = createdPlan.id;
      recommendation.trang_thai = 'da_ap_dung';
      recommendation.cap_nhat_luc = now;
      await recommendationRepository.save(recommendation);

      await notificationRepository.save(
        notificationRepository.create({
          tai_khoan_id: user.id,
          nguoi_gui_id: null,
          loai: 'khuyen_nghi_ai',
          tieu_de: 'Đã áp dụng khuyến nghị thành kế hoạch ăn',
          noi_dung: `Kế hoạch ăn "${createdPlan.tieu_de}" đã được tạo từ khuyến nghị của hệ thống.`,
          trang_thai: 'chua_doc',
          duong_dan_hanh_dong: '/nutrition/meal-plans',
          tao_luc: now,
          doc_luc: null,
          cap_nhat_luc: now,
        }),
      );

      return createdPlan;
    });

    return {
      success: true,
      message: 'Đã áp dụng khuyến nghị thành kế hoạch ăn thành công',
      data: {
        recommendation: this.toRecommendationResponse({
          ...recommendation,
          ke_hoach_an_da_ap_dung_id: plan.id,
          trang_thai: 'da_ap_dung',
        } as KhuyenNghiAiEntity),
        ke_hoach_an: {
          id: plan.id,
          tieu_de: plan.tieu_de,
          ngay_ap_dung: plan.ngay_ap_dung,
          trang_thai: plan.trang_thai,
        },
      },
    };
  }

  private async getContext(userId?: number) {
    const user = await this.getActiveUser(userId);
    const [profile, goal, latestMetric, assessment, summaryToday] =
      await Promise.all([
        this.profileRepository.findOne({ where: { tai_khoan_id: user.id } }),
        this.goalRepository.findOne({
          where: { tai_khoan_id: user.id, trang_thai: 'dang_ap_dung' },
          order: { cap_nhat_luc: 'DESC', id: 'DESC' },
        }),
        this.metricRepository.findOne({
          where: { tai_khoan_id: user.id },
          order: { do_luc: 'DESC', id: 'DESC' },
        }),
        this.assessmentRepository.findOne({
          where: { tai_khoan_id: user.id },
          order: { tao_luc: 'DESC', id: 'DESC' },
        }),
        this.nutritionSummaryRepository.findOne({
          where: {
            tai_khoan_id: user.id,
            ngay: new Date().toISOString().slice(0, 10),
          },
        }),
      ]);

    return { user, profile, goal, latestMetric, assessment, summaryToday };
  }

  private async saveRecommendation(
    userId: number,
    input: {
      loai: string;
      mucTieuCalories: string | number | null;
      mucTieuProtein: string | number | null;
      mucTieuCarb: string | number | null;
      mucTieuFat: string | number | null;
      warnings: string[];
      lyGiai: string;
      duLieu: Record<string, unknown>;
    },
  ) {
    const now = new Date();
    return this.recommendationRepository.save(
      this.recommendationRepository.create({
        tai_khoan_id: userId,
        phien_tu_van_ai_id: null,
        trang_thai: 'cho_xu_ly',
        loai_khuyen_nghi: input.loai,
        ngay_muc_tieu: now.toISOString().slice(0, 10),
        muc_tieu_calories:
          input.mucTieuCalories !== null ? String(input.mucTieuCalories) : null,
        muc_tieu_protein_g:
          input.mucTieuProtein !== null ? String(input.mucTieuProtein) : null,
        muc_tieu_carb_g:
          input.mucTieuCarb !== null ? String(input.mucTieuCarb) : null,
        muc_tieu_fat_g:
          input.mucTieuFat !== null ? String(input.mucTieuFat) : null,
        canh_bao: input.warnings,
        ly_giai: input.lyGiai,
        du_lieu_khuyen_nghi: input.duLieu,
        ke_hoach_an_da_ap_dung_id: null,
        tao_luc: now,
        cap_nhat_luc: now,
      }),
    );
  }

  private async detectNextMealType(userId: number) {
    const today = new Date().toISOString().slice(0, 10);
    const logs = await this.mealLogRepository.find({
      where: { tai_khoan_id: userId, ngay_ghi: today },
      order: { loai_bua_an: 'ASC' },
    });
    const done = new Set(logs.map((log) => log.loai_bua_an));
    const order: Array<'bua_sang' | 'bua_trua' | 'bua_toi' | 'bua_phu'> = [
      'bua_sang',
      'bua_trua',
      'bua_toi',
      'bua_phu',
    ];
    return order.find((mealType) => !done.has(mealType)) ?? 'bua_phu';
  }

  private isFoodAllowed(food: ThucPhamEntity, profile: HoSoEntity | null) {
    if (!food.da_xac_minh && food.loai_nguon !== 'noi_bo') {
      return false;
    }

    const blockedTerms = [
      ...(profile?.di_ung ?? []),
      ...(profile?.thuc_pham_khong_thich ?? []),
    ].map((item) => item.toLowerCase());

    const candidate =
      `${food.ten} ${(food.the_gan ?? []).join(' ')}`.toLowerCase();
    return (
      !blockedTerms.some((term) => term && candidate.includes(term)) &&
      this.scoreDietPreferenceForFood(food, profile) > Number.NEGATIVE_INFINITY
    );
  }

  private isRecipeAllowed(recipe: CongThucEntity, profile: HoSoEntity | null) {
    return (
      this.scoreDietPreferenceForRecipe(recipe, profile) >
      Number.NEGATIVE_INFINITY
    );
  }

  private scoreDietPreferenceForFood(
    food: ThucPhamEntity,
    profile: HoSoEntity | null,
  ) {
    const preferences = this.normalizePreferences(profile?.che_do_an_uu_tien);
    if (!preferences.length) {
      return 0;
    }

    return this.scoreDietPreference({
      text: `${food.ten} ${food.mo_ta ?? ''} ${(food.the_gan ?? []).join(' ')}`,
      calories: Number(food.calories_100g || 0),
      protein_g: Number(food.protein_100g || 0),
      carb_g: Number(food.carb_100g || 0),
      fat_g: Number(food.fat_100g || 0),
      sugar_g: Number(food.duong_100g || 0),
      preferences,
    });
  }

  private scoreDietPreferenceForRecipe(
    recipe: CongThucEntity,
    profile: HoSoEntity | null,
  ) {
    const preferences = this.normalizePreferences(profile?.che_do_an_uu_tien);
    if (!preferences.length) {
      return 0;
    }

    return this.scoreDietPreference({
      text: `${recipe.ten} ${recipe.mo_ta ?? ''} ${recipe.huong_dan ?? ''}`,
      calories: Number(recipe.tong_calories || 0),
      protein_g: Number(recipe.tong_protein_g || 0),
      carb_g: Number(recipe.tong_carb_g || 0),
      fat_g: Number(recipe.tong_fat_g || 0),
      sugar_g: null,
      preferences,
    });
  }

  private scoreTemplateForDietPreference(
    details: RecommendationPlanDetail[],
    profile: HoSoEntity | null,
  ) {
    const preferences = this.normalizePreferences(profile?.che_do_an_uu_tien);
    if (!preferences.length || details.length === 0) {
      return 0;
    }

    const totals = details.reduce<NutritionMacroBundle>(
      (acc, detail) => {
        acc.calories += Number(detail.calories ?? 0);
        acc.protein_g += Number(detail.protein_g ?? 0);
        acc.carb_g += Number(detail.carb_g ?? 0);
        acc.fat_g += Number(detail.fat_g ?? 0);
        return acc;
      },
      { calories: 0, protein_g: 0, carb_g: 0, fat_g: 0 },
    );

    const text = details
      .map((detail) => detail.ghi_chu)
      .filter(
        (value): value is string =>
          typeof value === 'string' && value.length > 0,
      )
      .join(' ');

    return this.scoreDietPreference({
      text,
      calories: totals.calories,
      protein_g: totals.protein_g,
      carb_g: totals.carb_g,
      fat_g: totals.fat_g,
      sugar_g: null,
      preferences,
    });
  }

  private scoreDietPreference(input: {
    text: string;
    calories: number;
    protein_g: number;
    carb_g: number;
    fat_g: number;
    sugar_g: number | null;
    preferences: string[];
  }) {
    let score = 0;
    const normalizedText = this.normalizeText(input.text);

    for (const preference of input.preferences) {
      if (preference === 'high_protein') {
        score += input.protein_g >= 15 ? 5 : input.protein_g >= 8 ? 2 : -1;
      }

      if (preference === 'low_carb' || preference === 'it_tinh_bot') {
        if (input.carb_g > 30) {
          return Number.NEGATIVE_INFINITY;
        }
        score += input.carb_g <= 15 ? 4 : 1;
      }

      if (preference === 'it_duong') {
        if (input.sugar_g !== null && input.sugar_g > 10) {
          return Number.NEGATIVE_INFINITY;
        }
        score += input.sugar_g !== null && input.sugar_g <= 5 ? 3 : 1;
      }

      if (preference === 'it_beo') {
        if (input.fat_g > 15) {
          return Number.NEGATIVE_INFINITY;
        }
        score += input.fat_g <= 8 ? 3 : 1;
      }

      if (
        preference === 'an_chay' ||
        preference === 'vegetarian' ||
        preference === 'thuần_chay' ||
        preference === 'thuan_chay'
      ) {
        if (this.containsAnimalKeyword(normalizedText)) {
          return Number.NEGATIVE_INFINITY;
        }
        score += 3;
      }
    }

    return score;
  }

  private normalizePreferences(preferences: string[] | null | undefined) {
    return (preferences ?? [])
      .map((item) => this.normalizeText(item))
      .filter((item) => item.length > 0);
  }

  private normalizeText(value: string | null | undefined) {
    return (value ?? '').trim().toLowerCase();
  }

  private containsAnimalKeyword(value: string) {
    return [
      'ga',
      'heo',
      'bo',
      'ca ',
      'cá',
      'tom',
      'tôm',
      'muc',
      'mực',
      'trung',
      'trứng',
      'thit',
      'thịt',
      'sua',
      'sữa',
      'hai san',
      'hải sản',
    ].some((keyword) => value.includes(keyword));
  }

  private scoreFoodForGoal(
    food: ThucPhamEntity,
    goalType: MucTieuEntity['loai_muc_tieu'] | null,
  ) {
    const protein = Number(food.protein_100g || 0);
    const calories = Number(food.calories_100g || 0);
    const fiber = Number(food.chat_xo_100g || 0);

    if (goalType === 'giam_can') {
      return protein * 2 + fiber * 1.5 - calories * 0.02;
    }
    if (goalType === 'tang_can') {
      return protein * 1.8 + calories * 0.02;
    }
    return protein * 1.5 + fiber - calories * 0.01;
  }

  private scoreRecipeForMeal(recipe: CongThucEntity, targetCalories: number) {
    const calories = Number(recipe.tong_calories || 0);
    const protein = Number(recipe.tong_protein_g || 0);
    return protein * 2 - Math.abs(calories - targetCalories) * 0.02;
  }

  private async enrichMealPlanDetail(
    detail: ChiTietThucDonMauEntity,
  ): Promise<RecommendationPlanDetail> {
    const baseDetail: RecommendationPlanDetail = {
      id: detail.id,
      ngay_so: detail.ngay_so,
      loai_bua_an: detail.loai_bua_an,
      cong_thuc_id: detail.cong_thuc_id,
      thuc_pham_id: detail.thuc_pham_id,
      so_luong: detail.so_luong ? Number(detail.so_luong) : 1,
      don_vi: detail.don_vi ?? (detail.cong_thuc_id ? 'phan' : 'g'),
      ghi_chu: detail.ghi_chu,
      thu_tu: detail.thu_tu,
    };

    return this.enrichRecommendationPlanDetail(baseDetail);
  }

  private async enrichRecommendationPlanDetail(
    detail: RecommendationPlanDetail,
  ): Promise<RecommendationPlanDetail> {
    const nextDetail: RecommendationPlanDetail = { ...detail };
    const quantity =
      detail.so_luong !== undefined && detail.so_luong !== null
        ? Number(detail.so_luong)
        : 1;

    if (
      nextDetail.calories !== undefined &&
      nextDetail.calories !== null &&
      nextDetail.protein_g !== undefined &&
      nextDetail.protein_g !== null &&
      nextDetail.carb_g !== undefined &&
      nextDetail.carb_g !== null &&
      nextDetail.fat_g !== undefined &&
      nextDetail.fat_g !== null
    ) {
      return nextDetail;
    }

    if (detail.cong_thuc_id) {
      const recipe = await this.recipeRepository.findOne({
        where: {
          id: Number(detail.cong_thuc_id),
          xoa_luc: IsNull(),
          trang_thai: 'xuat_ban',
        },
      });
      if (!recipe) {
        // Recipe đã bị xóa hoặc không còn xuất bản — giữ nguyên detail, không có macro
        return nextDetail;
      }

      const servingCount =
        recipe.so_khau_phan && recipe.so_khau_phan > 0
          ? recipe.so_khau_phan
          : 1;
      const ratio = quantity / servingCount;
      nextDetail.don_vi =
        typeof nextDetail.don_vi === 'string' ? nextDetail.don_vi : 'phan';
      nextDetail.calories = Number(recipe.tong_calories || 0) * ratio;
      nextDetail.protein_g = Number(recipe.tong_protein_g || 0) * ratio;
      nextDetail.carb_g = Number(recipe.tong_carb_g || 0) * ratio;
      nextDetail.fat_g = Number(recipe.tong_fat_g || 0) * ratio;
      return nextDetail;
    }

    if (detail.thuc_pham_id) {
      const food = await this.foodRepository.findOne({
        where: {
          id: Number(detail.thuc_pham_id),
          xoa_luc: IsNull(),
        },
      });
      if (!food || (!food.da_xac_minh && food.loai_nguon !== 'noi_bo')) {
        // Thực phẩm đã bị xóa hoặc không còn hợp lệ — giữ nguyên detail
        return nextDetail;
      }

      const unit = this.normalizeText(
        typeof nextDetail.don_vi === 'string' ? nextDetail.don_vi : '',
      );
      const servingUnit = this.normalizeText(food.don_vi_khau_phan ?? '');
      const denominator =
        unit === 'g'
          ? 100
          : unit && servingUnit && unit === servingUnit
            ? Number(food.khau_phan_tham_chieu || 100)
            : 100;
      const ratio = quantity / (denominator > 0 ? denominator : 100);
      nextDetail.don_vi =
        typeof nextDetail.don_vi === 'string'
          ? nextDetail.don_vi
          : (food.don_vi_khau_phan ?? 'g');
      nextDetail.calories = Number(food.calories_100g || 0) * ratio;
      nextDetail.protein_g = Number(food.protein_100g || 0) * ratio;
      nextDetail.carb_g = Number(food.carb_100g || 0) * ratio;
      nextDetail.fat_g = Number(food.fat_100g || 0) * ratio;
      return nextDetail;
    }

    return nextDetail;
  }

  private toFoodSuggestion(food: ThucPhamEntity) {
    return {
      id: food.id,
      ten: food.ten,
      nhom_thuc_pham: food.nhom_thuc_pham?.ten ?? null,
      calories_100g: Number(food.calories_100g),
      protein_100g: Number(food.protein_100g),
      carb_100g: Number(food.carb_100g),
      fat_100g: Number(food.fat_100g),
    };
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

  private toRecommendationResponse(recommendation: KhuyenNghiAiEntity) {
    return {
      id: recommendation.id,
      loai_khuyen_nghi: recommendation.loai_khuyen_nghi,
      trang_thai: recommendation.trang_thai,
      ngay_muc_tieu: recommendation.ngay_muc_tieu,
      muc_tieu_calories: recommendation.muc_tieu_calories
        ? Number(recommendation.muc_tieu_calories)
        : null,
      muc_tieu_protein_g: recommendation.muc_tieu_protein_g
        ? Number(recommendation.muc_tieu_protein_g)
        : null,
      muc_tieu_carb_g: recommendation.muc_tieu_carb_g
        ? Number(recommendation.muc_tieu_carb_g)
        : null,
      muc_tieu_fat_g: recommendation.muc_tieu_fat_g
        ? Number(recommendation.muc_tieu_fat_g)
        : null,
      canh_bao: recommendation.canh_bao ?? [],
      ly_giai: recommendation.ly_giai,
      du_lieu_khuyen_nghi: recommendation.du_lieu_khuyen_nghi,
      ke_hoach_an_da_ap_dung_id: recommendation.ke_hoach_an_da_ap_dung_id,
      tao_luc: recommendation.tao_luc,
      cap_nhat_luc: recommendation.cap_nhat_luc,
    };
  }

  private toNullableInt(value: unknown) {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
