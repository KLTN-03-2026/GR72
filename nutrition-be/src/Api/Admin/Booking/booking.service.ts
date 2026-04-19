import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LichHenEntity, LichHenStatus } from './entities/lich-hen.entity';
import { ThanhToanTuVanEntity } from './entities/thanh-toan-tu-van.entity';
import { ChuyenGiaDinhDuongEntity } from '../ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import { TaiKhoanEntity } from '../User/entities/tai-khoan.entity';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(LichHenEntity)
    private readonly lichHenRepository: Repository<LichHenEntity>,
    @InjectRepository(ThanhToanTuVanEntity)
    private readonly paymentRepository: Repository<ThanhToanTuVanEntity>,
    @InjectRepository(ChuyenGiaDinhDuongEntity)
    private readonly cgRepository: Repository<ChuyenGiaDinhDuongEntity>,
    @InjectRepository(TaiKhoanEntity)
    private readonly userRepository: Repository<TaiKhoanEntity>,
  ) {}

  // =========================================================
  // MODULE 3: Báo cáo booking & thống kê tư vấn
  // =========================================================
  async getReports(query: {
    start_date?: string;
    end_date?: string;
    nutritionist_id?: string;
  }) {
    const startDate =
      query.start_date ??
      new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const endDate = query.end_date ?? new Date().toISOString().split('T')[0];

    // Overview stats
    const overview = await this.lichHenRepository
      .createQueryBuilder('lh')
      .select('COUNT(lh.id)', 'tong_booking')
      .where('lh.ngay_hen >= :startDate', { startDate })
      .andWhere('lh.ngay_hen <= :endDate', { endDate })
      .getRawOne();

    // Revenue
    const revenue = await this.paymentRepository
      .createQueryBuilder('tt')
      .select('SUM(tt.so_tien)', 'tong_doanh_thu')
      .where("tt.trang_thai = 'thanh_cong'")
      .andWhere('DATE_FORMAT(tt.thanh_toan_luc, "%Y-%m-%d") >= :startDate', {
        startDate,
      })
      .andWhere('DATE_FORMAT(tt.thanh_toan_luc, "%Y-%m-%d") <= :endDate', {
        endDate,
      })
      .getRawOne();

    // Booking by status
    const byStatus = await this.lichHenRepository
      .createQueryBuilder('lh')
      .select('lh.trang_thai', 'trang_thai')
      .addSelect('COUNT(lh.id)', 'so_luong')
      .where('lh.ngay_hen >= :startDate', { startDate })
      .andWhere('lh.ngay_hen <= :endDate', { endDate })
      .groupBy('lh.trang_thai')
      .getRawMany();

    // Stats by day
    const byDay = await this.lichHenRepository
      .createQueryBuilder('lh')
      .select("DATE_FORMAT(lh.ngay_hen, '%Y-%m-%d')", 'ngay')
      .addSelect('COUNT(lh.id)', 'so_booking')
      .addSelect(
        "SUM(CASE WHEN lh.trang_thai = 'hoan_thanh' THEN 1 ELSE 0 END)",
        'so_hoan_thanh',
      )
      .where('lh.ngay_hen >= :startDate', { startDate })
      .andWhere('lh.ngay_hen <= :endDate', { endDate })
      .groupBy('ngay')
      .orderBy('ngay', 'ASC')
      .getRawMany();

    // Revenue by day
    const revenueByDay = await this.paymentRepository
      .createQueryBuilder('tt')
      .select("DATE_FORMAT(tt.thanh_toan_luc, '%Y-%m-%d')", 'ngay')
      .addSelect('SUM(tt.so_tien)', 'doanh_thu')
      .addSelect('COUNT(tt.id)', 'so_giao_dich')
      .where("tt.trang_thai = 'thanh_cong'")
      .andWhere('DATE_FORMAT(tt.thanh_toan_luc, "%Y-%m-%d") >= :startDate', {
        startDate,
      })
      .andWhere('DATE_FORMAT(tt.thanh_toan_luc, "%Y-%m-%d") <= :endDate', {
        endDate,
      })
      .groupBy('ngay')
      .orderBy('ngay', 'ASC')
      .getRawMany();

    return {
      success: true,
      message: 'Lay bao cao thanh cong',
      data: {
        tong_booking: Number(overview?.tong_booking ?? 0),
        tong_doanh_thu: Number(revenue?.tong_doanh_thu ?? 0),
        booking_theo_trang_thai: byStatus.map((s) => ({
          trang_thai: s.trang_thai,
          so_luong: Number(s.so_luong),
        })),
        thong_ke_theo_ngay: byDay.map((d) => ({
          ngay: d.ngay,
          so_booking: Number(d.so_booking),
          so_hoan_thanh: Number(d.so_hoan_thanh),
          doanh_thu: Number(
            revenueByDay.find((r) => r.ngay === d.ngay)?.doanh_thu ?? 0,
          ),
        })),
      },
    };
  }

  async getReportsByNutritionist(query: {
    start_date?: string;
    end_date?: string;
  }) {
    const startDate =
      query.start_date ??
      new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const endDate = query.end_date ?? new Date().toISOString().split('T')[0];

    const stats = await this.lichHenRepository
      .createQueryBuilder('lh')
      .innerJoin('lh.chuyen_gia_dinh_duong', 'cg')
      .innerJoin(
        'tai_khoan',
        'tk',
        'tk.id = cg.tai_khoan_id AND tk.xoa_luc IS NULL',
      )
      .select('cg.id', 'chuyen_gia_id')
      .addSelect('tk.ho_ten', 'ho_ten')
      .addSelect('tk.email', 'email')
      .addSelect('cg.anh_dai_dien_url', 'anh_dai_dien_url')
      .addSelect('cg.diem_danh_gia_trung_binh', 'diem_trung_binh')
      .addSelect('COUNT(lh.id)', 'so_booking')
      .addSelect(
        "SUM(CASE WHEN lh.trang_thai = 'hoan_thanh' THEN 1 ELSE 0 END)",
        'so_hoan_thanh',
      )
      .where('lh.ngay_hen >= :startDate', { startDate })
      .andWhere('lh.ngay_hen <= :endDate', { endDate })
      .groupBy('cg.id')
      .orderBy('so_booking', 'DESC')
      .getRawMany();

    // Revenue per nutritionist
    const revenueByCg = await this.paymentRepository
      .createQueryBuilder('tt')
      .innerJoin('tt.lich_hen', 'lh')
      .select('lh.chuyen_gia_dinh_duong_id', 'chuyen_gia_id')
      .addSelect('SUM(tt.so_tien)', 'doanh_thu')
      .where("tt.trang_thai = 'thanh_cong'")
      .andWhere('DATE_FORMAT(tt.thanh_toan_luc, "%Y-%m-%d") >= :startDate', {
        startDate,
      })
      .andWhere('DATE_FORMAT(tt.thanh_toan_luc, "%Y-%m-%d") <= :endDate', {
        endDate,
      })
      .groupBy('lh.chuyen_gia_dinh_duong_id')
      .getRawMany();

    const revenueMap = new Map(
      revenueByCg.map((r) => [r.chuyen_gia_id, Number(r.doanh_thu)]),
    );

    return {
      success: true,
      message: 'Lay thong ke theo nutritionist thanh cong',
      data: stats.map((s) => ({
        chuyen_gia_id: Number(s.chuyen_gia_id),
        ho_ten: s.ho_ten,
        email: s.email,
        anh_dai_dien_url: s.anh_dai_dien_url,
        so_booking: Number(s.so_booking),
        so_hoan_thanh: Number(s.so_hoan_thanh),
        doanh_thu: revenueMap.get(Number(s.chuyen_gia_id)) ?? 0,
        diem_trung_binh: Number(s.diem_trung_binh),
      })),
    };
  }

  async findBookings(query: {
    trang_thai?: string;
    nutritionist_id?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.lichHenRepository
      .createQueryBuilder('lh')
      .leftJoinAndSelect('lh.chuyen_gia_dinh_duong', 'cg')
      .leftJoinAndSelect('cg.tai_khoan', 'cg_tk')
      .leftJoinAndSelect('lh.tai_khoan', 'tk')
      .leftJoinAndSelect('lh.goi_tu_van', 'gtv')
      .where('1=1');

    if (query.trang_thai)
      qb.andWhere('lh.trang_thai = :trang_thai', {
        trang_thai: query.trang_thai,
      });
    if (query.nutritionist_id)
      qb.andWhere('lh.chuyen_gia_dinh_duong_id = :cgId', {
        cgId: Number(query.nutritionist_id),
      });
    if (query.start_date)
      qb.andWhere('lh.ngay_hen >= :startDate', { startDate: query.start_date });
    if (query.end_date)
      qb.andWhere('lh.ngay_hen <= :endDate', { endDate: query.end_date });

    const [items, total] = await qb
      .orderBy('lh.ngay_hen', 'DESC')
      .addOrderBy('lh.gio_bat_dau', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      success: true,
      message: 'Lay danh sach booking thanh cong',
      data: {
        items: items.map((i) => this.toPublic(i)),
        pagination: { page, limit, total },
      },
    };
  }

  async getBookingDetail(id: number) {
    const entity = await this.lichHenRepository.findOne({
      where: { id },
      relations: [
        'chuyen_gia_dinh_duong',
        'chuyen_gia_dinh_duong.tai_khoan',
        'tai_khoan',
        'goi_tu_van',
      ],
    });
    if (!entity) throw new NotFoundException('Booking khong ton tai');

    const payments = await this.paymentRepository.find({
      where: { lich_hen_id: id },
      order: { tao_luc: 'DESC' },
    });

    return {
      success: true,
      message: 'Lay chi tiet booking thanh cong',
      data: {
        ...this.toPublic(entity),
        thanh_toan: payments.map((p) => ({
          id: p.id,
          ma_giao_dich: p.ma_giao_dich,
          phuong_thuc: p.phuong_thuc,
          so_tien: Number(p.so_tien),
          trang_thai: p.trang_thai,
          thanh_toan_luc: p.thanh_toan_luc?.toISOString() ?? null,
        })),
      },
    };
  }

  private toPublic(e: LichHenEntity) {
    return {
      id: e.id,
      chuyen_gia_dinh_duong_id: e.chuyen_gia_dinh_duong_id,
      chuyen_gia: e.chuyen_gia_dinh_duong?.tai_khoan
        ? {
            id: e.chuyen_gia_dinh_duong.id,
            ho_ten: e.chuyen_gia_dinh_duong.tai_khoan.ho_ten,
            email: e.chuyen_gia_dinh_duong.tai_khoan.email,
            anh_dai_dien_url: e.chuyen_gia_dinh_duong.anh_dai_dien_url,
          }
        : null,
      tai_khoan_id: e.tai_khoan_id,
      user: e.tai_khoan
        ? {
            id: e.tai_khoan.id,
            ho_ten: e.tai_khoan.ho_ten,
            email: e.tai_khoan.email,
          }
        : null,
      goi_tu_van: e.goi_tu_van
        ? {
            id: e.goi_tu_van.id,
            ten: e.goi_tu_van.ten,
            gia: Number(e.goi_tu_van.gia),
            thoi_luong_phut: e.goi_tu_van.thoi_luong_phut,
          }
        : null,
      ma_lich_hen: e.ma_lich_hen,
      muc_dich: e.muc_dich,
      ngay_hen: e.ngay_hen,
      gio_bat_dau: e.gio_bat_dau,
      gio_ket_thuc: e.gio_ket_thuc,
      dia_diem: e.dia_diem,
      trang_thai: e.trang_thai,
      ly_do_huy: e.ly_do_huy,
      ghi_chu_nutritionist: e.ghi_chu_nutritionist,
      tao_luc: e.tao_luc.toISOString(),
      cap_nhat_luc: e.cap_nhat_luc.toISOString(),
    };
  }
}
