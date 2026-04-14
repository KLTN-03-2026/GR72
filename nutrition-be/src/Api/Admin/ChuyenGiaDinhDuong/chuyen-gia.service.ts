import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { IsNull, Like, Repository } from 'typeorm';
import {
  ChuyenGiaDinhDuongEntity,
  ChuyenGiaStatus,
} from './entities/chuyen-gia-dinh-duong.entity';
import { TaiKhoanEntity } from '../User/entities/tai-khoan.entity';
import { ThongBaoEntity } from '../FoodReview/entities/thong-bao.entity';
import { DangKyGoiDichVuEntity } from '../Subscription/entities/dang-ky-goi-dich-vu.entity';
import { GoiDichVuEntity } from '../Package/entities/goi-dich-vu.entity';

@Injectable()
export class ChuyenGiaService {
  constructor(
    @InjectRepository(ChuyenGiaDinhDuongEntity)
    private readonly cgRepository: Repository<ChuyenGiaDinhDuongEntity>,
    @InjectRepository(TaiKhoanEntity)
    private readonly userRepository: Repository<TaiKhoanEntity>,
    @InjectRepository(ThongBaoEntity)
    private readonly notificationRepository: Repository<ThongBaoEntity>,
    @InjectRepository(DangKyGoiDichVuEntity)
    private readonly subscriptionRepo: Repository<DangKyGoiDichVuEntity>,
    @InjectRepository(GoiDichVuEntity)
    private readonly packageRepo: Repository<GoiDichVuEntity>,
  ) {}

  // =========================================================
  // MODULE 1: Duyệt đơn đăng ký Nutritionist
  // =========================================================
  async findRegistrations(query: {
    trang_thai?: string;
    trang_thai_thanh_toan?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.trang_thai) where.trang_thai = query.trang_thai;
    where.tai_khoan = { xoa_luc: IsNull() };

    const qb = this.cgRepository
      .createQueryBuilder('cg')
      .leftJoinAndSelect('cg.tai_khoan', 'tai_khoan')
      .where('tai_khoan.xoa_luc IS NULL');

    if (query.trang_thai)
      qb.andWhere('cg.trang_thai = :trang_thai', {
        trang_thai: query.trang_thai,
      });
    if (query.trang_thai_thanh_toan) {
      qb.andWhere('cg.trang_thai_thanh_toan = :trang_thai_thanh_toan', {
        trang_thai_thanh_toan: query.trang_thai_thanh_toan,
      });
    }
    if (query.search) {
      qb.andWhere(
        '(tai_khoan.ho_ten LIKE :search OR tai_khoan.email LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [items, total] = await qb
      .orderBy('cg.tao_luc', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      success: true,
      message: 'Lay danh sach don dang ky thanh cong',
      data: {
        items: items.map((i) => this.toPublic(i)),
        pagination: { page, limit, total },
      },
    };
  }

  async getRegistrationDetail(id: number) {
    const entity = await this.cgRepository.findOne({
      where: { id },
      relations: ['tai_khoan'],
    });
    if (!entity) throw new NotFoundException('Don dang ky khong ton tai');
    return {
      success: true,
      message: 'Lay chi tiet thanh cong',
      data: this.toPublic(entity),
    };
  }

  async approveRegistration(id: number, adminId: number) {
    const entity = await this.cgRepository.findOne({
      where: { id },
      relations: ['tai_khoan'],
    });
    if (!entity) throw new NotFoundException('Don dang ky khong ton tai');
    if (entity.trang_thai !== 'cho_duyet') {
      throw new BadRequestException(
        'Chi co the duyet don dang o trang thai cho duyet',
      );
    }
    if (entity.trang_thai_thanh_toan !== 'thanh_cong') {
      throw new BadRequestException(
        'Don dang ky chua duoc thanh toan. Vui long kiem tra thanh toan truoc khi duyet.',
      );
    }

    const now = new Date();
    entity.trang_thai = 'hoat_dong';
    entity.ngay_duyet = now;
    entity.cap_nhat_luc = now;
    await this.cgRepository.save(entity);

    // Update tai_khoan role
    await this.userRepository.update(entity.tai_khoan_id, {
      vai_tro: 'chuyen_gia_dinh_duong',
      trang_thai: 'hoat_dong',
      cap_nhat_luc: now,
    });

    // Grant premium subscription for Nutritionist
    await this.grantPremiumSubscription(entity.tai_khoan_id);

    // Send notification
    await this.createNotification(
      entity.tai_khoan_id,
      'duyet_nutritionist',
      'Đơn đăng ký được duyệt',
      `Chúc mừng bạn! Đơn đăng ký trở thành Chuyên gia Dinh dưỡng đã được duyệt. Bây giờ bạn có thể tạo gói tư vấn và nhận booking.`,
      null,
    );

    return {
      success: true,
      message: 'Duyet don dang ky thanh cong',
      data: this.toPublic(entity),
    };
  }

  async rejectRegistration(id: number, dto: { ly_do_tu_choi: string }) {
    if (!dto.ly_do_tu_choi?.trim()) {
      throw new BadRequestException('Ly do tu choi la bat buoc');
    }

    const entity = await this.cgRepository.findOne({
      where: { id },
      relations: ['tai_khoan'],
    });
    if (!entity) throw new NotFoundException('Don dang ky khong ton tai');
    if (entity.trang_thai !== 'cho_duyet') {
      throw new BadRequestException(
        'Chi co the tu choi don dang o trang thai cho duyet',
      );
    }

    entity.trang_thai = 'tu_choi' as typeof entity.trang_thai;
    entity.ly_do_tu_choi = dto.ly_do_tu_choi.trim();
    entity.cap_nhat_luc = new Date();
    await this.cgRepository.save(entity);

    await this.userRepository.update(entity.tai_khoan_id, {
      trang_thai: 'khong_hoat_dong',
      cap_nhat_luc: entity.cap_nhat_luc,
    });

    await this.createNotification(
      entity.tai_khoan_id,
      'tu_choi_nutritionist',
      'Đơn đăng ký bị từ chối',
      `Rất tiếc, đơn đăng ký trở thành Chuyên gia Dinh dưỡng của bạn đã bị từ chối. Lý do: ${dto.ly_do_tu_choi}`,
      null,
    );

    return {
      success: true,
      message: 'Tu choi don dang ky thanh cong',
      data: this.toPublic(entity),
    };
  }

  // =========================================================
  // MODULE 2: Quản lý trạng thái Nutritionist
  // =========================================================
  async findNutritionists(query: {
    trang_thai?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.cgRepository
      .createQueryBuilder('cg')
      .leftJoinAndSelect('cg.tai_khoan', 'tai_khoan')
      .where('tai_khoan.xoa_luc IS NULL')
      .andWhere('cg.trang_thai IN (:...statuses)', {
        statuses: ['hoat_dong', 'bi_khoa'],
      });

    if (query.trang_thai)
      qb.andWhere('cg.trang_thai = :trang_thai', {
        trang_thai: query.trang_thai,
      });
    if (query.search) {
      qb.andWhere(
        '(tai_khoan.ho_ten LIKE :search OR tai_khoan.email LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [items, total] = await qb
      .orderBy('cg.tao_luc', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      success: true,
      message: 'Lay danh sach nutritionist thanh cong',
      data: {
        items: items.map((i) => this.toPublic(i)),
        pagination: { page, limit, total },
      },
    };
  }

  async getNutritionistDetail(id: number) {
    const entity = await this.cgRepository.findOne({
      where: { id },
      relations: ['tai_khoan'],
    });
    if (!entity) throw new NotFoundException('Nutritionist khong ton tai');

    const stats = await this.getNutritionistStats(id);

    return {
      success: true,
      message: 'Lay chi tiet nutritionist thanh cong',
      data: { ...this.toPublic(entity), ...stats },
    };
  }

  async banNutritionist(id: number, dto: { ly_do_bi_khoa: string }) {
    if (!dto.ly_do_bi_khoa?.trim()) {
      throw new BadRequestException('Ly do bi khoa la bat buoc');
    }

    const entity = await this.cgRepository.findOne({
      where: { id },
      relations: ['tai_khoan'],
    });
    if (!entity) throw new NotFoundException('Nutritionist khong ton tai');
    if (entity.trang_thai !== 'hoat_dong' && entity.trang_thai !== 'tu_choi') {
      throw new BadRequestException(
        'Chi co the bi khoa nutritionist dang hoat dong',
      );
    }
    if (entity.trang_thai === 'tu_choi') {
      throw new BadRequestException(
        'Khong the bi khoa tai khoan da bi tu choi',
      );
    }

    const now = new Date();
    entity.trang_thai = 'bi_khoa';
    entity.ly_do_bi_khoa = dto.ly_do_bi_khoa.trim();
    entity.ngay_bi_khoa = now;
    entity.cap_nhat_luc = now;
    await this.cgRepository.save(entity);

    await this.userRepository.update(entity.tai_khoan_id, {
      trang_thai: 'bi_khoa',
      cap_nhat_luc: now,
    });

    await this.createNotification(
      entity.tai_khoan_id,
      'bi_khoa_nutritionist',
      'Tài khoản bị vô hiệu hóa',
      `Tài khoản Chuyên gia Dinh dưỡng của bạn đã bị vô hiệu hóa. Lý do: ${dto.ly_do_bi_khoa}. Bạn không thể nhận booking mới.`,
      null,
    );

    return {
      success: true,
      message: 'Bi khoa nutritionist thanh cong',
      data: this.toPublic(entity),
    };
  }

  async activateNutritionist(id: number) {
    const entity = await this.cgRepository.findOne({
      where: { id },
      relations: ['tai_khoan'],
    });
    if (!entity) throw new NotFoundException('Nutritionist khong ton tai');
    if (entity.trang_thai === 'tu_choi') {
      throw new BadRequestException(
        'Khong the kich hoat tai khoan da bi tu choi',
      );
    }
    if (entity.trang_thai === 'hoat_dong') {
      throw new BadRequestException('Tai khoan dang hoat dong');
    }

    const now = new Date();
    entity.trang_thai = 'hoat_dong';
    entity.ngay_kich_hoat_lai = now;
    entity.ly_do_bi_khoa = null;
    entity.cap_nhat_luc = now;
    await this.cgRepository.save(entity);

    await this.userRepository.update(entity.tai_khoan_id, {
      trang_thai: 'hoat_dong',
      cap_nhat_luc: now,
    });

    await this.createNotification(
      entity.tai_khoan_id,
      'kich_hoat_nutritionist',
      'Tài khoản được kích hoạt lại',
      'Tài khoản Chuyên gia Dinh dưỡng của bạn đã được kích hoạt trở lại. Bạn có thể nhận booking mới.',
      null,
    );

    return {
      success: true,
      message: 'Kich hoat nutritionist thanh cong',
      data: this.toPublic(entity),
    };
  }

  // =========================================================
  // PRIVATE HELPERS
  // =========================================================
  private async getNutritionistStats(cgId: number) {
    const stats = await this.cgRepository.manager.query(
      `
      SELECT
        COUNT(DISTINCT lh.id) as so_booking,
        COUNT(DISTINCT CASE WHEN lh.trang_thai = 'hoan_thanh' THEN lh.id END) as so_booking_hoan_thanh,
        AVG(d.diem) as diem_trung_binh
      FROM chuyen_gia_dinh_duong cg
      LEFT JOIN lich_hen lh ON lh.chuyen_gia_dinh_duong_id = cg.id
      LEFT JOIN danh_gia d ON d.chuyen_gia_dinh_duong_id = cg.id AND d.lich_hen_id = lh.id
      WHERE cg.id = ?
    `,
      [cgId],
    );

    return {
      so_booking: Number(stats[0]?.so_booking ?? 0),
      so_booking_hoan_thanh: Number(stats[0]?.so_booking_hoan_thanh ?? 0),
      diem_trung_binh: Number(stats[0]?.diem_trung_binh ?? 0),
    };
  }

  private async grantPremiumSubscription(userId: number) {
    try {
      const premiumPackage = await this.packageRepo.findOne({
        where: { la_goi_mien_phi: false, xoa_luc: IsNull() },
        order: { thu_tu_hien_thi: 'ASC' } as any,
      });
      if (!premiumPackage) return;

      const existingActive = await this.subscriptionRepo.findOne({
        where: { tai_khoan_id: userId, trang_thai: 'dang_hoat_dong' as any },
      });
      if (existingActive) return;

      const now = new Date();
      const maDangKy = `SUB-Nutri-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;
      let ngayHetHan: Date | null = null;
      if (premiumPackage.thoi_han_ngay) {
        ngayHetHan = new Date(
          now.getTime() + premiumPackage.thoi_han_ngay * 24 * 60 * 60 * 1000,
        );
      }

      await this.subscriptionRepo.save(
        this.subscriptionRepo.create({
          tai_khoan_id: userId,
          goi_dich_vu_id: premiumPackage.id,
          ma_dang_ky: maDangKy,
          trang_thai: 'dang_hoat_dong' as any,
          ngay_bat_dau: now,
          ngay_het_han: ngayHetHan,
          tu_dong_gia_han: false,
          nguon_dang_ky: 'quan_tri_cap' as any,
          ghi_chu: 'Goi Premium tu dong khi duyet lam Chuyen gia Dinh duong.',
          tao_luc: now,
          cap_nhat_luc: now,
        }),
      );
    } catch {
      // Không ảnh hưởng luồng duyệt nếu cấp gói thất bại
    }
  }

  private async createNotification(
    taiKhoanId: number,
    loai: string,
    tieuDe: string,
    noiDung: string,
    duongDan: string | null,
  ) {
    const now = new Date();
    await this.notificationRepository.save(
      this.notificationRepository.create({
        tai_khoan_id: taiKhoanId,
        loai,
        tieu_de: tieuDe,
        noi_dung: noiDung,
        trang_thai: 'chua_doc',
        duong_dan_hanh_dong: duongDan,
        tao_luc: now,
        cap_nhat_luc: now,
      }),
    );
  }

  private toPublic(e: ChuyenGiaDinhDuongEntity) {
    return {
      id: e.id,
      tai_khoan_id: e.tai_khoan_id,
      tai_khoan: e.tai_khoan
        ? {
            id: e.tai_khoan.id,
            ho_ten: e.tai_khoan.ho_ten,
            email: e.tai_khoan.email,
            trang_thai: e.tai_khoan.trang_thai,
            vai_tro: e.tai_khoan.vai_tro,
          }
        : null,
      chuyen_mon: e.chuyen_mon,
      mo_ta: e.mo_ta,
      kinh_nghiem: e.kinh_nghiem,
      hoc_vi: e.hoc_vi,
      chung_chi: e.chung_chi,
      gio_lam_viec: e.gio_lam_viec,
      anh_dai_dien_url: e.anh_dai_dien_url,
      trang_thai: e.trang_thai,
      trang_thai_thanh_toan: e.trang_thai_thanh_toan,
      ly_do_tu_choi: e.ly_do_tu_choi,
      ly_do_bi_khoa: e.ly_do_bi_khoa,
      ngay_duyet: e.ngay_duyet?.toISOString() ?? null,
      ngay_thanh_toan: e.ngay_thanh_toan?.toISOString() ?? null,
      vnp_txn_ref: e.vnp_txn_ref,
      ngay_bi_khoa: e.ngay_bi_khoa?.toISOString() ?? null,
      ngay_kich_hoat_lai: e.ngay_kich_hoat_lai?.toISOString() ?? null,
      diem_danh_gia_trung_binh: Number(e.diem_danh_gia_trung_binh),
      so_luot_danh_gia: e.so_luot_danh_gia,
      tao_luc: e.tao_luc.toISOString(),
      cap_nhat_luc: e.cap_nhat_luc.toISOString(),
    };
  }
}
