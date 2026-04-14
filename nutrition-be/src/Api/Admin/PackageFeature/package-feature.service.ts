import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  CreatePackageFeatureDto,
  UpdatePackageFeatureDto,
} from './dto/package-feature.dto';
import {
  ChucNangGoiDichVuEntity,
  LimitType,
} from './entities/chuc-nang-goi-dich-vu.entity';
import { GoiDichVuEntity } from '../Package/entities/goi-dich-vu.entity';

type SuccessResponse<T> = { success: true; message: string; data: T };

export type PublicPackageFeature = {
  id: number;
  goi_dich_vu_id: number;
  ma_chuc_nang: string;
  ten_chuc_nang: string;
  mo_ta: string | null;
  duoc_phep_su_dung: boolean;
  gioi_han_so_lan: number | null;
  gioi_han_theo: LimitType;
  tao_luc: string;
  cap_nhat_luc: string;
};

// Danh sách mã chức năng chuẩn theo spec
export const STANDARD_FEATURE_CODES = [
  { code: 'ai_chat', name: 'Chat với AI' },
  { code: 'ai_nutrition_recommendation', name: 'Khuyến nghị dinh dưỡng' },
  { code: 'ai_meal_recommendation', name: 'Khuyến nghị thực đơn' },
  { code: 'ai_health_management', name: 'Quản lý sức khỏe AI' },
  { code: 'ai_health_assessment', name: 'Đánh giá sức khỏe AI' },
  { code: 'meal_plan_create', name: 'Tạo kế hoạch ăn' },
  { code: 'nutrition_history_monthly', name: 'Xem lịch sử dinh dưỡng tháng' },
] as const;

@Injectable()
export class PackageFeatureService {
  constructor(
    @InjectRepository(ChucNangGoiDichVuEntity)
    private readonly featureRepository: Repository<ChucNangGoiDichVuEntity>,
    @InjectRepository(GoiDichVuEntity)
    private readonly packageRepository: Repository<GoiDichVuEntity>,
  ) {}

  async findAllByPackage(
    packageId: number,
  ): Promise<SuccessResponse<{ items: PublicPackageFeature[]; package_name: string }>> {
    await this.ensurePackageExists(packageId);

    const pkg = await this.packageRepository.findOne({
      where: { id: packageId, xoa_luc: IsNull() },
    });

    const items = await this.featureRepository.find({
      where: { goi_dich_vu_id: packageId },
      order: { ma_chuc_nang: 'ASC' },
    });

    return {
      success: true,
      message: 'Lay danh sach chuc nang theo goi thanh cong',
      data: {
        items: items.map((item) => this.toPublic(item)),
        package_name: pkg?.ten_goi ?? '',
      },
    };
  }

  async create(
    packageId: number,
    dto: CreatePackageFeatureDto,
  ): Promise<SuccessResponse<PublicPackageFeature>> {
    await this.ensurePackageExists(packageId);

    // Check unique (goi_dich_vu_id, ma_chuc_nang)
    const existing = await this.featureRepository.findOne({
      where: { goi_dich_vu_id: packageId, ma_chuc_nang: dto.maChucNang },
    });

    if (existing) {
      throw new BadRequestException(
        `Chuc nang "${dto.maChucNang}" da ton tai trong goi nay`,
      );
    }

    const now = new Date();

    const entity = this.featureRepository.create({
      goi_dich_vu_id: packageId,
      ma_chuc_nang: dto.maChucNang,
      ten_chuc_nang: dto.tenChucNang.trim(),
      mo_ta: dto.moTa?.trim() || null,
      duoc_phep_su_dung: dto.duocPhepSuDung ?? true,
      gioi_han_so_lan: dto.gioiHanSoLan ?? null,
      gioi_han_theo: (dto.gioiHanTheo as LimitType) ?? 'khong_gioi_han',
      tao_luc: now,
      cap_nhat_luc: now,
    });

    const saved = await this.featureRepository.save(entity);

    return {
      success: true,
      message: 'Them chuc nang vao goi thanh cong',
      data: this.toPublic(saved),
    };
  }

  async update(
    featureId: number,
    dto: UpdatePackageFeatureDto,
  ): Promise<SuccessResponse<PublicPackageFeature>> {
    const entity = await this.featureRepository.findOne({
      where: { id: featureId },
    });

    if (!entity) {
      throw new NotFoundException('Chuc nang khong ton tai');
    }

    if (dto.tenChucNang !== undefined) entity.ten_chuc_nang = dto.tenChucNang.trim();
    if (dto.moTa !== undefined) entity.mo_ta = dto.moTa?.trim() || null;
    if (dto.duocPhepSuDung !== undefined) entity.duoc_phep_su_dung = dto.duocPhepSuDung;
    if (dto.gioiHanSoLan !== undefined) entity.gioi_han_so_lan = dto.gioiHanSoLan;
    if (dto.gioiHanTheo !== undefined) entity.gioi_han_theo = dto.gioiHanTheo as LimitType;

    entity.cap_nhat_luc = new Date();

    const saved = await this.featureRepository.save(entity);

    return {
      success: true,
      message: 'Cap nhat chuc nang thanh cong',
      data: this.toPublic(saved),
    };
  }

  async remove(featureId: number): Promise<SuccessResponse<{ id: number }>> {
    const entity = await this.featureRepository.findOne({
      where: { id: featureId },
    });

    if (!entity) {
      throw new NotFoundException('Chuc nang khong ton tai');
    }

    await this.featureRepository.remove(entity);

    return {
      success: true,
      message: 'Xoa chuc nang thanh cong',
      data: { id: featureId },
    };
  }

  async getStandardFeatureCodes(): Promise<
    SuccessResponse<typeof STANDARD_FEATURE_CODES>
  > {
    return {
      success: true,
      message: 'Lay danh sach ma chuc nang chuan thanh cong',
      data: STANDARD_FEATURE_CODES,
    };
  }

  private async ensurePackageExists(packageId: number): Promise<void> {
    const pkg = await this.packageRepository.findOne({
      where: { id: packageId, xoa_luc: IsNull() },
    });

    if (!pkg) {
      throw new NotFoundException('Goi dich vu khong ton tai');
    }
  }

  private toPublic(entity: ChucNangGoiDichVuEntity): PublicPackageFeature {
    return {
      id: entity.id,
      goi_dich_vu_id: entity.goi_dich_vu_id,
      ma_chuc_nang: entity.ma_chuc_nang,
      ten_chuc_nang: entity.ten_chuc_nang,
      mo_ta: entity.mo_ta,
      duoc_phep_su_dung: Boolean(entity.duoc_phep_su_dung),
      gioi_han_so_lan: entity.gioi_han_so_lan,
      gioi_han_theo: entity.gioi_han_theo,
      tao_luc: entity.tao_luc.toISOString(),
      cap_nhat_luc: entity.cap_nhat_luc.toISOString(),
    };
  }
}
