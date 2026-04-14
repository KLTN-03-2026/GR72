import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { CongThucEntity, RecipeStatus, ThanhPhanCongThucEntity } from './entities/cong-thuc.entity';
import { IsArray, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class IngredientDto {
  @IsNumber() thucPhamId!: number;
  @IsNumber() soLuong!: number;
  @IsString() donVi!: string;
}

class CreateRecipeDto {
  @IsString() @IsNotEmpty() ten!: string;
  @IsOptional() @IsString() moTa?: string;
  @IsOptional() @IsString() huongDan?: string;
  @IsOptional() @IsNumber() soKhauPhan?: number;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => IngredientDto) thanhPhan?: IngredientDto[];
}

class UpdateRecipeDto {
  @IsOptional() @IsString() @IsNotEmpty() ten?: string;
  @IsOptional() @IsString() moTa?: string;
  @IsOptional() @IsString() huongDan?: string;
  @IsOptional() @IsNumber() soKhauPhan?: number;
  @IsOptional() @IsString() trangThai?: string;
  /** Có trong body (kể cả `[]`): thay thế toàn bộ thành phần */
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => IngredientDto) thanhPhan?: IngredientDto[];
}

function slugify(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

@Roles('chuyen_gia_dinh_duong')
@Controller('nutritionist/recipes')
export class NutritionistRecipeController {
  constructor(
    @InjectRepository(CongThucEntity) private readonly repo: Repository<CongThucEntity>,
    @InjectRepository(ThanhPhanCongThucEntity) private readonly ingredientRepo: Repository<ThanhPhanCongThucEntity>,
  ) {}

  @Get()
  async findAll(@Req() req: any, @Query('trangThai') trangThai?: string, @Query('page') page = '1', @Query('limit') limit = '10') {
    const userId = req.user?.sub;
    const p = Math.max(1, Number(page)); const l = Math.max(1, Math.min(50, Number(limit)));
    const where: FindOptionsWhere<CongThucEntity> = { tao_boi: userId, xoa_luc: IsNull() };
    if (trangThai) where.trang_thai = trangThai as RecipeStatus;

    const [items, total] = await this.repo.findAndCount({ where, relations: ['thanh_phan'], order: { tao_luc: 'DESC' }, skip: (p - 1) * l, take: l });
    return { success: true, data: { items: items.map((i) => this.toPublic(i)), pagination: { page: p, limit: l, total } } };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const entity = await this.repo.findOne({ where: { id, tao_boi: req.user?.sub, xoa_luc: IsNull() }, relations: ['thanh_phan'] });
    if (!entity) throw new NotFoundException('Cong thuc khong ton tai');
    return { success: true, data: this.toPublic(entity) };
  }

  @Post()
  async create(@Body() dto: CreateRecipeDto, @Req() req: any) {
    const now = new Date();
    const slug = slugify(dto.ten) + '-' + Date.now().toString(36);
    const entity = this.repo.create({
      tao_boi: req.user?.sub, ten: dto.ten.trim(), slug,
      mo_ta: dto.moTa?.trim() || null, huong_dan: dto.huongDan || null,
      so_khau_phan: dto.soKhauPhan ?? null,
      trang_thai: 'ban_nhap', tao_luc: now, cap_nhat_luc: now,
    });
    const saved = await this.repo.save(entity);

    if (dto.thanhPhan?.length) {
      for (const tp of dto.thanhPhan) {
        await this.ingredientRepo.save(this.ingredientRepo.create({
          cong_thuc_id: saved.id, thuc_pham_id: tp.thucPhamId,
          so_luong: tp.soLuong, don_vi: tp.donVi, tao_luc: now, cap_nhat_luc: now,
        }));
      }
    }

    const result = await this.repo.findOne({ where: { id: saved.id }, relations: ['thanh_phan'] });
    return { success: true, message: 'Tao cong thuc thanh cong', data: this.toPublic(result!) };
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRecipeDto, @Req() req: any) {
    const entity = await this.repo.findOne({ where: { id, tao_boi: req.user?.sub, xoa_luc: IsNull() } });
    if (!entity) throw new NotFoundException('Cong thuc khong ton tai');

    if (dto.ten !== undefined) entity.ten = dto.ten.trim();
    if (dto.moTa !== undefined) entity.mo_ta = dto.moTa?.trim() || null;
    if (dto.huongDan !== undefined) entity.huong_dan = dto.huongDan || null;
    if (dto.soKhauPhan !== undefined) entity.so_khau_phan = dto.soKhauPhan ?? null;
    if (dto.trangThai !== undefined) entity.trang_thai = dto.trangThai as RecipeStatus;
    entity.cap_nhat_luc = new Date();
    await this.repo.save(entity);

    if (dto.thanhPhan !== undefined) {
      const now = new Date();
      await this.repo.manager.transaction(async (manager) => {
        await manager.delete(ThanhPhanCongThucEntity, { cong_thuc_id: id });
        for (const tp of dto.thanhPhan!) {
          await manager.save(
            manager.create(ThanhPhanCongThucEntity, {
              cong_thuc_id: id,
              thuc_pham_id: tp.thucPhamId,
              so_luong: tp.soLuong,
              don_vi: tp.donVi,
              tao_luc: now,
              cap_nhat_luc: now,
            }),
          );
        }
      });
    }

    const result = await this.repo.findOne({ where: { id }, relations: ['thanh_phan'] });
    return { success: true, message: 'Cap nhat cong thuc thanh cong', data: this.toPublic(result!) };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const entity = await this.repo.findOne({ where: { id, tao_boi: req.user?.sub, xoa_luc: IsNull() } });
    if (!entity) throw new NotFoundException('Cong thuc khong ton tai');
    entity.xoa_luc = new Date(); entity.cap_nhat_luc = new Date();
    await this.repo.save(entity);
    return { success: true, message: 'Xoa cong thuc thanh cong' };
  }

  private toPublic(e: CongThucEntity) {
    return {
      id: e.id, tao_boi: e.tao_boi, ten: e.ten, slug: e.slug,
      mo_ta: e.mo_ta, huong_dan: e.huong_dan, so_khau_phan: e.so_khau_phan,
      tong_calories: e.tong_calories ? Number(e.tong_calories) : null,
      tong_protein_g: e.tong_protein_g ? Number(e.tong_protein_g) : null,
      tong_carb_g: e.tong_carb_g ? Number(e.tong_carb_g) : null,
      tong_fat_g: e.tong_fat_g ? Number(e.tong_fat_g) : null,
      trang_thai: e.trang_thai,
      thanh_phan: e.thanh_phan?.map((tp) => ({
        id: tp.id, thuc_pham_id: tp.thuc_pham_id,
        so_luong: Number(tp.so_luong), don_vi: tp.don_vi,
      })) ?? [],
      tao_luc: e.tao_luc.toISOString(), cap_nhat_luc: e.cap_nhat_luc.toISOString(),
    };
  }
}
