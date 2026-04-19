import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PaymentQueryDto } from './dto/payment.dto';
import {
  PaymentStatus,
  ThanhToanGoiDichVuEntity,
} from './entities/thanh-toan-goi-dich-vu.entity';
import { DangKyGoiDichVuEntity } from '../Subscription/entities/dang-ky-goi-dich-vu.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(ThanhToanGoiDichVuEntity)
    private readonly paymentRepository: Repository<ThanhToanGoiDichVuEntity>,
    @InjectRepository(DangKyGoiDichVuEntity)
    private readonly subscriptionRepository: Repository<DangKyGoiDichVuEntity>,
  ) {}

  async findAll(query: PaymentQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<ThanhToanGoiDichVuEntity> = {};
    if (query.trangThai) where.trang_thai = query.trangThai as PaymentStatus;
    if (query.goiDichVuId) where.goi_dich_vu_id = query.goiDichVuId;

    const [items, total] = await this.paymentRepository.findAndCount({
      where,
      relations: ['tai_khoan', 'goi_dich_vu', 'dang_ky_goi_dich_vu'],
      order: { tao_luc: 'DESC' },
      skip,
      take: limit,
    });

    return {
      success: true,
      message: 'Lay danh sach thanh toan thanh cong',
      data: {
        items: items.map((i) => this.toPublic(i)),
        pagination: { page, limit, total },
      },
    };
  }

  async findOne(id: number) {
    const entity = await this.findById(id);
    return {
      success: true,
      message: 'Lay chi tiet thanh toan',
      data: this.toPublic(entity),
    };
  }

  async confirm(id: number, adminId: number) {
    const entity = await this.findById(id);

    if (entity.trang_thai === 'da_hoan_tien') {
      throw new BadRequestException(
        'Khong the xac nhan giao dich da hoan tien',
      );
    }
    if (entity.trang_thai === 'thanh_cong') {
      throw new BadRequestException('Giao dich da duoc xac nhan truoc do');
    }

    const now = new Date();

    // Cập nhật thanh toán
    entity.trang_thai = 'thanh_cong';
    entity.thanh_toan_luc = now;
    entity.xac_nhan_boi = adminId;
    entity.xac_nhan_luc = now;
    entity.cap_nhat_luc = now;
    await this.paymentRepository.save(entity);

    // Trigger kích hoạt gói
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: entity.dang_ky_goi_dich_vu_id },
    });

    if (subscription && subscription.trang_thai !== 'dang_hoat_dong') {
      subscription.trang_thai = 'dang_hoat_dong';
      subscription.ngay_bat_dau = now;
      if (!subscription.ngay_het_han) {
        // Tính ngày hết hạn từ gói
        const pkg = entity.goi_dich_vu;
        if (pkg?.thoi_han_ngay) {
          subscription.ngay_het_han = new Date(
            now.getTime() + pkg.thoi_han_ngay * 24 * 60 * 60 * 1000,
          );
        }
      }
      subscription.cap_nhat_luc = now;
      await this.subscriptionRepository.save(subscription);
    }

    const result = await this.findById(id);
    return {
      success: true,
      message: 'Xac nhan thanh toan thanh cong. Goi da duoc kich hoat.',
      data: this.toPublic(result),
    };
  }

  private async findById(id: number) {
    const entity = await this.paymentRepository.findOne({
      where: { id },
      relations: ['tai_khoan', 'goi_dich_vu', 'dang_ky_goi_dich_vu'],
    });
    if (!entity) throw new NotFoundException('Giao dich khong ton tai');
    return entity;
  }

  private toPublic(e: ThanhToanGoiDichVuEntity) {
    return {
      id: e.id,
      tai_khoan_id: e.tai_khoan_id,
      tai_khoan: e.tai_khoan
        ? {
            id: e.tai_khoan.id,
            ho_ten: e.tai_khoan.ho_ten,
            email: e.tai_khoan.email,
          }
        : null,
      dang_ky_goi_dich_vu_id: e.dang_ky_goi_dich_vu_id,
      goi_dich_vu_id: e.goi_dich_vu_id,
      goi_dich_vu: e.goi_dich_vu
        ? { id: e.goi_dich_vu.id, ten_goi: e.goi_dich_vu.ten_goi }
        : null,
      ma_giao_dich: e.ma_giao_dich,
      phuong_thuc_thanh_toan: e.phuong_thuc_thanh_toan,
      so_tien: Number(e.so_tien),
      trang_thai: e.trang_thai,
      thanh_toan_luc: e.thanh_toan_luc?.toISOString() ?? null,
      noi_dung_thanh_toan: e.noi_dung_thanh_toan,
      xac_nhan_boi: e.xac_nhan_boi,
      xac_nhan_luc: e.xac_nhan_luc?.toISOString() ?? null,
      tao_luc: e.tao_luc.toISOString(),
      cap_nhat_luc: e.cap_nhat_luc.toISOString(),
    };
  }
}
