import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { BaiVietEntity } from '../Article/entities/bai-viet.entity';
import { CongThucEntity } from '../Recipe/entities/cong-thuc.entity';
import { ThucDonMauEntity } from '../MealTemplate/entities/thuc-don-mau.entity';
import { YeuCauDuyetThucPhamEntity } from '../../Admin/FoodReview/entities/yeu-cau-duyet-thuc-pham.entity';
import { ThongBaoEntity } from '../../Admin/FoodReview/entities/thong-bao.entity';

@Injectable()
export class NutritionistDashboardService {
  constructor(
    @InjectRepository(BaiVietEntity) private readonly articleRepo: Repository<BaiVietEntity>,
    @InjectRepository(CongThucEntity) private readonly recipeRepo: Repository<CongThucEntity>,
    @InjectRepository(ThucDonMauEntity) private readonly mealRepo: Repository<ThucDonMauEntity>,
    @InjectRepository(YeuCauDuyetThucPhamEntity)
    private readonly reviewRepo: Repository<YeuCauDuyetThucPhamEntity>,
    @InjectRepository(ThongBaoEntity) private readonly notifRepo: Repository<ThongBaoEntity>,
  ) {}

  async getSummary(userId: number) {
    const baseArticle: FindOptionsWhere<BaiVietEntity> = { tac_gia_id: userId, xoa_luc: IsNull() };
    const baseRecipe: FindOptionsWhere<CongThucEntity> = { tao_boi: userId, xoa_luc: IsNull() };
    const baseMeal: FindOptionsWhere<ThucDonMauEntity> = { tao_boi: userId, xoa_luc: IsNull() };
    const baseReview: FindOptionsWhere<YeuCauDuyetThucPhamEntity> = { de_xuat_boi: userId };

    const [
      articles,
      recipes,
      mealTemplates,
      pendingReviews,
      approvedReviews,
      rejectedReviews,
      unreadNotifications,
    ] = await Promise.all([
      this.articleRepo.count({ where: baseArticle }),
      this.recipeRepo.count({ where: baseRecipe }),
      this.mealRepo.count({ where: baseMeal }),
      this.reviewRepo.count({ where: { ...baseReview, trang_thai: 'cho_duyet' } }),
      this.reviewRepo.count({ where: { ...baseReview, trang_thai: 'da_duyet' } }),
      this.reviewRepo.count({ where: { ...baseReview, trang_thai: 'tu_choi' } }),
      this.notifRepo.count({
        where: { tai_khoan_id: userId, trang_thai: 'chua_doc' },
      }),
    ]);

    return {
      success: true,
      data: {
        articles,
        recipes,
        mealTemplates,
        pendingReviews,
        approvedReviews,
        rejectedReviews,
        unreadNotifications,
      },
    };
  }
}
