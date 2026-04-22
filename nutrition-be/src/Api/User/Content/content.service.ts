import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  FindOptionsWhere,
  ILike,
  In,
  IsNull,
  Repository,
} from 'typeorm';
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';
import { BaiVietEntity } from '../../Nutritionist/Article/entities/bai-viet.entity';
import {
  ChiTietThucDonMauEntity,
  ThucDonMauEntity,
} from '../../Nutritionist/MealTemplate/entities/thuc-don-mau.entity';
import { CongThucEntity } from '../../Nutritionist/Recipe/entities/cong-thuc.entity';
import { ThucPhamEntity } from '../../Admin/Food/entities/thuc-pham.entity';
import {
  ChiTietKeHoachAnEntity,
  KeHoachAnEntity,
  UserMealType,
} from '../MealPlan/entities/ke-hoach-an.entity';
import {
  CopyMealPlanFromTemplateDto,
  UserArticleQueryDto,
  UserMealPlanQueryDto,
  UserMealTemplateQueryDto,
} from './dto/content-query.dto';

@Injectable()
export class UserContentService {
  constructor(
    @InjectRepository(TaiKhoanEntity)
    private readonly accountRepo: Repository<TaiKhoanEntity>,
    @InjectRepository(BaiVietEntity)
    private readonly articleRepo: Repository<BaiVietEntity>,
    @InjectRepository(ThucDonMauEntity)
    private readonly mealTemplateRepo: Repository<ThucDonMauEntity>,
    @InjectRepository(ChiTietThucDonMauEntity)
    private readonly mealTemplateDetailRepo: Repository<ChiTietThucDonMauEntity>,
    @InjectRepository(CongThucEntity)
    private readonly recipeRepo: Repository<CongThucEntity>,
    @InjectRepository(ThucPhamEntity)
    private readonly foodRepo: Repository<ThucPhamEntity>,
    @InjectRepository(KeHoachAnEntity)
    private readonly mealPlanRepo: Repository<KeHoachAnEntity>,
    @InjectRepository(ChiTietKeHoachAnEntity)
    private readonly mealPlanDetailRepo: Repository<ChiTietKeHoachAnEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getPublishedArticles(
    userId: number | undefined,
    query: UserArticleQueryDto,
  ) {
    await this.getActiveUser(userId);

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(50, query.limit ?? 10));
    const where: FindOptionsWhere<BaiVietEntity> = {
      trang_thai: 'xuat_ban',
      xoa_luc: IsNull(),
    };

    if (query.search?.trim()) {
      where.tieu_de = ILike(`%${query.search.trim()}%`);
    }
    if (query.danhMuc?.trim()) {
      where.danh_muc = query.danhMuc.trim();
    }

    const [items, total] = await this.articleRepo.findAndCount({
      where,
      relations: ['tac_gia'],
      order: { xuat_ban_luc: 'DESC', tao_luc: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      success: true,
      message: 'Lay danh sach bai viet thanh cong',
      data: {
        items: items.map((item) => this.toPublicArticle(item)),
        pagination: { page, limit, total },
      },
    };
  }

  async getPublishedArticleDetail(userId: number | undefined, slug: string) {
    await this.getActiveUser(userId);

    const article = await this.articleRepo.findOne({
      where: {
        slug,
        trang_thai: 'xuat_ban',
        xoa_luc: IsNull(),
      },
      relations: ['tac_gia'],
    });

    if (!article) {
      throw new NotFoundException('Khong tim thay bai viet');
    }

    return {
      success: true,
      message: 'Lay chi tiet bai viet thanh cong',
      data: this.toPublicArticle(article),
    };
  }

  async getPublishedMealTemplates(
    userId: number | undefined,
    query: UserMealTemplateQueryDto,
  ) {
    await this.getActiveUser(userId);

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(50, query.limit ?? 10));
    const where: FindOptionsWhere<ThucDonMauEntity> = {
      trang_thai: 'xuat_ban',
      xoa_luc: IsNull(),
    };
    if (query.loaiMucTieu?.trim()) {
      const goalType = this.parseGoalType(query.loaiMucTieu.trim());
      where.loai_muc_tieu_phu_hop = goalType;
    }

    const [items, total] = await this.mealTemplateRepo.findAndCount({
      where,
      relations: ['nguoi_tao'],
      order: { tao_luc: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      success: true,
      message: 'Lay danh sach thuc don mau thanh cong',
      data: {
        items: items.map((item) => ({
          id: item.id,
          tieu_de: item.tieu_de,
          mo_ta: item.mo_ta,
          loai_muc_tieu_phu_hop: item.loai_muc_tieu_phu_hop,
          calories_muc_tieu:
            item.calories_muc_tieu !== null
              ? Number(item.calories_muc_tieu)
              : null,
          tac_gia: item.nguoi_tao
            ? {
                id: item.nguoi_tao.id,
                ho_ten: item.nguoi_tao.ho_ten,
              }
            : null,
          tao_luc: item.tao_luc,
          cap_nhat_luc: item.cap_nhat_luc,
        })),
        pagination: { page, limit, total },
      },
    };
  }

  async getPublishedMealTemplateDetail(
    userId: number | undefined,
    templateId: number,
  ) {
    await this.getActiveUser(userId);

    const template = await this.mealTemplateRepo.findOne({
      where: {
        id: templateId,
        trang_thai: 'xuat_ban',
        xoa_luc: IsNull(),
      },
      relations: ['nguoi_tao'],
    });

    if (!template) {
      throw new NotFoundException('Khong tim thay thuc don mau');
    }

    const details = await this.mealTemplateDetailRepo.find({
      where: { thuc_don_mau_id: template.id },
      order: { ngay_so: 'ASC', loai_bua_an: 'ASC', thu_tu: 'ASC' },
    });

    const recipeMap = await this.getRecipeMap(
      details.map((item) => item.cong_thuc_id),
    );
    const foodMap = await this.getFoodMap(
      details.map((item) => item.thuc_pham_id),
    );

    return {
      success: true,
      message: 'Lay chi tiet thuc don mau thanh cong',
      data: {
        id: template.id,
        tieu_de: template.tieu_de,
        mo_ta: template.mo_ta,
        loai_muc_tieu_phu_hop: template.loai_muc_tieu_phu_hop,
        calories_muc_tieu:
          template.calories_muc_tieu !== null
            ? Number(template.calories_muc_tieu)
            : null,
        tac_gia: template.nguoi_tao
          ? {
              id: template.nguoi_tao.id,
              ho_ten: template.nguoi_tao.ho_ten,
            }
          : null,
        chi_tiet: details.map((detail) => ({
          id: detail.id,
          ngay_so: detail.ngay_so,
          loai_bua_an: detail.loai_bua_an,
          cong_thuc_id: detail.cong_thuc_id,
          thuc_pham_id: detail.thuc_pham_id,
          ten_mon:
            (detail.cong_thuc_id
              ? recipeMap.get(detail.cong_thuc_id)?.ten
              : null) ||
            (detail.thuc_pham_id
              ? foodMap.get(detail.thuc_pham_id)?.ten
              : null) ||
            null,
          so_luong: detail.so_luong !== null ? Number(detail.so_luong) : null,
          don_vi: detail.don_vi,
          ghi_chu: detail.ghi_chu,
          thu_tu: detail.thu_tu,
        })),
      },
    };
  }

  async copyMealPlanFromTemplate(
    userId: number | undefined,
    templateId: number,
    dto: CopyMealPlanFromTemplateDto,
  ) {
    const user = await this.getActiveUser(userId);

    const template = await this.mealTemplateRepo.findOne({
      where: {
        id: templateId,
        trang_thai: 'xuat_ban',
        xoa_luc: IsNull(),
      },
    });
    if (!template) {
      throw new NotFoundException('Khong tim thay thuc don mau');
    }

    const details = await this.mealTemplateDetailRepo.find({
      where: { thuc_don_mau_id: template.id },
      order: { ngay_so: 'ASC', loai_bua_an: 'ASC', thu_tu: 'ASC' },
    });
    if (details.length === 0) {
      throw new BadRequestException(
        'Thuc don mau chua co chi tiet de sao chep',
      );
    }

    const ngayApDung = this.resolveNgayApDung(dto.ngayApDung);
    const tieuDe = dto.tieuDe?.trim() || `${template.tieu_de} - ban sao`;

    const recipeMap = await this.getRecipeMap(
      details.map((item) => item.cong_thuc_id),
    );
    const foodMap = await this.getFoodMap(
      details.map((item) => item.thuc_pham_id),
    );

    const created = await this.dataSource.transaction(async (manager) => {
      const now = new Date();
      const planRepo = manager.getRepository(KeHoachAnEntity);
      const planDetailRepo = manager.getRepository(ChiTietKeHoachAnEntity);

      const plan = await planRepo.save(
        planRepo.create({
          tai_khoan_id: user.id,
          loai_nguon: 'thuc_don_mau',
          nguon_id: template.id,
          tieu_de: tieuDe,
          mo_ta: template.mo_ta,
          ngay_ap_dung: ngayApDung,
          trang_thai: 'ban_nhap',
          tong_calories: null,
          tong_protein_g: null,
          tong_carb_g: null,
          tong_fat_g: null,
          tao_luc: now,
          cap_nhat_luc: now,
        }),
      );

      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarb = 0;
      let totalFat = 0;

      const createdDetails: Array<{
        loai_bua_an: string;
        ten_mon: string | null;
        so_luong: number | null;
        don_vi: string | null;
      }> = [];

      for (const detail of details) {
        const nutrition = this.resolveNutrition(detail, recipeMap, foodMap);
        totalCalories += nutrition.calories;
        totalProtein += nutrition.protein;
        totalCarb += nutrition.carb;
        totalFat += nutrition.fat;

        await planDetailRepo.save(
          planDetailRepo.create({
            ke_hoach_an_id: plan.id,
            loai_bua_an: detail.loai_bua_an as UserMealType,
            cong_thuc_id: detail.cong_thuc_id,
            thuc_pham_id: detail.thuc_pham_id,
            so_luong: detail.so_luong !== null ? String(detail.so_luong) : null,
            don_vi: detail.don_vi,
            calories:
              nutrition.calories > 0 ? nutrition.calories.toFixed(2) : null,
            protein_g:
              nutrition.protein > 0 ? nutrition.protein.toFixed(2) : null,
            carb_g: nutrition.carb > 0 ? nutrition.carb.toFixed(2) : null,
            fat_g: nutrition.fat > 0 ? nutrition.fat.toFixed(2) : null,
            ghi_chu: detail.ghi_chu,
            thu_tu: detail.thu_tu,
            tao_luc: now,
            cap_nhat_luc: now,
          }),
        );

        createdDetails.push({
          loai_bua_an: detail.loai_bua_an,
          ten_mon:
            (detail.cong_thuc_id
              ? recipeMap.get(detail.cong_thuc_id)?.ten
              : null) ||
            (detail.thuc_pham_id
              ? foodMap.get(detail.thuc_pham_id)?.ten
              : null) ||
            null,
          so_luong: detail.so_luong !== null ? Number(detail.so_luong) : null,
          don_vi: detail.don_vi,
        });
      }

      plan.tong_calories = totalCalories > 0 ? totalCalories.toFixed(2) : null;
      plan.tong_protein_g = totalProtein > 0 ? totalProtein.toFixed(2) : null;
      plan.tong_carb_g = totalCarb > 0 ? totalCarb.toFixed(2) : null;
      plan.tong_fat_g = totalFat > 0 ? totalFat.toFixed(2) : null;
      plan.cap_nhat_luc = now;
      await planRepo.save(plan);

      return {
        id: plan.id,
        tieu_de: plan.tieu_de,
        ngay_ap_dung: plan.ngay_ap_dung,
        trang_thai: plan.trang_thai,
        tong_calories:
          plan.tong_calories !== null ? Number(plan.tong_calories) : null,
        tong_protein_g:
          plan.tong_protein_g !== null ? Number(plan.tong_protein_g) : null,
        tong_carb_g:
          plan.tong_carb_g !== null ? Number(plan.tong_carb_g) : null,
        tong_fat_g: plan.tong_fat_g !== null ? Number(plan.tong_fat_g) : null,
        so_luong_chi_tiet: createdDetails.length,
        chi_tiet_tom_tat: createdDetails,
      };
    });

    return {
      success: true,
      message: 'Sao chep thuc don mau thanh ke hoach an thanh cong',
      data: created,
    };
  }

  async getUserMealPlans(
    userId: number | undefined,
    query: UserMealPlanQueryDto,
  ) {
    const user = await this.getActiveUser(userId);
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(50, query.limit ?? 10));

    const qb = this.mealPlanRepo
      .createQueryBuilder('plan')
      .where('plan.tai_khoan_id = :userId', { userId: user.id });

    if (query.trangThai) {
      qb.andWhere('plan.trang_thai = :status', { status: query.trangThai });
    }
    if (query.from) {
      qb.andWhere('plan.ngay_ap_dung >= :from', { from: query.from });
    }
    if (query.to) {
      qb.andWhere('plan.ngay_ap_dung <= :to', { to: query.to });
    }

    qb.orderBy('plan.ngay_ap_dung', 'DESC')
      .addOrderBy('plan.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      success: true,
      message: 'Lay danh sach ke hoach an thanh cong',
      data: {
        items: items.map((item) => this.toUserMealPlanSummary(item)),
        pagination: { page, limit, total },
      },
    };
  }

  async getUserMealPlanDetail(userId: number | undefined, mealPlanId: number) {
    const user = await this.getActiveUser(userId);
    if (!Number.isFinite(mealPlanId) || mealPlanId <= 0) {
      throw new BadRequestException('ID ke hoach an khong hop le');
    }

    const mealPlan = await this.mealPlanRepo.findOne({
      where: { id: mealPlanId, tai_khoan_id: user.id },
    });
    if (!mealPlan) {
      throw new NotFoundException('Khong tim thay ke hoach an');
    }

    const details = await this.mealPlanDetailRepo.find({
      where: { ke_hoach_an_id: mealPlan.id },
      order: { loai_bua_an: 'ASC', thu_tu: 'ASC', id: 'ASC' },
    });
    const recipeMap = await this.getRecipeMap(
      details.map((item) => item.cong_thuc_id),
    );
    const foodMap = await this.getFoodMap(
      details.map((item) => item.thuc_pham_id),
    );

    return {
      success: true,
      message: 'Lay chi tiet ke hoach an thanh cong',
      data: {
        ...this.toUserMealPlanSummary(mealPlan),
        chi_tiet: details.map((detail) => ({
          id: detail.id,
          loai_bua_an: detail.loai_bua_an,
          cong_thuc_id: detail.cong_thuc_id,
          thuc_pham_id: detail.thuc_pham_id,
          ten_mon:
            (detail.cong_thuc_id
              ? recipeMap.get(detail.cong_thuc_id)?.ten
              : null) ||
            (detail.thuc_pham_id
              ? foodMap.get(detail.thuc_pham_id)?.ten
              : null) ||
            null,
          so_luong: detail.so_luong !== null ? Number(detail.so_luong) : null,
          don_vi: detail.don_vi,
          calories: detail.calories !== null ? Number(detail.calories) : null,
          protein_g:
            detail.protein_g !== null ? Number(detail.protein_g) : null,
          carb_g: detail.carb_g !== null ? Number(detail.carb_g) : null,
          fat_g: detail.fat_g !== null ? Number(detail.fat_g) : null,
          ghi_chu: detail.ghi_chu,
          thu_tu: detail.thu_tu,
        })),
      },
    };
  }

  private resolveNutrition(
    detail: ChiTietThucDonMauEntity,
    recipeMap: Map<number, CongThucEntity>,
    foodMap: Map<number, ThucPhamEntity>,
  ) {
    if (detail.cong_thuc_id) {
      const recipe = recipeMap.get(detail.cong_thuc_id);
      return {
        calories: Number(recipe?.tong_calories ?? 0),
        protein: Number(recipe?.tong_protein_g ?? 0),
        carb: Number(recipe?.tong_carb_g ?? 0),
        fat: Number(recipe?.tong_fat_g ?? 0),
      };
    }

    if (detail.thuc_pham_id) {
      const food = foodMap.get(detail.thuc_pham_id);
      const quantity = Number(detail.so_luong ?? 0);
      const factor = quantity > 0 ? quantity / 100 : 0;
      return {
        calories: Number(food?.calories_100g ?? 0) * factor,
        protein: Number(food?.protein_100g ?? 0) * factor,
        carb: Number(food?.carb_100g ?? 0) * factor,
        fat: Number(food?.fat_100g ?? 0) * factor,
      };
    }

    return { calories: 0, protein: 0, carb: 0, fat: 0 };
  }

  private async getRecipeMap(ids: Array<number | null | undefined>) {
    const validIds = [...new Set(ids.filter((id): id is number => !!id))];
    if (validIds.length === 0) return new Map<number, CongThucEntity>();

    const recipes = await this.recipeRepo.find({
      where: { id: In(validIds), xoa_luc: IsNull() },
      select: [
        'id',
        'ten',
        'tong_calories',
        'tong_protein_g',
        'tong_carb_g',
        'tong_fat_g',
      ],
    });
    return new Map(recipes.map((item) => [item.id, item]));
  }

  private async getFoodMap(ids: Array<number | null | undefined>) {
    const validIds = [...new Set(ids.filter((id): id is number => !!id))];
    if (validIds.length === 0) return new Map<number, ThucPhamEntity>();

    const foods = await this.foodRepo.find({
      where: { id: In(validIds), xoa_luc: IsNull() },
      select: [
        'id',
        'ten',
        'calories_100g',
        'protein_100g',
        'carb_100g',
        'fat_100g',
      ],
    });
    return new Map(foods.map((item) => [item.id, item]));
  }

  private toPublicArticle(item: BaiVietEntity) {
    return {
      id: item.id,
      tieu_de: item.tieu_de,
      slug: item.slug,
      danh_muc: item.danh_muc,
      the_gan: item.the_gan,
      tom_tat: item.tom_tat,
      noi_dung: item.noi_dung,
      anh_dai_dien_url: item.anh_dai_dien_url,
      tac_gia: item.tac_gia
        ? {
            id: item.tac_gia.id,
            ho_ten: item.tac_gia.ho_ten,
          }
        : null,
      xuat_ban_luc: item.xuat_ban_luc,
      tao_luc: item.tao_luc,
      cap_nhat_luc: item.cap_nhat_luc,
    };
  }

  private toUserMealPlanSummary(item: KeHoachAnEntity) {
    return {
      id: item.id,
      loai_nguon: item.loai_nguon,
      nguon_id: item.nguon_id,
      tieu_de: item.tieu_de,
      mo_ta: item.mo_ta,
      ngay_ap_dung: item.ngay_ap_dung,
      trang_thai: item.trang_thai,
      tong_calories:
        item.tong_calories !== null ? Number(item.tong_calories) : null,
      tong_protein_g:
        item.tong_protein_g !== null ? Number(item.tong_protein_g) : null,
      tong_carb_g: item.tong_carb_g !== null ? Number(item.tong_carb_g) : null,
      tong_fat_g: item.tong_fat_g !== null ? Number(item.tong_fat_g) : null,
      tao_luc: item.tao_luc,
      cap_nhat_luc: item.cap_nhat_luc,
    };
  }

  private resolveNgayApDung(input?: string) {
    if (!input) {
      return this.formatDate(new Date());
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      throw new BadRequestException(
        'ngayApDung khong dung dinh dang YYYY-MM-DD',
      );
    }

    const parsed = new Date(`${input}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('ngayApDung khong hop le');
    }

    return input;
  }

  private parseGoalType(value: string) {
    const normalized = value.trim();
    if (
      normalized !== 'giam_can' &&
      normalized !== 'tang_can' &&
      normalized !== 'giu_can'
    ) {
      throw new BadRequestException('loaiMucTieu khong hop le');
    }

    return normalized;
  }

  private formatDate(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private async getActiveUser(userId?: number) {
    if (!userId) {
      throw new UnauthorizedException('Phien dang nhap khong hop le');
    }

    const user = await this.accountRepo.findOne({
      where: { id: userId, vai_tro: 'nguoi_dung' },
    });
    if (!user || user.trang_thai !== 'hoat_dong') {
      throw new UnauthorizedException('Tai khoan khong hop le');
    }

    return user;
  }
}
