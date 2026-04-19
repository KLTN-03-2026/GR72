import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GoiTuVanEntity } from '../../Admin/ChuyenGiaDinhDuong/entities/goi-tu-van.entity';
import { ChuyenGiaDinhDuongEntity } from '../../Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import { LichHenEntity } from '../../Admin/Booking/entities/lich-hen.entity';
import {
  CreatePackageDto,
  UpdatePackageDto,
  PackageResponseDto,
} from './dto/package.dto';

const MIN_PACKAGE_DURATION_MINUTES = 15;
const MAX_PACKAGE_DURATION_MINUTES = 240;
const USED_PACKAGE_BOOKING_STATUSES = [
  'da_xac_nhan',
  'da_checkin',
  'dang_tu_van',
  'hoan_thanh',
] as const;

@Injectable()
export class NutritionistConsultationPackageService {
  constructor(
    @InjectRepository(GoiTuVanEntity)
    private readonly packageRepo: Repository<GoiTuVanEntity>,
    @InjectRepository(ChuyenGiaDinhDuongEntity)
    private readonly expertRepo: Repository<ChuyenGiaDinhDuongEntity>,
    @InjectRepository(LichHenEntity)
    private readonly bookingRepo: Repository<LichHenEntity>,
  ) {}

  async findAll(userId: number, page = 1, limit = 10) {
    const p = Math.max(1, Number(page));
    const l = Math.max(1, Math.min(50, Number(limit)));

    const expert = await this.findExpertByUserId(userId, true);

    if (!expert) {
      return { items: [], pagination: { page: p, limit: l, total: 0 } };
    }

    const [items, total] = await this.packageRepo.findAndCount({
      where: {
        chuyen_gia_dinh_duong_id: expert.id,
        xoa_luc: null as any,
      },
      order: { tao_luc: 'DESC' },
      skip: (p - 1) * l,
      take: l,
    });

    const usageMap = await this.getUsageCountMap(items.map((item) => item.id));

    return {
      items: items.map((pkg) =>
        this.toResponse(pkg, usageMap.get(pkg.id) ?? 0),
      ),
      pagination: { page: p, limit: l, total },
    };
  }

  async findOne(userId: number, id: number) {
    const expert = await this.findExpertByUserId(userId);

    if (!expert) {
      throw new NotFoundException('Khong tim thay chuyen gia');
    }

    const pkg = await this.packageRepo.findOne({
      where: { id, chuyen_gia_dinh_duong_id: expert.id, xoa_luc: null as any },
    });
    if (!pkg) {
      throw new NotFoundException('Khong tim thay goi tu van');
    }
    const usageMap = await this.getUsageCountMap([pkg.id]);
    return this.toResponse(pkg, usageMap.get(pkg.id) ?? 0);
  }

  async create(userId: number, dto: CreatePackageDto) {
    const expert = await this.findExpertByUserId(userId, true);

    if (!expert) {
      throw new BadRequestException(
        'Chi chuyen gia hoat dong moi tao duoc goi tu van',
      );
    }

    this.assertValidSessionDuration(dto.thoiLuongPhut);

    const now = new Date();

    const entity = this.packageRepo.create({
      chuyen_gia_dinh_duong_id: expert.id,
      ten: dto.ten,
      mo_ta: dto.moTa ?? null,
      gia: dto.gia,
      thoi_luong_phut: dto.thoiLuongPhut ?? 30,
      so_lan_dung_mien_phi: dto.soLanDungMienPhi ?? 0,
      trang_thai: 'dang_ban',
      tao_luc: now,
      cap_nhat_luc: now,
      xoa_luc: null,
    } as unknown as Partial<GoiTuVanEntity>);

    const saved = await this.packageRepo.save(entity);
    return this.toResponse(saved, 0);
  }

  async update(userId: number, id: number, dto: UpdatePackageDto) {
    const expert = await this.findExpertByUserId(userId);

    if (!expert) {
      throw new NotFoundException('Khong tim thay chuyen gia');
    }

    const pkg = await this.packageRepo.findOne({
      where: { id, chuyen_gia_dinh_duong_id: expert.id, xoa_luc: null as any },
    });
    if (!pkg) {
      throw new NotFoundException('Khong tim thay goi tu van');
    }

    this.assertValidSessionDuration(dto.thoiLuongPhut);

    if (dto.ten !== undefined) pkg.ten = dto.ten;
    if (dto.moTa !== undefined) pkg.mo_ta = dto.moTa;
    if (dto.gia !== undefined) pkg.gia = String(dto.gia);
    if (dto.thoiLuongPhut !== undefined)
      pkg.thoi_luong_phut = dto.thoiLuongPhut;
    if (dto.soLanDungMienPhi !== undefined)
      pkg.so_lan_dung_mien_phi = dto.soLanDungMienPhi;
    if (dto.trangThai !== undefined) {
      if (!['ban_nhap', 'dang_ban', 'ngung_ban'].includes(dto.trangThai)) {
        throw new BadRequestException('Trang thai khong hop le');
      }
      pkg.trang_thai = dto.trangThai as any;
    }
    pkg.cap_nhat_luc = new Date();

    await this.packageRepo.save(pkg);
    const usageMap = await this.getUsageCountMap([pkg.id]);
    return this.toResponse(pkg, usageMap.get(pkg.id) ?? 0);
  }

  async delete(userId: number, id: number) {
    const expert = await this.findExpertByUserId(userId);

    if (!expert) {
      throw new NotFoundException('Khong tim thay chuyen gia');
    }

    const pkg = await this.packageRepo.findOne({
      where: { id, chuyen_gia_dinh_duong_id: expert.id, xoa_luc: null as any },
    });
    if (!pkg) {
      throw new NotFoundException('Khong tim thay goi tu van');
    }

    // Check if package has pending bookings
    const hasBookings = await this.packageRepo
      .createQueryBuilder('g')
      .leftJoin('g.lich_hen', 'lh')
      .where('g.id = :id', { id })
      .andWhere('lh.trang_thai NOT IN (:...statuses)', {
        statuses: ['hoan_thanh', 'da_huy', 'vo_hieu_hoa'],
      })
      .getCount();

    if (hasBookings > 0) {
      throw new BadRequestException(
        'Khong the xoa goi co booking dang cho xu ly',
      );
    }

    pkg.xoa_luc = new Date();
    await this.packageRepo.save(pkg);
    return { success: true, message: 'Xoa goi tu van thanh cong' };
  }

  private toResponse(
    entity: GoiTuVanEntity,
    soLuotSuDung = 0,
  ): PackageResponseDto {
    return {
      id: entity.id,
      chuyenGiaDinhDuongId: entity.chuyen_gia_dinh_duong_id,
      ten: entity.ten,
      moTa: entity.mo_ta,
      gia: Number(entity.gia),
      thoiLuongPhut: entity.thoi_luong_phut,
      soLanDungMienPhi: entity.so_lan_dung_mien_phi,
      soLuotSuDung,
      trangThai: entity.trang_thai,
      taLuc: entity.tao_luc,
      capNhatLuc: entity.cap_nhat_luc,
    };
  }

  private async getUsageCountMap(packageIds: number[]) {
    const usageMap = new Map<number, number>();

    if (!packageIds.length) {
      return usageMap;
    }

    const rows = await this.bookingRepo.find({
      select: ['goi_tu_van_id'],
      where: {
        goi_tu_van_id: In(packageIds),
        trang_thai: In([...USED_PACKAGE_BOOKING_STATUSES]) as any,
      },
    });

    for (const row of rows) {
      usageMap.set(
        row.goi_tu_van_id,
        (usageMap.get(row.goi_tu_van_id) ?? 0) + 1,
      );
    }

    return usageMap;
  }

  private async findExpertByUserId(userId: number, mustBeActive = false) {
    return this.expertRepo.findOne({
      where: {
        tai_khoan_id: userId,
        ...(mustBeActive ? { trang_thai: 'hoat_dong' as const } : {}),
      },
    });
  }

  private assertValidSessionDuration(durationMinutes?: number) {
    if (durationMinutes === undefined) {
      return;
    }

    if (!Number.isInteger(durationMinutes)) {
      throw new BadRequestException('Thoi luong moi buoi phai la so nguyen');
    }

    if (
      durationMinutes < MIN_PACKAGE_DURATION_MINUTES ||
      durationMinutes > MAX_PACKAGE_DURATION_MINUTES
    ) {
      throw new BadRequestException(
        `Thoi luong moi buoi phai nam trong khoang ${MIN_PACKAGE_DURATION_MINUTES}-${MAX_PACKAGE_DURATION_MINUTES} phut`,
      );
    }
  }
}
