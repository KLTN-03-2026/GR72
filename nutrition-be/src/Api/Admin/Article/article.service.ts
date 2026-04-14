import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, IsNull, Repository } from 'typeorm';
import { BaiVietEntity, ArticleStatus } from '../../Nutritionist/Article/entities/bai-viet.entity';
import { ArticleQueryDto } from './dto/article-query.dto';

@Injectable()
export class AdminArticleService {
  constructor(
    @InjectRepository(BaiVietEntity)
    private readonly repo: Repository<BaiVietEntity>,
  ) {}

  async findAll(query: ArticleQueryDto) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(query.limit ?? '10', 10)));
    const where: FindOptionsWhere<BaiVietEntity> = { xoa_luc: IsNull() };

    if (query.tieuDe) where.tieu_de = ILike(`%${query.tieuDe}%`);
    if (query.trangThai) where.trang_thai = query.trangThai as ArticleStatus;
    if (query.danhMuc) where.danh_muc = ILike(`%${query.danhMuc}%`);
    if (query.tacGiaId) where.tac_gia_id = parseInt(query.tacGiaId, 10);

    const [items, total] = await this.repo.findAndCount({
      where,
      relations: ['tac_gia'],
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
    const entity = await this.repo.findOne({ where: { id, xoa_luc: IsNull() }, relations: ['tac_gia'] });
    if (!entity) throw new NotFoundException('Bai viet khong ton tai');
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

  async getPublicList(query: ArticleQueryDto) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(query.limit ?? '10', 10)));
    const where: FindOptionsWhere<BaiVietEntity> = {
      trang_thai: 'xuat_ban',
      xoa_luc: IsNull(),
    };
    if (query.danhMuc) where.danh_muc = ILike(`%${query.danhMuc}%`);

    const [items, total] = await this.repo.findAndCount({
      where,
      relations: ['tac_gia'],
      order: { xuat_ban_luc: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((e) => this.toPublic(e)),
      pagination: { page, limit, total },
    };
  }

  async getBySlug(slug: string) {
    const entity = await this.repo.findOne({
      where: { slug, trang_thai: 'xuat_ban', xoa_luc: IsNull() },
      relations: ['tac_gia'],
    });
    if (!entity) throw new NotFoundException('Bai viet khong ton tai hoac chua duoc xuat ban');
    return this.toPublic(entity);
  }

  async getCategories() {
    const result = await this.repo
      .createQueryBuilder('a')
      .select('a.danh_muc', 'danh_muc')
      .addSelect('COUNT(a.id)', 'so_luong')
      .where('a.xoa_luc IS NULL')
      .andWhere('a.danh_muc IS NOT NULL')
      .groupBy('a.danh_muc')
      .orderBy('so_luong', 'DESC')
      .getRawMany();

    return result.map((r) => ({ danh_muc: r.danh_muc, so_luong: Number(r.so_luong) }));
  }

  async getAuthorList() {
    const result = await this.repo
      .createQueryBuilder('a')
      .innerJoin('a.tac_gia', 't')
      .select('a.tac_gia_id', 'id')
      .addSelect('t.ho_ten', 'ho_ten')
      .addSelect('t.email', 'email')
      .addSelect('COUNT(a.id)', 'so_bai_viet')
      .where('a.xoa_luc IS NULL')
      .groupBy('a.tac_gia_id')
      .addGroupBy('t.ho_ten')
      .addGroupBy('t.email')
      .orderBy('so_bai_viet', 'DESC')
      .getRawMany();

    return result.map((r) => ({
      id: r.id,
      ho_ten: r.ho_ten,
      email: r.email,
      so_bai_viet: Number(r.so_bai_viet),
    }));
  }

  async remove(id: number) {
    const entity = await this.repo.findOne({ where: { id, xoa_luc: IsNull() } });
    if (!entity) throw new NotFoundException('Bai viet khong ton tai');
    entity.xoa_luc = new Date();
    entity.cap_nhat_luc = new Date();
    await this.repo.save(entity);
    return { message: 'Xoa bai viet thanh cong' };
  }

  private toPublic(e: BaiVietEntity) {
    return {
      id: e.id,
      tac_gia_id: e.tac_gia_id,
      tac_gia: e.tac_gia ? { id: e.tac_gia.id, ho_ten: e.tac_gia.ho_ten, email: e.tac_gia.email } : null,
      tieu_de: e.tieu_de,
      slug: e.slug,
      danh_muc: e.danh_muc,
      the_gan: e.the_gan,
      tom_tat: e.tom_tat,
      noi_dung: e.noi_dung,
      anh_dai_dien_url: e.anh_dai_dien_url,
      huong_dan_ai: e.huong_dan_ai,
      trang_thai: e.trang_thai,
      xuat_ban_luc: e.xuat_ban_luc?.toISOString() ?? null,
      tao_luc: e.tao_luc.toISOString(),
      cap_nhat_luc: e.cap_nhat_luc.toISOString(),
    };
  }
}
