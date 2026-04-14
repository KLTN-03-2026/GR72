import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';
import { ChuyenGiaDinhDuongEntity } from '../../Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import { UpdateProfileDto } from './dto/profile.dto';

@Injectable()
export class NutritionistProfileService {
  constructor(
    @InjectRepository(TaiKhoanEntity)
    private readonly userRepo: Repository<TaiKhoanEntity>,
    @InjectRepository(ChuyenGiaDinhDuongEntity)
    private readonly expertRepo: Repository<ChuyenGiaDinhDuongEntity>,
  ) {}

  async getProfile(userId: number) {
    const expert = await this.expertRepo.findOne({
      where: { tai_khoan_id: userId },
      relations: ['tai_khoan'],
    });
    if (!expert) {
      throw new NotFoundException('Khong tim thay profile chuyen gia');
    }

    if (expert.trang_thai !== 'hoat_dong') {
      throw new BadRequestException('Chi chuyen gia hoat dong moi xem duoc profile');
    }

    // Count completed bookings
    const bookingsCount = await this.expertRepo
      .createQueryBuilder('cg')
      .leftJoin('cg.lich_hen', 'lh')
      .where('cg.id = :id', { id: expert.id })
      .andWhere('lh.trang_thai IN (:...statuses)', { statuses: ['hoan_thanh'] })
      .getCount();

    return {
      id: expert.id,
      hoTen: (expert.tai_khoan as any).ho_ten,
      vaiTro: (expert.tai_khoan as any).vai_tro,
      trangThai: expert.trang_thai,
      anhDaiDienUrl: expert.anh_dai_dien_url,
      moTa: expert.mo_ta,
      chuyenMon: expert.chuyen_mon,
      gioLamViec: expert.gio_lam_viec,
      diemDanhGiaTrungBinh: Number(expert.diem_danh_gia_trung_binh) || 0,
      soLuotDanhGia: expert.so_luot_danh_gia,
      tongBooking: bookingsCount,
      taoLuc: expert.tao_luc,
      capNhatLuc: expert.cap_nhat_luc,
    };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const expert = await this.expertRepo.findOne({
      where: { tai_khoan_id: userId },
    });
    if (!expert) {
      throw new NotFoundException('Khong tim thay profile chuyen gia');
    }

    if (expert.trang_thai !== 'hoat_dong') {
      throw new BadRequestException('Chi chuyen gia hoat dong moi duoc cap nhat profile');
    }

    if (dto.anhDaiDienUrl !== undefined) expert.anh_dai_dien_url = dto.anhDaiDienUrl;
    if (dto.moTa !== undefined) expert.mo_ta = dto.moTa;
    if (dto.chuyenMon !== undefined) expert.chuyen_mon = dto.chuyenMon;
    if (dto.gioLamViec !== undefined) expert.gio_lam_viec = dto.gioLamViec;
    expert.cap_nhat_luc = new Date();

    await this.expertRepo.save(expert);
    return this.getProfile(userId);
  }
}
