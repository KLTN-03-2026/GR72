import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { ChiTietThucDonMauEntity, MealTemplateStatus, ThucDonMauEntity } from './entities/thuc-don-mau.entity';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MealDetailDto {
  @IsNumber() ngaySo!: number;
  @IsString() loaiBuaAn!: string;
  @IsOptional() @IsNumber() congThucId?: number;
  @IsOptional() @IsNumber() thucPhamId?: number;
  @IsOptional() @IsNumber() soLuong?: number;
  @IsOptional() @IsString() donVi?: string;
  @IsOptional() @IsString() ghiChu?: string;
  @IsOptional() @IsNumber() thuTu?: number;
}

class CreateMealTemplateDto {
  @IsString() @IsNotEmpty() tieuDe!: string;
  @IsOptional() @IsString() moTa?: string;
  @IsOptional() @IsString() loaiMucTieuPhuHop?: string;
  @IsOptional() @IsNumber() caloriesMucTieu?: number;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => MealDetailDto) chiTiet?: MealDetailDto[];
}

class UpdateMealTemplateDto {
  @IsOptional() @IsString() @IsNotEmpty() tieuDe?: string;
  @IsOptional() @IsString() moTa?: string;
  @IsOptional() @IsString() trangThai?: string;
  @IsOptional() @IsString() loaiMucTieuPhuHop?: string;
  @IsOptional() @IsNumber() caloriesMucTieu?: number;
  /** Có trong body (kể cả `[]`): thay thế toàn bộ chi tiết */
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => MealDetailDto) chiTiet?: MealDetailDto[];
}

@Roles('chuyen_gia_dinh_duong')
@Controller('nutritionist/meal-templates')
export class NutritionistMealTemplateController {
  constructor(
    @InjectRepository(ThucDonMauEntity) private readonly repo: Repository<ThucDonMauEntity>,
    @InjectRepository(ChiTietThucDonMauEntity) private readonly detailRepo: Repository<ChiTietThucDonMauEntity>,
  ) {}

  @Get()
  async findAll(@Req() req: any, @Query('trangThai') trangThai?: string, @Query('page') page = '1', @Query('limit') limit = '10') {
    const userId = req.user?.sub;
    const p = Math.max(1, Number(page)); const l = Math.max(1, Math.min(50, Number(limit)));
    const where: FindOptionsWhere<ThucDonMauEntity> = { tao_boi: userId, xoa_luc: IsNull() };
    if (trangThai) where.trang_thai = trangThai as MealTemplateStatus;

    const [items, total] = await this.repo.findAndCount({ where, relations: ['chi_tiet'], order: { tao_luc: 'DESC' }, skip: (p - 1) * l, take: l });
    return { success: true, data: { items: items.map((i) => this.toPublic(i)), pagination: { page: p, limit: l, total } } };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const entity = await this.repo.findOne({ where: { id, tao_boi: req.user?.sub, xoa_luc: IsNull() }, relations: ['chi_tiet'] });
    if (!entity) throw new NotFoundException('Thuc don mau khong ton tai');
    return { success: true, data: this.toPublic(entity) };
  }

  @Post()
  async create(@Body() dto: CreateMealTemplateDto, @Req() req: any) {
    const now = new Date();
    const entity = this.repo.create({
      tao_boi: req.user?.sub, tieu_de: dto.tieuDe.trim(),
      mo_ta: dto.moTa?.trim() || null,
      loai_muc_tieu_phu_hop: (dto.loaiMucTieuPhuHop as any) ?? null,
      calories_muc_tieu: dto.caloriesMucTieu ?? null,
      trang_thai: 'ban_nhap', tao_luc: now, cap_nhat_luc: now,
    });
    const saved = await this.repo.save(entity);

    if (dto.chiTiet?.length) {
      for (const ct of dto.chiTiet) {
        await this.detailRepo.save(this.detailRepo.create({
          thuc_don_mau_id: saved.id, ngay_so: ct.ngaySo,
          loai_bua_an: ct.loaiBuaAn as any,
          cong_thuc_id: ct.congThucId ?? null,
          thuc_pham_id: ct.thucPhamId ?? null,
          so_luong: ct.soLuong ?? null, don_vi: ct.donVi ?? null,
          ghi_chu: ct.ghiChu?.trim() ?? null, thu_tu: ct.thuTu ?? 1,
          tao_luc: now, cap_nhat_luc: now,
        }));
      }
    }

    const result = await this.repo.findOne({ where: { id: saved.id }, relations: ['chi_tiet'] });
    return { success: true, message: 'Tao thuc don mau thanh cong', data: this.toPublic(result!) };
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMealTemplateDto, @Req() req: any) {
    const entity = await this.repo.findOne({ where: { id, tao_boi: req.user?.sub, xoa_luc: IsNull() } });
    if (!entity) throw new NotFoundException('Thuc don mau khong ton tai');

    if (dto.tieuDe !== undefined) entity.tieu_de = dto.tieuDe.trim();
    if (dto.moTa !== undefined) entity.mo_ta = dto.moTa?.trim() || null;
    if (dto.trangThai !== undefined) entity.trang_thai = dto.trangThai as MealTemplateStatus;
    if (dto.loaiMucTieuPhuHop !== undefined) entity.loai_muc_tieu_phu_hop = (dto.loaiMucTieuPhuHop as any) ?? null;
    if (dto.caloriesMucTieu !== undefined) entity.calories_muc_tieu = dto.caloriesMucTieu ?? null;
    entity.cap_nhat_luc = new Date();
    await this.repo.save(entity);

    if (dto.chiTiet !== undefined) {
      const now = new Date();
      await this.repo.manager.transaction(async (manager) => {
        await manager.delete(ChiTietThucDonMauEntity, { thuc_don_mau_id: id });
        for (const ct of dto.chiTiet!) {
          await manager.save(
            manager.create(ChiTietThucDonMauEntity, {
              thuc_don_mau_id: id,
              ngay_so: ct.ngaySo,
              loai_bua_an: ct.loaiBuaAn as any,
              cong_thuc_id: ct.congThucId ?? null,
              thuc_pham_id: ct.thucPhamId ?? null,
              so_luong: ct.soLuong ?? null,
              don_vi: ct.donVi ?? null,
              ghi_chu: ct.ghiChu?.trim() ?? null,
              thu_tu: ct.thuTu ?? 1,
              tao_luc: now,
              cap_nhat_luc: now,
            }),
          );
        }
      });
    }

    const result = await this.repo.findOne({ where: { id }, relations: ['chi_tiet'] });
    return { success: true, message: 'Cap nhat thuc don mau thanh cong', data: this.toPublic(result!) };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const entity = await this.repo.findOne({ where: { id, tao_boi: req.user?.sub, xoa_luc: IsNull() } });
    if (!entity) throw new NotFoundException('Thuc don mau khong ton tai');
    entity.xoa_luc = new Date(); entity.cap_nhat_luc = new Date();
    await this.repo.save(entity);
    return { success: true, message: 'Xoa thuc don mau thanh cong' };
  }

  private toPublic(e: ThucDonMauEntity) {
    return {
      id: e.id, tao_boi: e.tao_boi, tieu_de: e.tieu_de, mo_ta: e.mo_ta,
      loai_muc_tieu_phu_hop: e.loai_muc_tieu_phu_hop,
      calories_muc_tieu: e.calories_muc_tieu ? Number(e.calories_muc_tieu) : null,
      trang_thai: e.trang_thai,
      chi_tiet: e.chi_tiet?.map((ct) => ({
        id: ct.id, ngay_so: ct.ngay_so, loai_bua_an: ct.loai_bua_an,
        cong_thuc_id: ct.cong_thuc_id, thuc_pham_id: ct.thuc_pham_id,
        so_luong: ct.so_luong ? Number(ct.so_luong) : null,
        don_vi: ct.don_vi, ghi_chu: ct.ghi_chu, thu_tu: ct.thu_tu,
      })) ?? [],
      tao_luc: e.tao_luc.toISOString(), cap_nhat_luc: e.cap_nhat_luc.toISOString(),
    };
  }
}
