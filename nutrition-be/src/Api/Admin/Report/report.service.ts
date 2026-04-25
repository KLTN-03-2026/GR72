import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThanhToanGoiDichVuEntity } from '../Payment/entities/thanh-toan-goi-dich-vu.entity';
import { DangKyGoiDichVuEntity } from '../Subscription/entities/dang-ky-goi-dich-vu.entity';
import { PhanBoDoanhThuBookingEntity } from '../Booking/entities/phan-bo-doanh-thu-booking.entity';
import { ChuyenGiaDinhDuongEntity } from '../ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(ThanhToanGoiDichVuEntity)
    private readonly paymentRepository: Repository<ThanhToanGoiDichVuEntity>,
    @InjectRepository(DangKyGoiDichVuEntity)
    private readonly subscriptionRepository: Repository<DangKyGoiDichVuEntity>,
    @InjectRepository(PhanBoDoanhThuBookingEntity)
    private readonly bookingAllocationRepository: Repository<PhanBoDoanhThuBookingEntity>,
    @InjectRepository(ChuyenGiaDinhDuongEntity)
    private readonly nutritionistRepository: Repository<ChuyenGiaDinhDuongEntity>,
  ) {}

  async getRevenue() {
    // Tổng doanh thu
    const totalResult = await this.paymentRepository
      .createQueryBuilder('p')
      .select('SUM(p.so_tien)', 'total')
      .addSelect('COUNT(p.id)', 'count')
      .where("p.trang_thai = 'thanh_cong'")
      .getRawOne();

    // Doanh thu theo tháng (12 tháng gần nhất)
    const monthlyRevenue = await this.paymentRepository
      .createQueryBuilder('p')
      .select("DATE_FORMAT(p.thanh_toan_luc, '%Y-%m')", 'thang')
      .addSelect('SUM(p.so_tien)', 'doanh_thu')
      .addSelect('COUNT(p.id)', 'so_giao_dich')
      .where("p.trang_thai = 'thanh_cong'")
      .andWhere('p.thanh_toan_luc >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)')
      .groupBy('thang')
      .orderBy('thang', 'ASC')
      .getRawMany();

    return {
      success: true,
      message: 'Bao cao doanh thu',
      data: {
        tong_doanh_thu: Number(totalResult?.total ?? 0),
        tong_giao_dich: Number(totalResult?.count ?? 0),
        doanh_thu_theo_thang: monthlyRevenue.map((r) => ({
          thang: r.thang,
          doanh_thu: Number(r.doanh_thu ?? 0),
          so_giao_dich: Number(r.so_giao_dich ?? 0),
        })),
      },
    };
  }

  async getPackageStats() {
    // Số user đang dùng từng gói
    const usersPerPackage = await this.subscriptionRepository
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.goi_dich_vu', 'g')
      .select('g.id', 'goi_id')
      .addSelect('g.ten_goi', 'ten_goi')
      .addSelect('g.la_goi_mien_phi', 'la_goi_mien_phi')
      .addSelect('COUNT(s.id)', 'so_nguoi_dung')
      .where("s.trang_thai = 'dang_hoat_dong'")
      .groupBy('g.id')
      .addGroupBy('g.ten_goi')
      .addGroupBy('g.la_goi_mien_phi')
      .orderBy('so_nguoi_dung', 'DESC')
      .getRawMany();

    // Gói bán chạy nhất (dựa trên thanh toán thành công)
    const bestSelling = await this.paymentRepository
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.goi_dich_vu', 'g')
      .select('g.id', 'goi_id')
      .addSelect('g.ten_goi', 'ten_goi')
      .addSelect('COUNT(p.id)', 'so_giao_dich')
      .addSelect('SUM(p.so_tien)', 'tong_tien')
      .where("p.trang_thai = 'thanh_cong'")
      .groupBy('g.id')
      .addGroupBy('g.ten_goi')
      .orderBy('so_giao_dich', 'DESC')
      .limit(5)
      .getRawMany();

    // Tỷ lệ chuyển đổi
    const totalFree = await this.subscriptionRepository.count({
      where: { trang_thai: 'dang_hoat_dong' },
    });
    const totalPaid = usersPerPackage
      .filter((p) => !p.la_goi_mien_phi)
      .reduce((sum, p) => sum + Number(p.so_nguoi_dung), 0);

    return {
      success: true,
      message: 'Thong ke goi dich vu',
      data: {
        phan_bo_nguoi_dung: usersPerPackage.map((p) => ({
          goi_id: p.goi_id,
          ten_goi: p.ten_goi,
          so_nguoi_dung: Number(p.so_nguoi_dung),
        })),
        goi_ban_chay: bestSelling.map((b) => ({
          goi_id: b.goi_id,
          ten_goi: b.ten_goi,
          so_giao_dich: Number(b.so_giao_dich),
          tong_tien: Number(b.tong_tien ?? 0),
        })),
        ty_le_chuyen_doi: {
          tong_dang_ky_hoat_dong: totalFree,
          tra_phi: totalPaid,
          ty_le: totalFree > 0 ? Math.round((totalPaid / totalFree) * 100) : 0,
        },
      },
    };
  }

  async getSystemRevenue(query?: { startDate?: string; endDate?: string }) {
    const range = this.resolveRange(query?.startDate, query?.endDate);
    const registrationFee = Number(
      process.env.NUTRITIONIST_REGISTRATION_FEE ?? 500000,
    );

    const [
      registrationSummaryRaw,
      commissionSummaryRaw,
      registrationByMonthRaw,
      commissionByMonthRaw,
    ] = await Promise.all([
      this.nutritionistRepository
        .createQueryBuilder('cg')
        .select('COUNT(cg.id)', 'so_luot')
        .where("cg.trang_thai_thanh_toan = 'thanh_cong'")
        .andWhere('DATE(cg.ngay_thanh_toan) >= :startDate', {
          startDate: range.startDate,
        })
        .andWhere('DATE(cg.ngay_thanh_toan) <= :endDate', {
          endDate: range.endDate,
        })
        .getRawOne<{ so_luot: string | null }>(),
      this.bookingAllocationRepository
        .createQueryBuilder('pb')
        .innerJoin('pb.lich_hen', 'lh')
        .select('COUNT(pb.id)', 'so_luot')
        .addSelect('COALESCE(SUM(pb.so_tien_hoa_hong), 0)', 'tong_hoa_hong')
        .where("pb.trang_thai = 'da_ghi_nhan'")
        .andWhere("lh.trang_thai = 'hoan_thanh'")
        .andWhere('DATE(pb.cap_nhat_luc) >= :startDate', {
          startDate: range.startDate,
        })
        .andWhere('DATE(pb.cap_nhat_luc) <= :endDate', {
          endDate: range.endDate,
        })
        .getRawOne<{ so_luot: string | null; tong_hoa_hong: string | null }>(),
      this.nutritionistRepository
        .createQueryBuilder('cg')
        .select("DATE_FORMAT(cg.ngay_thanh_toan, '%Y-%m')", 'thang')
        .addSelect('COUNT(cg.id)', 'so_luot')
        .where("cg.trang_thai_thanh_toan = 'thanh_cong'")
        .andWhere('DATE(cg.ngay_thanh_toan) >= :startDate', {
          startDate: range.startDate,
        })
        .andWhere('DATE(cg.ngay_thanh_toan) <= :endDate', {
          endDate: range.endDate,
        })
        .groupBy('thang')
        .orderBy('thang', 'ASC')
        .getRawMany<{ thang: string; so_luot: string }>(),
      this.bookingAllocationRepository
        .createQueryBuilder('pb')
        .innerJoin('pb.lich_hen', 'lh')
        .select("DATE_FORMAT(pb.cap_nhat_luc, '%Y-%m')", 'thang')
        .addSelect('COUNT(pb.id)', 'so_booking')
        .addSelect('COALESCE(SUM(pb.so_tien_hoa_hong), 0)', 'tong_hoa_hong')
        .where("pb.trang_thai = 'da_ghi_nhan'")
        .andWhere("lh.trang_thai = 'hoan_thanh'")
        .andWhere('DATE(pb.cap_nhat_luc) >= :startDate', {
          startDate: range.startDate,
        })
        .andWhere('DATE(pb.cap_nhat_luc) <= :endDate', {
          endDate: range.endDate,
        })
        .groupBy('thang')
        .orderBy('thang', 'ASC')
        .getRawMany<{
          thang: string;
          so_booking: string;
          tong_hoa_hong: string;
        }>(),
    ]);

    const registrationCount = Number(registrationSummaryRaw?.so_luot ?? 0);
    const registrationRevenue = registrationCount * registrationFee;
    const commissionCount = Number(commissionSummaryRaw?.so_luot ?? 0);
    const commissionRevenue = Number(commissionSummaryRaw?.tong_hoa_hong ?? 0);

    const monthMap = new Map<
      string,
      {
        thang: string;
        doanh_thu_phi_dang_ky: number;
        doanh_thu_hoa_hong: number;
        tong_doanh_thu_he_thong: number;
        so_dang_ky_thanh_cong: number;
        so_booking_tinh_hoa_hong: number;
      }
    >();

    for (const row of registrationByMonthRaw) {
      const count = Number(row.so_luot ?? 0);
      const current = monthMap.get(row.thang) ?? {
        thang: row.thang,
        doanh_thu_phi_dang_ky: 0,
        doanh_thu_hoa_hong: 0,
        tong_doanh_thu_he_thong: 0,
        so_dang_ky_thanh_cong: 0,
        so_booking_tinh_hoa_hong: 0,
      };
      current.so_dang_ky_thanh_cong = count;
      current.doanh_thu_phi_dang_ky = count * registrationFee;
      current.tong_doanh_thu_he_thong =
        current.doanh_thu_phi_dang_ky + current.doanh_thu_hoa_hong;
      monthMap.set(row.thang, current);
    }

    for (const row of commissionByMonthRaw) {
      const amount = Number(row.tong_hoa_hong ?? 0);
      const count = Number(row.so_booking ?? 0);
      const current = monthMap.get(row.thang) ?? {
        thang: row.thang,
        doanh_thu_phi_dang_ky: 0,
        doanh_thu_hoa_hong: 0,
        tong_doanh_thu_he_thong: 0,
        so_dang_ky_thanh_cong: 0,
        so_booking_tinh_hoa_hong: 0,
      };
      current.doanh_thu_hoa_hong = amount;
      current.so_booking_tinh_hoa_hong = count;
      current.tong_doanh_thu_he_thong =
        current.doanh_thu_phi_dang_ky + current.doanh_thu_hoa_hong;
      monthMap.set(row.thang, current);
    }

    return {
      success: true,
      message: 'Bao cao doanh thu he thong',
      data: {
        pham_vi: {
          start_date: range.startDate,
          end_date: range.endDate,
        },
        tong_quan: {
          tong_doanh_thu_he_thong: registrationRevenue + commissionRevenue,
          tong_phi_dang_ky_chuyen_gia: registrationRevenue,
          tong_hoa_hong_booking: commissionRevenue,
          so_luot_dang_ky_chuyen_gia_thanh_cong: registrationCount,
          so_booking_tinh_hoa_hong: commissionCount,
          muc_phi_dang_ky_hien_tai: registrationFee,
        },
        theo_thang: Array.from(monthMap.values()).sort((a, b) =>
          a.thang.localeCompare(b.thang),
        ),
      },
    };
  }

  private resolveRange(startDate?: string, endDate?: string) {
    const today = new Date();
    const defaultStart = new Date(today.getFullYear(), today.getMonth() - 11, 1);
    const defaultEnd = today;

    const normalizedStart = this.normalizeDate(startDate) ?? defaultStart;
    const normalizedEnd = this.normalizeDate(endDate) ?? defaultEnd;

    let start = normalizedStart;
    let end = normalizedEnd;
    if (start.getTime() > end.getTime()) {
      start = normalizedEnd;
      end = normalizedStart;
    }

    return {
      startDate: this.toDateOnly(start),
      endDate: this.toDateOnly(end),
    };
  }

  private normalizeDate(value?: string) {
    if (!value) return null;
    const matched = value.match(/^\d{4}-\d{2}-\d{2}$/);
    if (!matched) return null;
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private toDateOnly(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
