import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import {
  CreateNotificationDto,
  NotificationQueryDto,
  UpdateNotificationDto,
} from './dto/notification.dto';
import {
  NotificationStatus,
  ThongBaoEntity,
} from '../FoodReview/entities/thong-bao.entity';
import { TaiKhoanEntity } from '../User/entities/tai-khoan.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(ThongBaoEntity)
    private readonly notificationRepository: Repository<ThongBaoEntity>,
    @InjectRepository(TaiKhoanEntity)
    private readonly userRepository: Repository<TaiKhoanEntity>,
  ) {}

  async findAll(query: NotificationQueryDto, userId?: number) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<ThongBaoEntity> = {};
    if (query.trangThai)
      where.trang_thai = query.trangThai as NotificationStatus;
    if (userId !== undefined) where.tai_khoan_id = userId;
    if (query.huong === 'gui' && userId !== undefined) {
      where.nguoi_gui_id = userId;
      delete where.tai_khoan_id;
    } else if (query.huong === 'nhan' && userId !== undefined) {
      where.tai_khoan_id = userId;
      where.nguoi_gui_id = undefined;
    }

    const [items, total] = await this.notificationRepository.findAndCount({
      where,
      relations: ['tai_khoan', 'nguoi_gui'],
      order: { tao_luc: 'DESC' },
      skip,
      take: limit,
    });

    return {
      success: true,
      message: 'Lay danh sach thong bao thanh cong',
      data: {
        items: items.map((i) => this.toPublic(i)),
        pagination: { page, limit, total },
      },
    };
  }

  async getUnreadCount(userId?: number) {
    const where: FindOptionsWhere<ThongBaoEntity> = {
      trang_thai: 'chua_doc' as NotificationStatus,
    };
    if (userId !== undefined) where.tai_khoan_id = userId;
    const count = await this.notificationRepository.count({ where });
    return { success: true, data: { count } };
  }

  async findOne(id: number, userId?: number) {
    const entity = await this.findById(id, userId);
    return {
      success: true,
      message: 'Lay chi tiet thong bao',
      data: this.toPublic(entity),
    };
  }

  async create(dto: CreateNotificationDto, nguoiGuiId?: number) {
    const user = await this.userRepository.findOne({
      where: { id: dto.taiKhoanId, xoa_luc: IsNull() },
    });
    if (!user) throw new NotFoundException('Tai khoan khong ton tai');

    const now = new Date();
    const entity = this.notificationRepository.create({
      tai_khoan_id: dto.taiKhoanId,
      nguoi_gui_id: nguoiGuiId ?? null,
      loai: dto.loai,
      tieu_de: dto.tieuDe.trim(),
      noi_dung: dto.noiDung.trim(),
      duong_dan_hanh_dong: dto.duongDanHanhDong?.trim() || null,
      trang_thai: 'chua_doc',
      tao_luc: now,
      cap_nhat_luc: now,
    });

    const saved = await this.notificationRepository.save(entity);
    const result = await this.findById(saved.id);
    return {
      success: true,
      message: 'Tao thong bao thanh cong',
      data: this.toPublic(result),
    };
  }

  async update(id: number, dto: UpdateNotificationDto) {
    const entity = await this.findById(id);

    if (dto.tieuDe !== undefined) entity.tieu_de = dto.tieuDe.trim();
    if (dto.noiDung !== undefined) entity.noi_dung = dto.noiDung.trim();
    if (dto.duongDanHanhDong !== undefined)
      entity.duong_dan_hanh_dong = dto.duongDanHanhDong?.trim() || null;
    entity.cap_nhat_luc = new Date();

    await this.notificationRepository.save(entity);
    const result = await this.findById(id);
    return {
      success: true,
      message: 'Cap nhat thong bao thanh cong',
      data: this.toPublic(result),
    };
  }

  async markRead(userId: number, id: number) {
    const entity = await this.findById(id, userId);
    const now = new Date();
    entity.trang_thai = 'da_doc';
    entity.doc_luc = now;
    entity.cap_nhat_luc = now;
    await this.notificationRepository.save(entity);
    return {
      success: true,
      message: 'Da danh dau da doc',
      data: this.toPublic(entity),
    };
  }

  async remove(id: number) {
    const entity = await this.findById(id);
    await this.notificationRepository.remove(entity);
    return { success: true, message: 'Xoa thong bao thanh cong', data: null };
  }

  private async findById(id: number, userId?: number) {
    const where: FindOptionsWhere<ThongBaoEntity> = { id };
    if (userId !== undefined) where.tai_khoan_id = userId;
    const entity = await this.notificationRepository.findOne({
      where,
      relations: ['tai_khoan', 'nguoi_gui'],
    });
    if (!entity) throw new NotFoundException('Thong bao khong ton tai');
    return entity;
  }

  private toPublic(e: ThongBaoEntity) {
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
      nguoi_gui_id: e.nguoi_gui_id,
      nguoi_gui: e.nguoi_gui
        ? {
            id: e.nguoi_gui.id,
            ho_ten: e.nguoi_gui.ho_ten,
            email: e.nguoi_gui.email,
          }
        : null,
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
