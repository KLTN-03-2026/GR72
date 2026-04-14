import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ThongBaoEntity } from '../../Admin/FoodReview/entities/thong-bao.entity';

@Injectable()
export class NutritionistNotificationsService {
  constructor(
    @InjectRepository(ThongBaoEntity)
    private readonly notificationRepository: Repository<ThongBaoEntity>,
  ) {}

  async findAll(
    userId: number,
    query: { trangThai?: string; page?: string; limit?: string },
  ) {
    const p = Math.max(1, Number(query.page ?? '1'));
    const l = Math.max(1, Math.min(50, Number(query.limit ?? '10')));
    const skip = (p - 1) * l;

    const where: FindOptionsWhere<ThongBaoEntity> = { tai_khoan_id: userId };
    if (query.trangThai) {
      where.trang_thai = query.trangThai as 'chua_doc' | 'da_doc';
    }

    const [items, total] = await this.notificationRepository.findAndCount({
      where,
      order: { tao_luc: 'DESC' },
      skip,
      take: l,
    });

    return {
      success: true,
      data: {
        items: items.map((e) => this.toPublic(e)),
        pagination: { page: p, limit: l, total },
      },
    };
  }

  async markRead(userId: number, id: number) {
    const entity = await this.notificationRepository.findOne({
      where: { id, tai_khoan_id: userId },
    });
    if (!entity) {
      throw new NotFoundException('Thong bao khong ton tai');
    }
    const now = new Date();
    entity.trang_thai = 'da_doc';
    entity.doc_luc = now;
    entity.cap_nhat_luc = now;
    await this.notificationRepository.save(entity);
    return { success: true, message: 'Da danh dau da doc', data: this.toPublic(entity) };
  }

  async getUnreadCount(userId: number) {
    const count = await this.notificationRepository.count({
      where: { tai_khoan_id: userId, trang_thai: 'chua_doc' as const },
    });
    return { success: true, data: { count } };
  }

  private toPublic(e: ThongBaoEntity) {
    return {
      id: e.id,
      tai_khoan_id: e.tai_khoan_id,
      loai: e.loai,
      tieu_de: e.tieu_de,
      noi_dung: e.noi_dung,
      trang_thai: e.trang_thai,
      duong_dan_hanh_dong: e.duong_dan_hanh_dong,
      tao_luc: e.tao_luc.toISOString(),
      doc_luc: e.doc_luc?.toISOString() ?? null,
      cap_nhat_luc: e.cap_nhat_luc.toISOString(),
    };
  }
}
