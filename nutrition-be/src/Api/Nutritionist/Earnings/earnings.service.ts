import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LichHenEntity } from '../../Admin/Booking/entities/lich-hen.entity';
import { ThanhToanTuVanEntity } from '../../Admin/Booking/entities/thanh-toan-tu-van.entity';
import { ChuyenGiaDinhDuongEntity } from '../../Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';

@Injectable()
export class NutritionistEarningsService {
  constructor(
    @InjectRepository(LichHenEntity)
    private readonly lichHenRepo: Repository<LichHenEntity>,
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
      return { success: false, message: 'Khong tim thay chuyen gia' };
    }

    // Chỉ tính booking đã hoàn thành và có thanh toán thành công.
    const overview = await this.lichHenRepo
      .createQueryBuilder('lh')
      .innerJoin(
        ThanhToanTuVanEntity,
        'tt',
        'tt.lich_hen_id = lh.id AND tt.trang_thai = :paymentStatus',
        { paymentStatus: 'thanh_cong' },
      )
      .where('lh.chuyen_gia_dinh_duong_id = :cgId', { cgId: expert.id })
      .andWhere('lh.trang_thai = :bookingStatus', { bookingStatus: 'hoan_thanh' })
      .andWhere('lh.ngay_hen >= :start', { start })
      .andWhere('lh.ngay_hen <= :end', { end })
      .select([
        'COUNT(DISTINCT lh.id) as so_booking',
        'COALESCE(SUM(tt.so_tien), 0) as tong_thu_nhap',
      ])
      .getRawOne();

    // Thu nhập theo tháng
    const byMonth = await this.lichHenRepo
      .createQueryBuilder('lh')
      .innerJoin(
        ThanhToanTuVanEntity,
        'tt',
        'tt.lich_hen_id = lh.id AND tt.trang_thai = :paymentStatus',
        { paymentStatus: 'thanh_cong' },
      )
      .where('lh.chuyen_gia_dinh_duong_id = :cgId', { cgId: expert.id })
      .andWhere('lh.trang_thai = :bookingStatus', { bookingStatus: 'hoan_thanh' })
      .andWhere('lh.ngay_hen >= :start', { start })
      .andWhere('lh.ngay_hen <= :end', { end })
      .select([
        "DATE_FORMAT(lh.ngay_hen, '%Y-%m') as thang",
        'COUNT(DISTINCT lh.id) as so_booking',
        'COALESCE(SUM(tt.so_tien), 0) as thu_nhap',
      ])
      .groupBy('thang')
      .orderBy('thang', 'ASC')
      .getRawMany();

    // Chi tiết từng giao dịch đã thanh toán thành công.
    const transactions = await this.lichHenRepo
      .createQueryBuilder('lh')
      .innerJoin(ThanhToanTuVanEntity, 'tt', 'tt.lich_hen_id = lh.id')
      .innerJoin('lh.tai_khoan', 'tk')
      .innerJoin('lh.goi_tu_van', 'gtv')
      .where('lh.chuyen_gia_dinh_duong_id = :cgId', { cgId: expert.id })
      .andWhere('lh.trang_thai = :bookingStatus', { bookingStatus: 'hoan_thanh' })
      .andWhere('tt.trang_thai = :paymentStatus', { paymentStatus: 'thanh_cong' })
      .andWhere('lh.ngay_hen >= :start', { start })
      .andWhere('lh.ngay_hen <= :end', { end })
      .select([
        'lh.id as booking_id',
        'lh.ma_lich_hen as ma_lich_hen',
        'lh.ngay_hen as ngay',
        'tk.ho_ten as ten_user',
        'gtv.ten as ten_goi',
        'tt.so_tien as so_tien',
        'tt.trang_thai as trang_thai_thanh_toan',
        'tt.thanh_toan_luc as ngay_thanh_toan',
      ])
      .orderBy('lh.ngay_hen', 'DESC')
      .getRawMany();

    return {
      success: true,
      message: 'Lay thu nhap thanh cong',
      data: {
        tong_thu_nhap: Number(overview?.tong_thu_nhap ?? 0),
        so_booking: Number(overview?.so_booking ?? 0),
        khoang_ngay: { start_date: start, end_date: end },
        thu_nhap_theo_thang: byMonth.map((m) => ({
          thang: m.thang,
          so_booking: Number(m.so_booking),
          thu_nhap: Number(m.thu_nhap),
        })),
        chi_tiet: transactions.map((t) => ({
          booking_id: Number(t.booking_id),
          ma_lich_hen: t.ma_lich_hen,
          ngay: t.ngay,
          ten_user: t.ten_user,
          ten_goi: t.ten_goi,
          so_tien: Number(t.so_tien),
          trang_thai_thanh_toan: t.trang_thai_thanh_toan,
          ngay_thanh_toan: t.ngay_thanh_toan,
        })),
      },
    };
  }
}
