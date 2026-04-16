import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LichHenEntity } from '../../Admin/Booking/entities/lich-hen.entity';
import { PhanBoDoanhThuBookingEntity } from '../../Admin/Booking/entities/phan-bo-doanh-thu-booking.entity';
import { ThanhToanTuVanEntity } from '../../Admin/Booking/entities/thanh-toan-tu-van.entity';
import { ChuyenGiaDinhDuongEntity } from '../../Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';

@Injectable()
export class NutritionistEarningsService {
  constructor(
    @InjectRepository(LichHenEntity)
    private readonly lichHenRepo: Repository<LichHenEntity>,
    @InjectRepository(PhanBoDoanhThuBookingEntity)
    private readonly allocationRepo: Repository<PhanBoDoanhThuBookingEntity>,
    @InjectRepository(ChuyenGiaDinhDuongEntity)
    private readonly cgRepo: Repository<ChuyenGiaDinhDuongEntity>,
  ) {}

  async getEarnings(userId: number, query: { startDate?: string; endDate?: string }) {
    const now = new Date();
    const start = query.startDate
      ? query.startDate
      : new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = query.endDate ? query.endDate : now.toISOString().split('T')[0];

    const expert = await this.cgRepo.findOne({ where: { tai_khoan_id: userId } });
    if (!expert) {
      throw new NotFoundException('Khong tim thay chuyen gia');
    }

    const overview = await this.allocationRepo
      .createQueryBuilder('pb')
      .innerJoin(LichHenEntity, 'lh', 'lh.id = pb.lich_hen_id')
      .where('pb.chuyen_gia_dinh_duong_id = :cgId', { cgId: expert.id })
      .andWhere('pb.trang_thai = :allocationStatus', { allocationStatus: 'da_ghi_nhan' })
      .andWhere('lh.trang_thai = :bookingStatus', { bookingStatus: 'hoan_thanh' })
      .andWhere('lh.ngay_hen >= :start', { start })
      .andWhere('lh.ngay_hen <= :end', { end })
      .select([
        'COUNT(DISTINCT pb.lich_hen_id) as so_booking',
        'COALESCE(SUM(pb.so_tien_goc), 0) as tong_thu_nhap_gop',
        'COALESCE(SUM(pb.so_tien_hoa_hong), 0) as tong_phi_hoa_hong',
        'COALESCE(SUM(pb.so_tien_chuyen_gia_nhan), 0) as tong_thu_nhap_rong',
      ])
      .getRawOne();

    const byMonth = await this.allocationRepo
      .createQueryBuilder('pb')
      .innerJoin(LichHenEntity, 'lh', 'lh.id = pb.lich_hen_id')
      .where('pb.chuyen_gia_dinh_duong_id = :cgId', { cgId: expert.id })
      .andWhere('pb.trang_thai = :allocationStatus', { allocationStatus: 'da_ghi_nhan' })
      .andWhere('lh.trang_thai = :bookingStatus', { bookingStatus: 'hoan_thanh' })
      .andWhere('lh.ngay_hen >= :start', { start })
      .andWhere('lh.ngay_hen <= :end', { end })
      .select([
        "DATE_FORMAT(lh.ngay_hen, '%Y-%m') as thang",
        'COUNT(DISTINCT pb.lich_hen_id) as so_booking',
        'COALESCE(SUM(pb.so_tien_goc), 0) as tong_thu_nhap_gop',
        'COALESCE(SUM(pb.so_tien_hoa_hong), 0) as tong_phi_hoa_hong',
        'COALESCE(SUM(pb.so_tien_chuyen_gia_nhan), 0) as tong_thu_nhap_rong',
      ])
      .groupBy('thang')
      .orderBy('thang', 'ASC')
      .getRawMany();

    const transactions = await this.allocationRepo
      .createQueryBuilder('pb')
      .innerJoin(LichHenEntity, 'lh', 'lh.id = pb.lich_hen_id')
      .innerJoin(ThanhToanTuVanEntity, 'tt', 'tt.id = pb.thanh_toan_tu_van_id')
      .innerJoin('lh.tai_khoan', 'tk')
      .innerJoin('lh.goi_tu_van', 'gtv')
      .where('pb.chuyen_gia_dinh_duong_id = :cgId', { cgId: expert.id })
      .andWhere('pb.trang_thai = :allocationStatus', { allocationStatus: 'da_ghi_nhan' })
      .andWhere('lh.trang_thai = :bookingStatus', { bookingStatus: 'hoan_thanh' })
      .andWhere('lh.ngay_hen >= :start', { start })
      .andWhere('lh.ngay_hen <= :end', { end })
      .select([
        'lh.id as booking_id',
        'lh.ma_lich_hen as ma_lich_hen',
        'lh.ngay_hen as ngay',
        'tk.ho_ten as ten_user',
        'gtv.ten as ten_goi',
        'pb.so_tien_goc as gia_goi',
        'pb.so_tien_hoa_hong as phi_hoa_hong',
        'pb.so_tien_chuyen_gia_nhan as thu_nhap_rong',
        'pb.trang_thai as trang_thai_phan_bo',
        'tt.trang_thai as trang_thai_thanh_toan',
        'tt.thanh_toan_luc as ngay_thanh_toan',
      ])
      .orderBy('lh.ngay_hen', 'DESC')
      .getRawMany();

    return {
      success: true,
      message: 'Lay thu nhap thanh cong',
      data: {
        tong_thu_nhap_gop: Number(overview?.tong_thu_nhap_gop ?? 0),
        tong_phi_hoa_hong: Number(overview?.tong_phi_hoa_hong ?? 0),
        tong_thu_nhap_rong: Number(overview?.tong_thu_nhap_rong ?? 0),
        so_booking: Number(overview?.so_booking ?? 0),
        khoang_ngay: { start_date: start, end_date: end },
        thu_nhap_theo_thang: byMonth.map((month) => ({
          thang: month.thang,
          so_booking: Number(month.so_booking),
          tong_thu_nhap_gop: Number(month.tong_thu_nhap_gop),
          tong_phi_hoa_hong: Number(month.tong_phi_hoa_hong),
          tong_thu_nhap_rong: Number(month.tong_thu_nhap_rong),
        })),
        chi_tiet: transactions.map((transaction) => ({
          booking_id: Number(transaction.booking_id),
          ma_lich_hen: transaction.ma_lich_hen,
          ngay: transaction.ngay,
          ten_user: transaction.ten_user,
          ten_goi: transaction.ten_goi,
          gia_goi: Number(transaction.gia_goi),
          phi_hoa_hong: Number(transaction.phi_hoa_hong),
          thu_nhap_rong: Number(transaction.thu_nhap_rong),
          trang_thai_phan_bo: transaction.trang_thai_phan_bo,
          trang_thai_thanh_toan: transaction.trang_thai_thanh_toan,
          ngay_thanh_toan: transaction.ngay_thanh_toan,
        })),
      },
    };
  }
}
