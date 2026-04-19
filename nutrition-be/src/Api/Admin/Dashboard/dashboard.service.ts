import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { TaiKhoanEntity } from '../User/entities/tai-khoan.entity';
import { ThucPhamEntity } from '../Food/entities/thuc-pham.entity';
import { YeuCauDuyetThucPhamEntity } from '../FoodReview/entities/yeu-cau-duyet-thuc-pham.entity';
import { ThongBaoEntity } from '../FoodReview/entities/thong-bao.entity';
import { DangKyGoiDichVuEntity } from '../Subscription/entities/dang-ky-goi-dich-vu.entity';
import { ThanhToanGoiDichVuEntity } from '../Payment/entities/thanh-toan-goi-dich-vu.entity';
import { GoiDichVuEntity } from '../Package/entities/goi-dich-vu.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(TaiKhoanEntity)
    private readonly userRepository: Repository<TaiKhoanEntity>,
    @InjectRepository(ThucPhamEntity)
    private readonly foodRepository: Repository<ThucPhamEntity>,
    @InjectRepository(YeuCauDuyetThucPhamEntity)
    private readonly reviewRepository: Repository<YeuCauDuyetThucPhamEntity>,
    @InjectRepository(ThongBaoEntity)
    private readonly notificationRepository: Repository<ThongBaoEntity>,
    @InjectRepository(DangKyGoiDichVuEntity)
    private readonly subscriptionRepository: Repository<DangKyGoiDichVuEntity>,
    @InjectRepository(ThanhToanGoiDichVuEntity)
    private readonly paymentRepository: Repository<ThanhToanGoiDichVuEntity>,
    @InjectRepository(GoiDichVuEntity)
    private readonly packageRepository: Repository<GoiDichVuEntity>,
  ) {}

  async getDashboard() {
    // === Tổng tài khoản ===
    const totalUsers = await this.userRepository.count({
      where: { xoa_luc: IsNull() },
    });

    // Phân bổ vai trò
    const usersByRole = await this.userRepository
      .createQueryBuilder('u')
      .select('u.vai_tro', 'vai_tro')
      .addSelect('COUNT(u.id)', 'so_luong')
      .where('u.xoa_luc IS NULL')
      .groupBy('u.vai_tro')
      .getRawMany();

    // Tài khoản mới 7 ngày
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersWeek = await this.userRepository
      .createQueryBuilder('u')
      .where('u.xoa_luc IS NULL')
      .andWhere('u.tao_luc >= :date', { date: sevenDaysAgo })
      .getCount();

    // Tài khoản mới 30 ngày
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsersMonth = await this.userRepository
      .createQueryBuilder('u')
      .where('u.xoa_luc IS NULL')
      .andWhere('u.tao_luc >= :date', { date: thirtyDaysAgo })
      .getCount();

    // User đăng ký theo ngày (14 ngày gần nhất)
    const userRegistrationTrend = await this.userRepository
      .createQueryBuilder('u')
      .select("DATE_FORMAT(u.tao_luc, '%Y-%m-%d')", 'ngay')
      .addSelect('COUNT(u.id)', 'so_luong')
      .where('u.xoa_luc IS NULL')
      .andWhere('u.tao_luc >= :date', {
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      })
      .groupBy('ngay')
      .orderBy('ngay', 'ASC')
      .getRawMany();

    // === Thực phẩm ===
    const totalFoods = await this.foodRepository.count();

    // === Yêu cầu duyệt ===
    const pendingReviews = await this.reviewRepository.count({
      where: { trang_thai: 'cho_duyet' as any },
    });
    const totalReviews = await this.reviewRepository.count();
    const approvedReviews = await this.reviewRepository.count({
      where: { trang_thai: 'da_duyet' as any },
    });
    const rejectedReviews = await this.reviewRepository.count({
      where: { trang_thai: 'tu_choi' as any },
    });

    // === Thông báo ===
    const unreadNotifications = await this.notificationRepository.count({
      where: { trang_thai: 'chua_doc' as any },
    });
    const totalNotifications = await this.notificationRepository.count();

    // === Gói dịch vụ ===
    const activeSubscriptions = await this.subscriptionRepository.count({
      where: { trang_thai: 'dang_hoat_dong' },
    });
    const totalPackages = await this.packageRepository.count({
      where: { xoa_luc: IsNull() },
    });

    // Phân bổ đăng ký theo gói
    const subscriptionsByPackage = await this.subscriptionRepository
      .createQueryBuilder('s')
      .innerJoin('s.goi_dich_vu', 'g')
      .select('g.ten_goi', 'ten_goi')
      .addSelect('COUNT(s.id)', 'so_luong')
      .where("s.trang_thai = 'dang_hoat_dong'")
      .groupBy('g.ten_goi')
      .getRawMany();

    // === Doanh thu tóm tắt ===
    const revenueTotal = await this.paymentRepository
      .createQueryBuilder('p')
      .select('SUM(p.so_tien)', 'total')
      .where("p.trang_thai = 'thanh_cong'")
      .getRawOne();

    const revenueThisMonth = await this.paymentRepository
      .createQueryBuilder('p')
      .select('SUM(p.so_tien)', 'total')
      .where("p.trang_thai = 'thanh_cong'")
      .andWhere(
        "DATE_FORMAT(p.thanh_toan_luc, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')",
      )
      .getRawOne();

    // Doanh thu 7 ngày gần nhất theo ngày
    const revenueTrend = await this.paymentRepository
      .createQueryBuilder('p')
      .select("DATE_FORMAT(p.thanh_toan_luc, '%Y-%m-%d')", 'ngay')
      .addSelect('SUM(p.so_tien)', 'doanh_thu')
      .addSelect('COUNT(p.id)', 'so_giao_dich')
      .where("p.trang_thai = 'thanh_cong'")
      .andWhere('p.thanh_toan_luc >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)')
      .groupBy('ngay')
      .orderBy('ngay', 'ASC')
      .getRawMany();

    // Trạng thái thanh toán
    const paymentsByStatus = await this.paymentRepository
      .createQueryBuilder('p')
      .select('p.trang_thai', 'trang_thai')
      .addSelect('COUNT(p.id)', 'so_luong')
      .groupBy('p.trang_thai')
      .getRawMany();

    return {
      success: true,
      message: 'Dashboard quan tri',
      data: {
        tong_tai_khoan: totalUsers,
        tai_khoan_moi_7_ngay: newUsersWeek,
        tai_khoan_moi_30_ngay: newUsersMonth,
        phan_bo_vai_tro: usersByRole.map((r) => ({
          vai_tro: r.vai_tro,
          so_luong: Number(r.so_luong),
        })),
        xu_huong_dang_ky: userRegistrationTrend.map((r) => ({
          ngay: r.ngay,
          so_luong: Number(r.so_luong),
        })),
        tong_thuc_pham: totalFoods,
        yeu_cau_duyet: {
          cho_duyet: pendingReviews,
          da_duyet: approvedReviews,
          tu_choi: rejectedReviews,
          tong: totalReviews,
        },
        thong_bao: {
          chua_doc: unreadNotifications,
          tong: totalNotifications,
        },
        goi_dich_vu: {
          tong_goi: totalPackages,
          dang_hoat_dong: activeSubscriptions,
          phan_bo: subscriptionsByPackage.map((p) => ({
            ten_goi: p.ten_goi,
            so_luong: Number(p.so_luong),
          })),
        },
        doanh_thu: {
          tong: Number(revenueTotal?.total ?? 0),
          thang_nay: Number(revenueThisMonth?.total ?? 0),
          xu_huong: revenueTrend.map((r) => ({
            ngay: r.ngay,
            doanh_thu: Number(r.doanh_thu ?? 0),
            so_giao_dich: Number(r.so_giao_dich ?? 0),
          })),
        },
        thanh_toan_theo_trang_thai: paymentsByStatus.map((p) => ({
          trang_thai: p.trang_thai,
          so_luong: Number(p.so_luong),
        })),
      },
    };
  }
}
