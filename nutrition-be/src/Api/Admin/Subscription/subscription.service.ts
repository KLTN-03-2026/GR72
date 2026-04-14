import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import {
  CreateSubscriptionDto,
  SubscriptionQueryDto,
  UpdateSubscriptionDto,
} from './dto/subscription.dto';
import {
  DangKyGoiDichVuEntity,
  SubscriptionSource,
  SubscriptionStatus,
} from './entities/dang-ky-goi-dich-vu.entity';
import { GoiDichVuEntity } from '../Package/entities/goi-dich-vu.entity';
import { TaiKhoanEntity } from '../User/entities/tai-khoan.entity';

type SuccessResponse<T> = { success: true; message: string; data: T };

export type PublicSubscription = {
  id: number;
  tai_khoan_id: number;
  tai_khoan: { id: number; ho_ten: string; email: string } | null;
  goi_dich_vu_id: number;
  goi_dich_vu: { id: number; ten_goi: string; slug: string } | null;
  ma_dang_ky: string;
  trang_thai: SubscriptionStatus;
  ngay_bat_dau: string | null;
  ngay_het_han: string | null;
  tu_dong_gia_han: boolean;
  nguon_dang_ky: SubscriptionSource;
  ghi_chu: string | null;
  tao_luc: string;
  cap_nhat_luc: string;
};

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(DangKyGoiDichVuEntity)
    private readonly subscriptionRepository: Repository<DangKyGoiDichVuEntity>,
    @InjectRepository(GoiDichVuEntity)
    private readonly packageRepository: Repository<GoiDichVuEntity>,
    @InjectRepository(TaiKhoanEntity)
    private readonly userRepository: Repository<TaiKhoanEntity>,
  ) {}

  async findAll(query: SubscriptionQueryDto): Promise<
    SuccessResponse<{
      items: PublicSubscription[];
      pagination: { page: number; limit: number; total: number };
    }>
  > {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<DangKyGoiDichVuEntity> = {};

    if (query.trangThai) {
      where.trang_thai = query.trangThai as SubscriptionStatus;
    }
    if (query.goiDichVuId) {
      where.goi_dich_vu_id = query.goiDichVuId;
    }

    const [items, total] = await this.subscriptionRepository.findAndCount({
      where,
      relations: ['tai_khoan', 'goi_dich_vu'],
      order: { tao_luc: 'DESC' },
      skip,
      take: limit,
    });

    return {
      success: true,
      message: 'Lay danh sach dang ky goi thanh cong',
      data: {
        items: items.map((item) => this.toPublic(item)),
        pagination: { page, limit, total },
      },
    };
  }

  async findOne(id: number): Promise<SuccessResponse<PublicSubscription>> {
    const entity = await this.findById(id);
    return {
      success: true,
      message: 'Lay chi tiet dang ky goi thanh cong',
      data: this.toPublic(entity),
    };
  }

  async create(
    dto: CreateSubscriptionDto,
  ): Promise<SuccessResponse<PublicSubscription>> {
    // Kiểm tra user tồn tại
    const user = await this.userRepository.findOne({
      where: { id: dto.taiKhoanId, xoa_luc: IsNull() },
    });
    if (!user) {
      throw new NotFoundException('Tai khoan khong ton tai');
    }

    // Kiểm tra gói tồn tại
    const pkg = await this.packageRepository.findOne({
      where: { id: dto.goiDichVuId, xoa_luc: IsNull() },
    });
    if (!pkg) {
      throw new NotFoundException('Goi dich vu khong ton tai');
    }

    // Kiểm tra user đã có gói đang hoạt động chưa
    const activeSubscription = await this.subscriptionRepository.findOne({
      where: {
        tai_khoan_id: dto.taiKhoanId,
        trang_thai: 'dang_hoat_dong',
      },
    });
    if (activeSubscription) {
      throw new BadRequestException(
        'User da co goi dang hoat dong. Hay huy goi cu truoc khi cap moi.',
      );
    }

    const now = new Date();
    const maDangKy = `SUB-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;

    const ngayBatDau = dto.ngayBatDau ? new Date(dto.ngayBatDau) : now;
    let ngayHetHan: Date | null = null;
    if (dto.ngayHetHan) {
      ngayHetHan = new Date(dto.ngayHetHan);
    } else if (pkg.thoi_han_ngay) {
      ngayHetHan = new Date(ngayBatDau.getTime() + pkg.thoi_han_ngay * 24 * 60 * 60 * 1000);
    }

    const entity = this.subscriptionRepository.create({
      tai_khoan_id: dto.taiKhoanId,
      goi_dich_vu_id: dto.goiDichVuId,
      ma_dang_ky: maDangKy,
      trang_thai: 'dang_hoat_dong',
      ngay_bat_dau: ngayBatDau,
      ngay_het_han: ngayHetHan,
      tu_dong_gia_han: dto.tuDongGiaHan ?? false,
      nguon_dang_ky: (dto.nguonDangKy as SubscriptionSource) ?? 'quan_tri_cap',
      ghi_chu: dto.ghiChu?.trim() || null,
      tao_luc: now,
      cap_nhat_luc: now,
    });

    const saved = await this.subscriptionRepository.save(entity);

    // Reload with relations
    const result = await this.findById(saved.id);

    return {
      success: true,
      message: 'Cap goi dich vu thanh cong',
      data: this.toPublic(result),
    };
  }

  async update(
    id: number,
    dto: UpdateSubscriptionDto,
  ): Promise<SuccessResponse<PublicSubscription>> {
    const entity = await this.findById(id);

    if (dto.trangThai !== undefined) entity.trang_thai = dto.trangThai as SubscriptionStatus;
    if (dto.ngayBatDau !== undefined) entity.ngay_bat_dau = dto.ngayBatDau ? new Date(dto.ngayBatDau) : null;
    if (dto.ngayHetHan !== undefined) entity.ngay_het_han = dto.ngayHetHan ? new Date(dto.ngayHetHan) : null;
    if (dto.tuDongGiaHan !== undefined) entity.tu_dong_gia_han = dto.tuDongGiaHan;
    if (dto.ghiChu !== undefined) entity.ghi_chu = dto.ghiChu?.trim() || null;

    entity.cap_nhat_luc = new Date();

    await this.subscriptionRepository.save(entity);

    const result = await this.findById(id);

    return {
      success: true,
      message: 'Cap nhat dang ky goi thanh cong',
      data: this.toPublic(result),
    };
  }

  private async findById(id: number): Promise<DangKyGoiDichVuEntity> {
    const entity = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['tai_khoan', 'goi_dich_vu'],
    });

    if (!entity) {
      throw new NotFoundException('Dang ky goi khong ton tai');
    }

    return entity;
  }

  private toPublic(entity: DangKyGoiDichVuEntity): PublicSubscription {
    return {
      id: entity.id,
      tai_khoan_id: entity.tai_khoan_id,
      tai_khoan: entity.tai_khoan
        ? { id: entity.tai_khoan.id, ho_ten: entity.tai_khoan.ho_ten, email: entity.tai_khoan.email }
        : null,
      goi_dich_vu_id: entity.goi_dich_vu_id,
      goi_dich_vu: entity.goi_dich_vu
        ? { id: entity.goi_dich_vu.id, ten_goi: entity.goi_dich_vu.ten_goi, slug: entity.goi_dich_vu.slug }
        : null,
      ma_dang_ky: entity.ma_dang_ky,
      trang_thai: entity.trang_thai,
      ngay_bat_dau: entity.ngay_bat_dau?.toISOString() ?? null,
      ngay_het_han: entity.ngay_het_han?.toISOString() ?? null,
      tu_dong_gia_han: Boolean(entity.tu_dong_gia_han),
      nguon_dang_ky: entity.nguon_dang_ky,
      ghi_chu: entity.ghi_chu,
      tao_luc: entity.tao_luc.toISOString(),
      cap_nhat_luc: entity.cap_nhat_luc.toISOString(),
    };
  }
}
