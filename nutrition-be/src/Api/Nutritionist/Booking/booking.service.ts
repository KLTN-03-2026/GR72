import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { LichHenEntity } from '../../Admin/Booking/entities/lich-hen.entity';
import { ThanhToanTuVanEntity } from '../../Admin/Booking/entities/thanh-toan-tu-van.entity';
import { ThongBaoEntity } from '../../Admin/FoodReview/entities/thong-bao.entity';
import { ChuyenGiaDinhDuongEntity } from '../../Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import {
  BookingQueryDto,
  BookingResponseDto,
  CompleteBookingDto,
  CancelBookingDto,
} from './dto/booking.dto';

@Injectable()
export class NutritionistBookingService {
  constructor(
    @InjectRepository(LichHenEntity)
    private readonly bookingRepo: Repository<LichHenEntity>,
    @InjectRepository(ThanhToanTuVanEntity)
    private readonly paymentRepo: Repository<ThanhToanTuVanEntity>,
    @InjectRepository(ThongBaoEntity)
    private readonly notifRepo: Repository<ThongBaoEntity>,
    @InjectRepository(ChuyenGiaDinhDuongEntity)
    private readonly expertRepo: Repository<ChuyenGiaDinhDuongEntity>,
  ) {}

  async findAll(userId: number, query: BookingQueryDto) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Math.min(50, Number(query.limit ?? 10)));

    const expert = await this.getExpertByUser(userId);

    const where: FindOptionsWhere<LichHenEntity> = {
      chuyen_gia_dinh_duong_id: expert.id,
    } as any;

    if (query.trangThai) {
      where.trang_thai = query.trangThai as any;
    }

    const [items, total] = await this.bookingRepo.findAndCount({
      where,
      relations: ['tai_khoan', 'goi_tu_van'],
      order: { ngay_hen: 'DESC', gio_bat_dau: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((b) => this.toResponse(b)),
      pagination: { page, limit, total },
    };
  }

  async findOne(userId: number, id: number) {
    const expert = await this.getExpertByUser(userId);

    const booking = await this.bookingRepo.findOne({
      where: {
        id,
        chuyen_gia_dinh_duong_id: expert.id,
      } as any,
      relations: ['tai_khoan', 'goi_tu_van'],
    });

    if (!booking) {
      throw new NotFoundException('Khong tim thay booking');
    }

    return this.toResponse(booking);
  }

  async confirm(userId: number, id: number) {
    const booking = await this.getBookingByUser(userId, id);

    if (booking.trang_thai !== 'da_xac_nhan') {
      throw new BadRequestException('Chi booking da xac nhan moi duoc xac nhan');
    }

    booking.trang_thai = 'da_checkin';
    booking.cap_nhat_luc = new Date();
    await this.bookingRepo.save(booking);

    // Notify user
    await this.createNotification(
      booking.tai_khoan_id,
      userId,
      'Xac nhan booking',
      `Lịch hẹn ${booking.ma_lich_hen} đã được xác nhận bởi chuyên gia.`,
      `/user/bookings/${booking.id}`,
    );

    return this.toResponse(booking);
  }

  async complete(userId: number, id: number, dto: CompleteBookingDto) {
    const booking = await this.getBookingByUser(userId, id);

    if (booking.trang_thai !== 'da_checkin' && booking.trang_thai !== 'dang_tu_van') {
      throw new BadRequestException('Chi booking da checkin hoac dang tu van moi duoc hoan thanh');
    }

    booking.trang_thai = 'hoan_thanh';
    booking.ghi_chu_nutritionist = dto.ghiChu ?? null;
    booking.cap_nhat_luc = new Date();
    await this.bookingRepo.save(booking);

    // Notify user
    await this.createNotification(
      booking.tai_khoan_id,
      userId,
      'Tu van hoan thanh',
      `Lịch hẹn ${booking.ma_lich_hen} đã hoàn thành. Vui lòng đánh giá chuyên gia.`,
      `/user/bookings/${booking.id}`,
    );

    return this.toResponse(booking);
  }

  async cancel(userId: number, id: number, dto: CancelBookingDto) {
    const booking = await this.getBookingByUser(userId, id);

    if (booking.trang_thai === 'hoan_thanh') {
      throw new BadRequestException('Khong the huy booking da hoan thanh');
    }

    if (booking.trang_thai === 'da_huy') {
      throw new BadRequestException('Booking da bi huy');
    }

    if (!dto.lyDoHuy?.trim()) {
      throw new BadRequestException('Ly do huy la bat buoc');
    }

    booking.trang_thai = 'da_huy';
    booking.ly_do_huy = dto.lyDoHuy.trim();
    booking.huy_boi = userId;
    booking.huy_luc = new Date();
    booking.cap_nhat_luc = new Date();
    await this.bookingRepo.save(booking);

    // Refund if paid
    const payment = await this.paymentRepo.findOne({
      where: { lich_hen_id: id, trang_thai: 'thanh_cong' as any },
    });

    if (payment) {
      payment.trang_thai = 'da_hoan_tien' as any;
      payment.cap_nhat_luc = new Date();
      await this.paymentRepo.save(payment);
    }

    // Notify user
    await this.createNotification(
      booking.tai_khoan_id,
      userId,
      'Booking bi huy',
      `Lịch hẹn ${booking.ma_lich_hen} đã bị hủy. Ly do: ${dto.lyDoHuy}`,
      `/user/bookings/${booking.id}`,
    );

    return this.toResponse(booking);
  }

  private async getBookingByUser(userId: number, id: number) {
    const expert = await this.getExpertByUser(userId);

    const booking = await this.bookingRepo.findOne({
      where: { id, chuyen_gia_dinh_duong_id: expert.id } as any,
      relations: ['tai_khoan', 'goi_tu_van'],
    });

    if (!booking) {
      throw new NotFoundException('Khong tim thay booking');
    }

    return booking;
  }

  private async getExpertByUser(userId: number) {
    const expert = await this.expertRepo.findOne({
      where: { tai_khoan_id: userId },
    });

    if (!expert) {
      throw new NotFoundException('Khong tim thay chuyen gia');
    }

    return expert;
  }

  private async createNotification(
    taiKhoanId: number,
    nguoiGuiId: number,
    tieuDe: string,
    noiDung: string,
    duongDan: string,
  ) {
    const now = new Date();
    await this.notifRepo.save(
      this.notifRepo.create({
        tai_khoan_id: taiKhoanId,
        nguoi_gui_id: nguoiGuiId,
        loai: 'booking',
        tieu_de: tieuDe,
        noi_dung: noiDung,
        trang_thai: 'chua_doc',
        duong_dan_hanh_dong: duongDan,
        tao_luc: now,
        cap_nhat_luc: now,
      }),
    );
  }

  private toResponse(entity: LichHenEntity): BookingResponseDto {
    return {
      id: entity.id,
      maLichHen: entity.ma_lich_hen,
      taiKhoanId: entity.tai_khoan_id,
      tenUser: (entity.tai_khoan as any)?.ho_ten ?? '',
      chuyenGiaDinhDuongId: entity.chuyen_gia_dinh_duong_id,
      goiTuVanId: entity.goi_tu_van_id,
      tenGoiTuVan: entity.goi_tu_van?.ten ?? '',
      thoiLuongPhut: entity.goi_tu_van?.thoi_luong_phut ?? 0,
      ngayHen: entity.ngay_hen,
      gioBatDau: entity.gio_bat_dau,
      gioKetThuc: entity.gio_ket_thuc,
      diaDiem: entity.dia_diem,
      trangThai: entity.trang_thai,
      mucDich: entity.muc_dich,
      ghiChuNutritionist: entity.ghi_chu_nutritionist,
      taLuc: entity.tao_luc,
      capNhatLuc: entity.cap_nhat_luc,
    };
  }
}
