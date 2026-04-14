import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoiTuVanEntity } from '../../Admin/ChuyenGiaDinhDuong/entities/goi-tu-van.entity';
import { CreatePackageDto, UpdatePackageDto, PackageResponseDto } from './dto/package.dto';

@Injectable()
export class NutritionistConsultationPackageService {
  constructor(
    @InjectRepository(GoiTuVanEntity)
    private readonly packageRepo: Repository<GoiTuVanEntity>,
  ) {}

  async findAll(userId: number, page = 1, limit = 10) {
    const p = Math.max(1, Number(page));
    const l = Math.max(1, Math.min(50, Number(limit)));

    // Resolve chuyen_gia_dinh_duong_id from tai_khoan_id
    const expert = await this.packageRepo
      .createQueryBuilder('g')
      .innerJoin('g.chuyen_gia_dinh_duong', 'cg')
      .where('cg.tai_khoan_id = :userId', { userId })
      .andWhere('cg.trang_thai = :status', { status: 'hoat_dong' })
      .select('cg.id')
      .getRawOne();

    if (!expert) {
      return { items: [], pagination: { page: p, limit: l, total: 0 } };
    }

    const [items, total] = await this.packageRepo.findAndCount({
      where: {
        chuyen_gia_dinh_duong_id: expert.cg_id,
        xoa_luc: null as any,
      },
      order: { tao_luc: 'DESC' },
      skip: (p - 1) * l,
      take: l,
    });

    return {
      items: items.map((pkg) => this.toResponse(pkg)),
      pagination: { page: p, limit: l, total },
    };
  }

  async findOne(userId: number, id: number) {
    const expert = await this.packageRepo
      .createQueryBuilder('g')
      .innerJoin('g.chuyen_gia_dinh_duong', 'cg')
      .where('cg.tai_khoan_id = :userId', { userId })
      .select('cg.id')
      .getRawOne();

    if (!expert) {
      throw new NotFoundException('Khong tim thay chuyen gia');
    }

    const pkg = await this.packageRepo.findOne({
      where: { id, chuyen_gia_dinh_duong_id: expert.cg_id, xoa_luc: null as any },
    });
    if (!pkg) {
      throw new NotFoundException('Khong tim thay goi tu van');
    }
    return this.toResponse(pkg);
  }

  async create(userId: number, dto: CreatePackageDto) {
    // Resolve chuyen_gia_dinh_duong_id from tai_khoan_id
    const expert = await this.packageRepo
      .createQueryBuilder('g')
      .innerJoin('g.chuyen_gia_dinh_duong', 'cg')
      .where('cg.tai_khoan_id = :userId', { userId })
      .andWhere('cg.trang_thai = :status', { status: 'hoat_dong' })
      .select('cg.id')
      .getRawOne();

    if (!expert) {
      throw new BadRequestException('Chi chuyen gia hoat dong moi tao duoc goi tu van');
    }

    const entity = this.packageRepo.create({
      chuyen_gia_dinh_duong_id: expert.cg_id,
      ten: dto.ten,
      mo_ta: dto.moTa ?? null,
      gia: dto.gia,
      thoi_luong_phut: dto.thoiLuongPhut ?? 30,
      so_lan_dung_mien_phi: dto.soLanDungMienPhi ?? 0,
      trang_thai: 'dang_ban',
    } as unknown as Partial<GoiTuVanEntity>);

    const saved = await this.packageRepo.save(entity);
    return this.toResponse(saved);
  }

  async update(userId: number, id: number, dto: UpdatePackageDto) {
    // Resolve chuyen_gia_dinh_duong_id from tai_khoan_id
    const expert = await this.packageRepo
      .createQueryBuilder('g')
      .innerJoin('g.chuyen_gia_dinh_duong', 'cg')
      .where('cg.tai_khoan_id = :userId', { userId })
      .select('cg.id')
      .getRawOne();

    if (!expert) {
      throw new NotFoundException('Khong tim thay chuyen gia');
    }

    const pkg = await this.packageRepo.findOne({
      where: { id, chuyen_gia_dinh_duong_id: expert.cg_id, xoa_luc: null as any },
    });
    if (!pkg) {
      throw new NotFoundException('Khong tim thay goi tu van');
    }

    if (dto.ten !== undefined) pkg.ten = dto.ten;
    if (dto.moTa !== undefined) pkg.mo_ta = dto.moTa;
    if (dto.gia !== undefined) pkg.gia = String(dto.gia);
    if (dto.thoiLuongPhut !== undefined) pkg.thoi_luong_phut = dto.thoiLuongPhut;
    if (dto.soLanDungMienPhi !== undefined) pkg.so_lan_dung_mien_phi = dto.soLanDungMienPhi;
    if (dto.trangThai !== undefined) {
      if (!['ban_nhap', 'dang_ban', 'ngung_ban'].includes(dto.trangThai)) {
        throw new BadRequestException('Trang thai khong hop le');
      }
      pkg.trang_thai = dto.trangThai as any;
    }
    pkg.cap_nhat_luc = new Date();

    await this.packageRepo.save(pkg);
    return this.toResponse(pkg);
  }

  async delete(userId: number, id: number) {
    // Resolve chuyen_gia_dinh_duong_id from tai_khoan_id
    const expert = await this.packageRepo
      .createQueryBuilder('g')
      .innerJoin('g.chuyen_gia_dinh_duong', 'cg')
      .where('cg.tai_khoan_id = :userId', { userId })
      .select('cg.id')
      .getRawOne();

    if (!expert) {
      throw new NotFoundException('Khong tim thay chuyen gia');
    }

    const pkg = await this.packageRepo.findOne({
      where: { id, chuyen_gia_dinh_duong_id: expert.cg_id, xoa_luc: null as any },
    });
    if (!pkg) {
      throw new NotFoundException('Khong tim thay goi tu van');
    }

    // Check if package has pending bookings
    const hasBookings = await this.packageRepo
      .createQueryBuilder('g')
      .leftJoin('g.lich_hen', 'lh')
      .where('g.id = :id', { id })
      .andWhere('lh.trang_thai NOT IN (:...statuses)', { statuses: ['hoan_thanh', 'da_huy', 'vo_hieu_hoa'] })
      .getCount();

    if (hasBookings > 0) {
      throw new BadRequestException('Khong the xoa goi co booking dang cho xu ly');
    }

    pkg.xoa_luc = new Date();
    await this.packageRepo.save(pkg);
    return { success: true, message: 'Xoa goi tu van thanh cong' };
  }

  private toResponse(entity: GoiTuVanEntity): PackageResponseDto {
    return {
      id: entity.id,
      chuyenGiaDinhDuongId: entity.chuyen_gia_dinh_duong_id,
      ten: entity.ten,
      moTa: entity.mo_ta,
      gia: Number(entity.gia),
      thoiLuongPhut: entity.thoi_luong_phut,
      soLanDungMienPhi: entity.so_lan_dung_mien_phi,
      trangThai: entity.trang_thai,
      taLuc: entity.tao_luc,
      capNhatLuc: entity.cap_nhat_luc,
    };
  }
}
