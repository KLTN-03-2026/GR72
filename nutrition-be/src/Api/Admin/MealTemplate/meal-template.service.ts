import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, IsNull, Repository } from 'typeorm';
import { ThucDonMauEntity, ChiTietThucDonMauEntity, MealTemplateStatus } from '../../Nutritionist/MealTemplate/entities/thuc-don-mau.entity';
import { MealTemplateQueryDto } from './dto/meal-template-query.dto';

@Injectable()
export class AdminMealTemplateService {
  constructor(
    @InjectRepository(ThucDonMauEntity)
    private readonly repo: Repository<ThucDonMauEntity>,
    @InjectRepository(ChiTietThucDonMauEntity)
    private readonly detailRepo: Repository<ChiTietThucDonMauEntity>,
  ) {}

  async findAll(query: MealTemplateQueryDto) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(query.limit ?? '10', 10)));
    const where: FindOptionsWhere<ThucDonMauEntity> = { xoa_luc: IsNull() };

    if (query.tieuDe) where.tieu_de = ILike(`%${query.tieuDe}%`);
    if (query.trangThai) where.trang_thai = query.trangThai as MealTemplateStatus;
    if (query.loaiMucTieu) where.loai_muc_tieu_phu_hop = query.loaiMucTieu as any;
    if (query.tacGiaId) where.tao_boi = parseInt(query.tacGiaId, 10);

    const [items, total] = await this.repo.findAndCount({
      where,
      relations: ['nguoi_tao'],
      order: { tao_luc: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((e) => this.toPublic(e)),
      pagination: { page, limit, total },
    };
  }

  async findOne(id: number) {
    const entity = await this.repo.findOne({
      where: { id, xoa_luc: IsNull() },
      relations: ['nguoi_tao', 'chi_tiet'],
    });
    if (!entity) throw new NotFoundException('Thuc don mau khong ton tai');
    return this.toPublic(entity);
  }

  async getStats() {
    const [tong, banNhap, xuatBan, luuTru] = await Promise.all([
      this.repo.count({ where: { xoa_luc: IsNull() } }),
      this.repo.count({ where: { trang_thai: 'ban_nhap', xoa_luc: IsNull() } }),
      this.repo.count({ where: { trang_thai: 'xuat_ban', xoa_luc: IsNull() } }),
      this.repo.count({ where: { trang_thai: 'luu_tru', xoa_luc: IsNull() } }),
    ]);
    return { tong, ban_nhap: banNhap, xuat_ban: xuatBan, luu_tru: luuTru };
  }

  async getPublicList(query: MealTemplateQueryDto) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(query.limit ?? '10', 10)));
    const where: FindOptionsWhere<ThucDonMauEntity> = {
      trang_thai: 'xuat_ban',
      xoa_luc: IsNull(),
    };
    if (query.loaiMucTieu) where.loai_muc_tieu_phu_hop = query.loaiMucTieu as any;

    const [items, total] = await this.repo.findAndCount({
      where,
      relations: ['nguoi_tao'],
      order: { tao_luc: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((e) => this.toPublic(e)),
      pagination: { page, limit, total },
    };
  }

  async getAuthorList() {
    const result = await this.repo
      .createQueryBuilder('m')
      .innerJoin('m.nguoi_tao', 't')
      .select('m.tao_boi', 'id')
      .addSelect('t.ho_ten', 'ho_ten')
      .addSelect('t.email', 'email')
      .addSelect('COUNT(m.id)', 'so_thuc_don')
      .where('m.xoa_luc IS NULL')
      .groupBy('m.tao_boi')
      .addGroupBy('t.ho_ten')
      .addGroupBy('t.email')
      .orderBy('so_thuc_don', 'DESC')
      .getRawMany();

    return result.map((r) => ({
      id: r.id,
      ho_ten: r.ho_ten,
      email: r.email,
      so_thuc_don: Number(r.so_thuc_don),
    }));
  }

  async getDetailById(id: number) {
    const details = await this.detailRepo.find({
      where: { thuc_don_mau_id: id },
      order: { ngay_so: 'ASC', thu_tu: 'ASC' },
    });
    return details.map((ct) => ({
      id: ct.id,
      ngay_so: ct.ngay_so,
      loai_bua_an: ct.loai_bua_an,
      cong_thuc_id: ct.cong_thuc_id,
      thuc_pham_id: ct.thuc_pham_id,
      so_luong: ct.so_luong ? Number(ct.so_luong) : null,
      don_vi: ct.don_vi,
      ghi_chu: ct.ghi_chu,
      thu_tu: ct.thu_tu,
    }));
  }

  async remove(id: number) {
    const entity = await this.repo.findOne({ where: { id, xoa_luc: IsNull() } });
    if (!entity) throw new NotFoundException('Thuc don mau khong ton tai');
    entity.xoa_luc = new Date();
    entity.cap_nhat_luc = new Date();
    await this.repo.save(entity);
    return { message: 'Xoa thuc don mau thanh cong' };
  }

  private toPublic(e: ThucDonMauEntity) {
    return {
      id: e.id,
      tao_boi: e.tao_boi,
      nguoi_tao: e.nguoi_tao
        ? { id: e.nguoi_tao.id, ho_ten: e.nguoi_tao.ho_ten, email: e.nguoi_tao.email }
        : null,
      tieu_de: e.tieu_de,
      mo_ta: e.mo_ta,
      loai_muc_tieu_phu_hop: e.loai_muc_tieu_phu_hop,
      calories_muc_tieu: e.calories_muc_tieu ? Number(e.calories_muc_tieu) : null,
      trang_thai: e.trang_thai,
      chi_tiet: e.chi_tiet?.map((ct: ChiTietThucDonMauEntity) => ({
        id: ct.id,
        ngay_so: ct.ngay_so,
        loai_bua_an: ct.loai_bua_an,
        cong_thuc_id: ct.cong_thuc_id,
        thuc_pham_id: ct.thuc_pham_id,
        so_luong: ct.so_luong ? Number(ct.so_luong) : null,
        don_vi: ct.don_vi,
        ghi_chu: ct.ghi_chu,
        thu_tu: ct.thu_tu,
      })) ?? [],
      tao_luc: e.tao_luc.toISOString(),
      cap_nhat_luc: e.cap_nhat_luc.toISOString(),
    };
  }
}
