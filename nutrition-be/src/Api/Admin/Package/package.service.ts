import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, IsNull, Not, Repository } from 'typeorm';
import { CreatePackageDto, UpdatePackageDto } from './dto/package.dto';
import { PackageQueryDto } from './dto/package-query.dto';
import {
  GoiDichVuEntity,
  PackageCycleType,
  PackageStatus,
} from './entities/goi-dich-vu.entity';

type SuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

export type PublicPackage = {
  id: number;
  ten_goi: string;
  slug: string;
  mo_ta: string | null;
  gia_niem_yet: number;
  gia_khuyen_mai: number | null;
  thoi_han_ngay: number | null;
  loai_chu_ky: PackageCycleType;
  trang_thai: PackageStatus;
  la_goi_mien_phi: boolean;
  goi_noi_bat: boolean;
  thu_tu_hien_thi: number;
  tao_luc: string;
  cap_nhat_luc: string;
};

@Injectable()
export class PackageService {
  constructor(
    @InjectRepository(GoiDichVuEntity)
    private readonly packageRepository: Repository<GoiDichVuEntity>,
  ) {}

  async create(dto: CreatePackageDto): Promise<SuccessResponse<PublicPackage>> {
    const slug = dto.slug?.trim() || this.slugify(dto.tenGoi);
    await this.ensureSlugNotTaken(slug);

    const now = new Date();

    const entity = this.packageRepository.create({
      ten_goi: dto.tenGoi.trim(),
      slug,
      mo_ta: dto.moTa?.trim() || null,
      gia_niem_yet: String(dto.giaNiemYet),
      gia_khuyen_mai:
        dto.giaKhuyenMai !== undefined ? String(dto.giaKhuyenMai) : null,
      thoi_han_ngay: dto.thoiHanNgay ?? null,
      loai_chu_ky: (dto.loaiChuKy as PackageCycleType) ?? 'thang',
      trang_thai: (dto.trangThai as PackageStatus) ?? 'ban_nhap',
      la_goi_mien_phi: dto.laGoiMienPhi ?? false,
      goi_noi_bat: dto.goiNoiBat ?? false,
      thu_tu_hien_thi: dto.thuTuHienThi ?? 1,
      tao_luc: now,
      cap_nhat_luc: now,
      xoa_luc: null,
    });

    const saved = await this.packageRepository.save(entity);

    return {
      success: true,
      message: 'Tao goi dich vu thanh cong',
      data: this.toPublic(saved),
    };
  }

  async findAll(query: PackageQueryDto): Promise<
    SuccessResponse<{
      items: PublicPackage[];
      pagination: { page: number; limit: number; total: number };
    }>
  > {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const baseWhere: FindOptionsWhere<GoiDichVuEntity> = {
      xoa_luc: IsNull(),
    };

    if (query.trangThai) {
      baseWhere.trang_thai = query.trangThai as PackageStatus;
    }

    let where:
      | FindOptionsWhere<GoiDichVuEntity>
      | FindOptionsWhere<GoiDichVuEntity>[] = baseWhere;

    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      where = [
        { ...baseWhere, ten_goi: ILike(`%${keyword}%`) },
        { ...baseWhere, slug: ILike(`%${keyword}%`) },
      ];
    }

    const [items, total] = await this.packageRepository.findAndCount({
      where,
      order: { thu_tu_hien_thi: 'ASC', id: 'DESC' },
      skip,
      take: limit,
    });

    return {
      success: true,
      message: 'Lay danh sach goi dich vu thanh cong',
      data: {
        items: items.map((item) => this.toPublic(item)),
        pagination: { page, limit, total },
      },
    };
  }

  async findOne(id: number): Promise<SuccessResponse<PublicPackage>> {
    const entity = await this.findById(id);

    return {
      success: true,
      message: 'Lay chi tiet goi dich vu thanh cong',
      data: this.toPublic(entity),
    };
  }

  async update(
    id: number,
    dto: UpdatePackageDto,
  ): Promise<SuccessResponse<PublicPackage>> {
    const entity = await this.findById(id);

    if (dto.tenGoi !== undefined) entity.ten_goi = dto.tenGoi.trim();
    if (dto.slug !== undefined) {
      const newSlug = dto.slug.trim();
      await this.ensureSlugNotTaken(newSlug, id);
      entity.slug = newSlug;
    }
    if (dto.moTa !== undefined) entity.mo_ta = dto.moTa?.trim() || null;
    if (dto.giaNiemYet !== undefined)
      entity.gia_niem_yet = String(dto.giaNiemYet);
    if (dto.giaKhuyenMai !== undefined)
      entity.gia_khuyen_mai =
        dto.giaKhuyenMai !== null ? String(dto.giaKhuyenMai) : null;
    if (dto.thoiHanNgay !== undefined)
      entity.thoi_han_ngay = dto.thoiHanNgay ?? null;
    if (dto.loaiChuKy !== undefined)
      entity.loai_chu_ky = dto.loaiChuKy as PackageCycleType;
    if (dto.trangThai !== undefined)
      entity.trang_thai = dto.trangThai as PackageStatus;
    if (dto.laGoiMienPhi !== undefined)
      entity.la_goi_mien_phi = dto.laGoiMienPhi;
    if (dto.goiNoiBat !== undefined) entity.goi_noi_bat = dto.goiNoiBat;
    if (dto.thuTuHienThi !== undefined)
      entity.thu_tu_hien_thi = dto.thuTuHienThi;

    entity.cap_nhat_luc = new Date();

    const saved = await this.packageRepository.save(entity);

    return {
      success: true,
      message: 'Cap nhat goi dich vu thanh cong',
      data: this.toPublic(saved),
    };
  }

  async remove(id: number): Promise<SuccessResponse<{ id: number }>> {
    const entity = await this.findById(id);

    // Không xóa cứng — soft delete
    entity.xoa_luc = new Date();
    entity.cap_nhat_luc = new Date();
    await this.packageRepository.save(entity);

    return {
      success: true,
      message: 'Xoa goi dich vu thanh cong',
      data: { id },
    };
  }

  private async findById(id: number): Promise<GoiDichVuEntity> {
    const entity = await this.packageRepository.findOne({
      where: { id, xoa_luc: IsNull() },
    });

    if (!entity) {
      throw new NotFoundException('Goi dich vu khong ton tai');
    }

    return entity;
  }

  private async ensureSlugNotTaken(
    slug: string,
    excludeId?: number,
  ): Promise<void> {
    const where: FindOptionsWhere<GoiDichVuEntity> = {
      slug,
      xoa_luc: IsNull(),
    };

    if (excludeId) {
      where.id = Not(excludeId) as unknown as number;
    }

    const existing = await this.packageRepository.findOne({ where });

    if (existing) {
      throw new BadRequestException('Slug da ton tai');
    }
  }

  private toPublic(entity: GoiDichVuEntity): PublicPackage {
    return {
      id: entity.id,
      ten_goi: entity.ten_goi,
      slug: entity.slug,
      mo_ta: entity.mo_ta,
      gia_niem_yet: Number(entity.gia_niem_yet),
      gia_khuyen_mai: entity.gia_khuyen_mai
        ? Number(entity.gia_khuyen_mai)
        : null,
      thoi_han_ngay: entity.thoi_han_ngay,
      loai_chu_ky: entity.loai_chu_ky,
      trang_thai: entity.trang_thai,
      la_goi_mien_phi: Boolean(entity.la_goi_mien_phi),
      goi_noi_bat: Boolean(entity.goi_noi_bat),
      thu_tu_hien_thi: entity.thu_tu_hien_thi,
      tao_luc: entity.tao_luc.toISOString(),
      cap_nhat_luc: entity.cap_nhat_luc.toISOString(),
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
