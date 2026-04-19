import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { FoodReviewQueryDto } from './dto/food-review-query.dto';
import { ApproveReviewDto, RejectReviewDto } from './dto/review-action.dto';
import {
  ReviewRequestStatus,
  YeuCauDuyetThucPhamEntity,
} from './entities/yeu-cau-duyet-thuc-pham.entity';
import { ThongBaoEntity } from './entities/thong-bao.entity';
import { ThucPhamEntity } from '../Food/entities/thuc-pham.entity';
import type { FoodSourceType } from '../Food/food.types';
import { TaiKhoanEntity } from '../User/entities/tai-khoan.entity';

type SuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

export type PublicReviewRequest = {
  id: number;
  thuc_pham_id: number | null;
  loai_yeu_cau: string;
  ten_nguon: string | null;
  ma_nguon: string | null;
  de_xuat_boi: number;
  nguoi_de_xuat: { id: number; ho_ten: string; email: string } | null;
  trang_thai: ReviewRequestStatus;
  du_lieu_hien_tai: Record<string, unknown> | null;
  du_lieu_de_xuat: Record<string, unknown>;
  ly_do: string | null;
  duyet_boi: number | null;
  nguoi_duyet: { id: number; ho_ten: string; email: string } | null;
  duyet_luc: string | null;
  ghi_chu_duyet: string | null;
  tao_luc: string;
  cap_nhat_luc: string;
};

@Injectable()
export class FoodReviewService {
  constructor(
    @InjectRepository(YeuCauDuyetThucPhamEntity)
    private readonly reviewRepository: Repository<YeuCauDuyetThucPhamEntity>,
    @InjectRepository(ThucPhamEntity)
    private readonly foodRepository: Repository<ThucPhamEntity>,
    @InjectRepository(ThongBaoEntity)
    private readonly notificationRepository: Repository<ThongBaoEntity>,
    @InjectRepository(TaiKhoanEntity)
    private readonly userRepository: Repository<TaiKhoanEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: FoodReviewQueryDto): Promise<
    SuccessResponse<{
      items: PublicReviewRequest[];
      pagination: { page: number; limit: number; total: number };
    }>
  > {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<YeuCauDuyetThucPhamEntity> = {};

    if (query.trangThai) {
      where.trang_thai = query.trangThai as ReviewRequestStatus;
    }

    const [items, total] = await this.reviewRepository.findAndCount({
      where,
      relations: ['nguoi_de_xuat', 'nguoi_duyet'],
      order: { tao_luc: 'DESC' },
      skip,
      take: limit,
    });

    return {
      success: true,
      message: 'Lay danh sach yeu cau duyet thanh cong',
      data: {
        items: items.map((item) => this.toPublicReview(item)),
        pagination: { page, limit, total },
      },
    };
  }

  async findOne(id: number): Promise<SuccessResponse<PublicReviewRequest>> {
    const review = await this.findReviewById(id);

    return {
      success: true,
      message: 'Lay chi tiet yeu cau duyet thanh cong',
      data: this.toPublicReview(review),
    };
  }

  async approve(
    id: number,
    dto: ApproveReviewDto,
    actorId: number,
  ): Promise<SuccessResponse<PublicReviewRequest>> {
    const review = await this.findReviewById(id);

    if (review.trang_thai !== 'cho_duyet') {
      throw new BadRequestException('Yeu cau nay da duoc xu ly');
    }

    const now = new Date();

    const updatedReview = await this.dataSource.transaction(async (manager) => {
      // 1. Cập nhật trạng thái yêu cầu
      review.trang_thai = 'da_duyet';
      review.duyet_boi = actorId;
      review.duyet_luc = now;
      review.ghi_chu_duyet = dto.ghiChuDuyet?.trim() || null;
      review.cap_nhat_luc = now;

      await manager.save(YeuCauDuyetThucPhamEntity, review);

      // 2. Auto-merge du_lieu_de_xuat vào thuc_pham
      await this.mergeFoodData(manager, review, actorId, now);

      // 3. Tạo thông báo cho người đề xuất
      await this.createNotification(
        manager,
        review.de_xuat_boi,
        'duyet_de_xuat',
        'Đề xuất đã được duyệt',
        `Đề xuất sửa dữ liệu thực phẩm #${review.id} đã được admin duyệt.${dto.ghiChuDuyet ? ` Ghi chú: ${dto.ghiChuDuyet}` : ''}`,
        `/nutritionist/food-review-requests/${review.id}`,
        now,
      );

      // Reload relations
      return manager.findOne(YeuCauDuyetThucPhamEntity, {
        where: { id: review.id },
        relations: ['nguoi_de_xuat', 'nguoi_duyet'],
      });
    });

    return {
      success: true,
      message: 'Duyet yeu cau thanh cong',
      data: this.toPublicReview(updatedReview!),
    };
  }

  async reject(
    id: number,
    dto: RejectReviewDto,
    actorId: number,
  ): Promise<SuccessResponse<PublicReviewRequest>> {
    const review = await this.findReviewById(id);

    if (review.trang_thai !== 'cho_duyet') {
      throw new BadRequestException('Yeu cau nay da duoc xu ly');
    }

    const now = new Date();

    const updatedReview = await this.dataSource.transaction(async (manager) => {
      // 1. Cập nhật trạng thái
      review.trang_thai = 'tu_choi';
      review.duyet_boi = actorId;
      review.duyet_luc = now;
      review.ghi_chu_duyet = dto.ghiChuDuyet.trim();
      review.cap_nhat_luc = now;

      await manager.save(YeuCauDuyetThucPhamEntity, review);

      // 2. Tạo thông báo cho người đề xuất
      await this.createNotification(
        manager,
        review.de_xuat_boi,
        'tu_choi_de_xuat',
        'Đề xuất bị từ chối',
        `Đề xuất sửa dữ liệu thực phẩm #${review.id} đã bị từ chối. Lý do: ${dto.ghiChuDuyet}`,
        `/nutritionist/food-review-requests/${review.id}`,
        now,
      );

      return manager.findOne(YeuCauDuyetThucPhamEntity, {
        where: { id: review.id },
        relations: ['nguoi_de_xuat', 'nguoi_duyet'],
      });
    });

    return {
      success: true,
      message: 'Tu choi yeu cau thanh cong',
      data: this.toPublicReview(updatedReview!),
    };
  }

  // Auto-merge du_lieu_de_xuat vào thuc_pham khi duyệt
  private async mergeFoodData(
    manager: typeof this.dataSource.manager,
    review: YeuCauDuyetThucPhamEntity,
    actorId: number,
    now: Date,
  ): Promise<void> {
    const proposed = review.du_lieu_de_xuat;

    if (review.thuc_pham_id) {
      // Update thực phẩm hiện có
      const food = await manager.findOne(ThucPhamEntity, {
        where: { id: review.thuc_pham_id, xoa_luc: IsNull() },
      });

      if (food) {
        const fields = [
          'ten',
          'mo_ta',
          'the_gan',
          'loai_nguon',
          'ten_nguon',
          'ma_nguon',
          'khau_phan_tham_chieu',
          'don_vi_khau_phan',
          'calories_100g',
          'protein_100g',
          'carb_100g',
          'fat_100g',
          'chat_xo_100g',
          'duong_100g',
          'natri_100g',
          'da_xac_minh',
        ];

        for (const field of fields) {
          if (proposed[field] !== undefined) {
            (food as unknown as Record<string, unknown>)[field] =
              proposed[field];
          }
        }

        food.cap_nhat_boi = actorId;
        food.cap_nhat_luc = now;

        await manager.save(ThucPhamEntity, food);
      }
    } else if (proposed['ten'] && proposed['nhom_thuc_pham_id']) {
      // Tạo thực phẩm mới từ dữ liệu đề xuất
      const slug = this.slugify(proposed['ten'] as string);

      const newFood = manager.create(ThucPhamEntity, {
        nhom_thuc_pham_id: proposed['nhom_thuc_pham_id'] as number,
        ten: (proposed['ten'] as string).trim(),
        slug,
        mo_ta: (proposed['mo_ta'] as string) || null,
        the_gan: (proposed['the_gan'] as string[]) || [],
        loai_nguon: ((proposed['loai_nguon'] as string) ||
          'api_ngoai') as FoodSourceType,
        ten_nguon: (proposed['ten_nguon'] as string) || review.ten_nguon,
        ma_nguon: (proposed['ma_nguon'] as string) || review.ma_nguon,
        khau_phan_tham_chieu: String(proposed['khau_phan_tham_chieu'] ?? 100),
        don_vi_khau_phan: (proposed['don_vi_khau_phan'] as string) || 'g',
        calories_100g: String(proposed['calories_100g'] ?? 0),
        protein_100g: String(proposed['protein_100g'] ?? 0),
        carb_100g: String(proposed['carb_100g'] ?? 0),
        fat_100g: String(proposed['fat_100g'] ?? 0),
        chat_xo_100g: String(proposed['chat_xo_100g'] ?? 0),
        duong_100g: String(proposed['duong_100g'] ?? 0),
        natri_100g: String(proposed['natri_100g'] ?? 0),
        da_xac_minh: (proposed['da_xac_minh'] as boolean) ?? true,
        tao_boi: review.de_xuat_boi,
        cap_nhat_boi: actorId,
        tao_luc: now,
        cap_nhat_luc: now,
        xoa_luc: null,
      });

      await manager.save(ThucPhamEntity, newFood);
    }
  }

  private async createNotification(
    manager: typeof this.dataSource.manager,
    taiKhoanId: number,
    loai: string,
    tieuDe: string,
    noiDung: string,
    duongDan: string | null,
    now: Date,
  ): Promise<void> {
    const notification = manager.create(ThongBaoEntity, {
      tai_khoan_id: taiKhoanId,
      loai,
      tieu_de: tieuDe,
      noi_dung: noiDung,
      trang_thai: 'chua_doc',
      duong_dan_hanh_dong: duongDan,
      tao_luc: now,
      doc_luc: null,
      cap_nhat_luc: now,
    });

    await manager.save(ThongBaoEntity, notification);
  }

  private async findReviewById(id: number): Promise<YeuCauDuyetThucPhamEntity> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['nguoi_de_xuat', 'nguoi_duyet'],
    });

    if (!review) {
      throw new NotFoundException('Yeu cau duyet khong ton tai');
    }

    return review;
  }

  private toPublicReview(
    review: YeuCauDuyetThucPhamEntity,
  ): PublicReviewRequest {
    return {
      id: review.id,
      thuc_pham_id: review.thuc_pham_id,
      loai_yeu_cau: review.loai_yeu_cau,
      ten_nguon: review.ten_nguon,
      ma_nguon: review.ma_nguon,
      de_xuat_boi: review.de_xuat_boi,
      nguoi_de_xuat: review.nguoi_de_xuat
        ? {
            id: review.nguoi_de_xuat.id,
            ho_ten: review.nguoi_de_xuat.ho_ten,
            email: review.nguoi_de_xuat.email,
          }
        : null,
      trang_thai: review.trang_thai,
      du_lieu_hien_tai: review.du_lieu_hien_tai,
      du_lieu_de_xuat: review.du_lieu_de_xuat,
      ly_do: review.ly_do,
      duyet_boi: review.duyet_boi,
      nguoi_duyet: review.nguoi_duyet
        ? {
            id: review.nguoi_duyet.id,
            ho_ten: review.nguoi_duyet.ho_ten,
            email: review.nguoi_duyet.email,
          }
        : null,
      duyet_luc: review.duyet_luc?.toISOString() ?? null,
      ghi_chu_duyet: review.ghi_chu_duyet,
      tao_luc: review.tao_luc.toISOString(),
      cap_nhat_luc: review.cap_nhat_luc.toISOString(),
    };
  }

  private slugify(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
