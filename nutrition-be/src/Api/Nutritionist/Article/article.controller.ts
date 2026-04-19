import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { ArticleStatus, BaiVietEntity } from './entities/bai-viet.entity';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

class CreateArticleDto {
  @IsString() @IsNotEmpty() tieuDe!: string;
  @IsString() @IsNotEmpty() noiDung!: string;
  @IsOptional() @IsString() danhMuc?: string;
  @IsOptional() @IsArray() theGan?: string[];
  @IsOptional() @IsString() tomTat?: string;
  @IsOptional() @IsString() anhDaiDienUrl?: string;
  @IsOptional() @IsObject() huongDanAi?: Record<string, unknown>;
}

class UpdateArticleDto {
  @IsOptional() @IsString() @IsNotEmpty() tieuDe?: string;
  @IsOptional() @IsString() @IsNotEmpty() noiDung?: string;
  @IsOptional() @IsString() danhMuc?: string;
  @IsOptional() @IsArray() theGan?: string[];
  @IsOptional() @IsString() tomTat?: string;
  @IsOptional() @IsString() anhDaiDienUrl?: string;
  @IsOptional() @IsObject() huongDanAi?: Record<string, unknown>;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

@Roles('chuyen_gia_dinh_duong')
@Controller('nutritionist/articles')
export class NutritionistArticleController {
  constructor(
    @InjectRepository(BaiVietEntity)
    private readonly repo: Repository<BaiVietEntity>,
  ) {}

  @Get()
  async findAll(
    @Req() req: any,
    @Query('trangThai') trangThai?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const userId = req.user?.sub;
    const p = Math.max(1, Number(page));
    const l = Math.max(1, Math.min(50, Number(limit)));
    const where: FindOptionsWhere<BaiVietEntity> = {
      tac_gia_id: userId,
      xoa_luc: IsNull(),
    };
    if (trangThai) where.trang_thai = trangThai as ArticleStatus;

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { tao_luc: 'DESC' },
      skip: (p - 1) * l,
      take: l,
    });
    return {
      success: true,
      data: {
        items: items.map((i) => this.toPublic(i)),
        pagination: { page: p, limit: l, total },
      },
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const entity = await this.repo.findOne({
      where: { id, tac_gia_id: req.user?.sub, xoa_luc: IsNull() },
    });
    if (!entity) throw new NotFoundException('Bai viet khong ton tai');
    return { success: true, data: this.toPublic(entity) };
  }

  @Post()
  async create(@Body() dto: CreateArticleDto, @Req() req: any) {
    const now = new Date();
    const slug = slugify(dto.tieuDe) + '-' + Date.now().toString(36);
    const entity = this.repo.create({
      tac_gia_id: req.user?.sub,
      tieu_de: dto.tieuDe.trim(),
      slug,
      noi_dung: dto.noiDung,
      danh_muc: dto.danhMuc?.trim() || null,
      the_gan: dto.theGan ?? null,
      tom_tat: dto.tomTat?.trim() || null,
      anh_dai_dien_url: dto.anhDaiDienUrl?.trim() || null,
      huong_dan_ai: dto.huongDanAi ?? null,
      trang_thai: 'ban_nhap',
      tao_luc: now,
      cap_nhat_luc: now,
    });
    const saved = await this.repo.save(entity);
    return {
      success: true,
      message: 'Tao bai viet thanh cong',
      data: this.toPublic(saved),
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateArticleDto,
    @Req() req: any,
  ) {
    const entity = await this.repo.findOne({
      where: { id, tac_gia_id: req.user?.sub, xoa_luc: IsNull() },
    });
    if (!entity) throw new NotFoundException('Bai viet khong ton tai');

    if (dto.tieuDe !== undefined) entity.tieu_de = dto.tieuDe.trim();
    if (dto.noiDung !== undefined) entity.noi_dung = dto.noiDung;
    if (dto.danhMuc !== undefined)
      entity.danh_muc = dto.danhMuc?.trim() || null;
    if (dto.theGan !== undefined) entity.the_gan = dto.theGan;
    if (dto.tomTat !== undefined) entity.tom_tat = dto.tomTat?.trim() || null;
    if (dto.anhDaiDienUrl !== undefined)
      entity.anh_dai_dien_url = dto.anhDaiDienUrl?.trim() || null;
    if (dto.huongDanAi !== undefined)
      entity.huong_dan_ai = dto.huongDanAi ?? null;
    entity.cap_nhat_luc = new Date();

    await this.repo.save(entity);
    return {
      success: true,
      message: 'Cap nhat bai viet thanh cong',
      data: this.toPublic(entity),
    };
  }

  @Patch(':id/publish')
  async publish(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const entity = await this.repo.findOne({
      where: { id, tac_gia_id: req.user?.sub, xoa_luc: IsNull() },
    });
    if (!entity) throw new NotFoundException('Bai viet khong ton tai');
    entity.trang_thai = 'xuat_ban';
    entity.xuat_ban_luc = new Date();
    entity.cap_nhat_luc = new Date();
    await this.repo.save(entity);
    return {
      success: true,
      message: 'Xuat ban thanh cong',
      data: this.toPublic(entity),
    };
  }

  @Patch(':id/archive')
  async archive(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const entity = await this.repo.findOne({
      where: { id, tac_gia_id: req.user?.sub, xoa_luc: IsNull() },
    });
    if (!entity) throw new NotFoundException('Bai viet khong ton tai');
    entity.trang_thai = 'luu_tru';
    entity.cap_nhat_luc = new Date();
    await this.repo.save(entity);
    return {
      success: true,
      message: 'Luu tru thanh cong',
      data: this.toPublic(entity),
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const entity = await this.repo.findOne({
      where: { id, tac_gia_id: req.user?.sub, xoa_luc: IsNull() },
    });
    if (!entity) throw new NotFoundException('Bai viet khong ton tai');
    entity.xoa_luc = new Date();
    entity.cap_nhat_luc = new Date();
    await this.repo.save(entity);
    return { success: true, message: 'Xoa bai viet thanh cong' };
  }

  private toPublic(e: BaiVietEntity) {
    return {
      id: e.id,
      tac_gia_id: e.tac_gia_id,
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
