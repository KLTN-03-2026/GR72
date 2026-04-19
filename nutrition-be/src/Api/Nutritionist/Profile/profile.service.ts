import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';
import { ChuyenGiaDinhDuongEntity } from '../../Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import { UpdateProfileDto } from './dto/profile.dto';

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const TIME_SLOT_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

type WorkingHoursSlot = {
  start: string;
  end: string;
};

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
      throw new BadRequestException(
        'Chi chuyen gia hoat dong moi xem duoc profile',
      );
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
      throw new BadRequestException(
        'Chi chuyen gia hoat dong moi duoc cap nhat profile',
      );
    }

    if (dto.anhDaiDienUrl !== undefined) {
      expert.anh_dai_dien_url = this.normalizeNullableText(dto.anhDaiDienUrl);
    }
    if (dto.moTa !== undefined) {
      expert.mo_ta = this.normalizeNullableText(dto.moTa);
    }
    if (dto.chuyenMon !== undefined) {
      expert.chuyen_mon = this.normalizeSpecialties(dto.chuyenMon);
    }
    if (dto.gioLamViec !== undefined) {
      expert.gio_lam_viec = this.normalizeWorkingHours(dto.gioLamViec);
    }
    expert.cap_nhat_luc = new Date();

    await this.expertRepo.save(expert);
    return this.getProfile(userId);
  }

  private normalizeNullableText(value: string): string | null {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeSpecialties(value: string): string | null {
    const normalized = this.normalizeNullableText(value);
    if (!normalized) {
      return null;
    }

    const uniqueItems = Array.from(
      new Map(
        normalized
          .split(/[\n,]+/)
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) => [item.toLowerCase(), item] as const),
      ).values(),
    );

    if (uniqueItems.length === 0) {
      return null;
    }

    return uniqueItems.join(', ');
  }

  private normalizeWorkingHours(value: string): string | null {
    const normalized = this.normalizeNullableText(value);
    if (!normalized) {
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(normalized);
    } catch {
      throw new BadRequestException('Gio lam viec phai la JSON hop le');
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new BadRequestException('Gio lam viec phai la mot object JSON');
    }

    const compactSchedule: Record<string, WorkingHoursSlot[]> = {};

    for (const [dayKey, rawSlots] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      if (!WEEKDAY_KEYS.includes(dayKey as (typeof WEEKDAY_KEYS)[number])) {
        throw new BadRequestException(`Ngay lam viec khong hop le: ${dayKey}`);
      }

      if (!Array.isArray(rawSlots)) {
        throw new BadRequestException(
          `Danh sach ca lam cua ${dayKey} phai la mang`,
        );
      }

      const normalizedSlots = rawSlots
        .filter((slot) => slot !== null)
        .map((slot, index) =>
          this.normalizeWorkingHoursSlot(dayKey, slot, index),
        );

      if (normalizedSlots.length > 0) {
        compactSchedule[dayKey] = normalizedSlots;
      }
    }

    const serialized = JSON.stringify(compactSchedule);
    if (serialized.length > 255) {
      throw new BadRequestException(
        'Gio lam viec vuot qua 255 ky tu, vui long rut gon so ca lam',
      );
    }

    return serialized === '{}' ? null : serialized;
  }

  private normalizeWorkingHoursSlot(
    dayKey: string,
    slot: unknown,
    index: number,
  ): WorkingHoursSlot {
    if (!slot || typeof slot !== 'object' || Array.isArray(slot)) {
      throw new BadRequestException(
        `Ca lam thu ${index + 1} cua ${dayKey} phai la object gom start va end`,
      );
    }

    const slotRecord = slot as Record<string, unknown>;
    const startValue = slotRecord.start;
    const endValue = slotRecord.end;

    const start = typeof startValue === 'string' ? startValue.trim() : '';
    const end = typeof endValue === 'string' ? endValue.trim() : '';

    if (!TIME_SLOT_PATTERN.test(start) || !TIME_SLOT_PATTERN.test(end)) {
      throw new BadRequestException(
        `Ca lam thu ${index + 1} cua ${dayKey} phai co start/end dang HH:mm`,
      );
    }

    if (start >= end) {
      throw new BadRequestException(
        `Ca lam thu ${index + 1} cua ${dayKey} phai co gio bat dau nho hon gio ket thuc`,
      );
    }

    return { start, end };
  }
}
