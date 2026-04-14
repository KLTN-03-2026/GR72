import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThanhToanGoiDichVuEntity } from '../Payment/entities/thanh-toan-goi-dich-vu.entity';
import { DangKyGoiDichVuEntity } from '../Subscription/entities/dang-ky-goi-dich-vu.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(ThanhToanGoiDichVuEntity)
    private readonly paymentRepository: Repository<ThanhToanGoiDichVuEntity>,
    @InjectRepository(DangKyGoiDichVuEntity)
    private readonly subscriptionRepository: Repository<DangKyGoiDichVuEntity>,
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
}
