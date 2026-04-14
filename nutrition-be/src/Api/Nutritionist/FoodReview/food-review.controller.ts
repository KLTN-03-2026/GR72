import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req } from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { YeuCauDuyetThucPhamEntity } from '../../Admin/FoodReview/entities/yeu-cau-duyet-thuc-pham.entity';
import { ThongBaoEntity } from '../../Admin/FoodReview/entities/thong-bao.entity';
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';
import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class CreateFoodReviewDto {
  @IsOptional() @Type(() => Number) @IsNumber() thucPhamId?: number;
  @IsString() @IsNotEmpty() loaiYeuCau!: string;
  @IsObject() duLieuDeXuat!: Record<string, unknown>;
  @IsOptional() @IsObject() duLieuHienTai?: Record<string, unknown>;
  @IsOptional() @IsString() lyDo?: string;
}

@Roles('chuyen_gia_dinh_duong')
@Controller('nutritionist/food-review-requests')
export class NutritionistFoodReviewController {
  constructor(
    @InjectRepository(YeuCauDuyetThucPhamEntity)
    private readonly reviewRepo: Repository<YeuCauDuyetThucPhamEntity>,
    @InjectRepository(ThongBaoEntity)
    private readonly notifRepo: Repository<ThongBaoEntity>,
    @InjectRepository(TaiKhoanEntity)
    private readonly userRepo: Repository<TaiKhoanEntity>,
  ) {}

  @Get()
  async findAll(@Req() req: any, @Query('trangThai') trangThai?: string, @Query('page') page = '1', @Query('limit') limit = '10') {
    const userId = req.user?.sub;
    const p = Math.max(1, Number(page));
    const l = Math.max(1, Math.min(50, Number(limit)));
    const where: FindOptionsWhere<YeuCauDuyetThucPhamEntity> = { de_xuat_boi: userId };
    if (trangThai) where.trang_thai = trangThai as any;

    const [items, total] = await this.reviewRepo.findAndCount({
      where,
      order: { tao_luc: 'DESC' },
      skip: (p - 1) * l,
      take: l,
    });

    return { success: true, data: { items, pagination: { page: p, limit: l, total } } };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const entity = await this.reviewRepo.findOne({
      where: { id, de_xuat_boi: req.user?.sub },
      relations: ['thuc_pham', 'nguoi_de_xuat'],
    });
    if (!entity) return { success: false, message: 'Khong tim thay' };
    return {
      success: true,
      data: {
        id: entity.id,
        thuc_pham_id: entity.thuc_pham_id,
        thuc_pham: entity.thuc_pham ? {
          id: entity.thuc_pham.id,
          ten: entity.thuc_pham.ten,
          nhom_thuc_pham_id: entity.thuc_pham.nhom_thuc_pham_id,
          calories_100g: entity.thuc_pham.calories_100g ? Number(entity.thuc_pham.calories_100g) : null,
          protein_100g: entity.thuc_pham.protein_100g ? Number(entity.thuc_pham.protein_100g) : null,
          carb_100g: entity.thuc_pham.carb_100g ? Number(entity.thuc_pham.carb_100g) : null,
          fat_100g: entity.thuc_pham.fat_100g ? Number(entity.thuc_pham.fat_100g) : null,
          da_xac_minh: entity.thuc_pham.da_xac_minh,
        } : null,
        loai_yeu_cau: entity.loai_yeu_cau,
        ten_nguon: entity.ten_nguon,
        ma_nguon: entity.ma_nguon,
        de_xuat_boi: entity.de_xuat_boi,
        nguoi_de_xuat: entity.nguoi_de_xuat ? {
          id: entity.nguoi_de_xuat.id,
          ho_ten: (entity.nguoi_de_xuat as any).ho_ten ?? null,
        } : null,
        trang_thai: entity.trang_thai,
        du_lieu_hien_tai: entity.du_lieu_hien_tai,
        du_lieu_de_xuat: entity.du_lieu_de_xuat,
        ly_do: entity.ly_do,
        duyet_boi: entity.duyet_boi,
        duyet_luc: entity.duyet_luc?.toISOString() ?? null,
        ghi_chu_duyet: entity.ghi_chu_duyet,
        tao_luc: entity.tao_luc.toISOString(),
        cap_nhat_luc: entity.cap_nhat_luc.toISOString(),
      },
    };
  }

  @Post()
  async create(@Body() dto: CreateFoodReviewDto, @Req() req: any) {
    const userId = req.user?.sub;
    const now = new Date();

    const entity = this.reviewRepo.create({
      thuc_pham_id: dto.thucPhamId ?? null,
      loai_yeu_cau: dto.loaiYeuCau,
      de_xuat_boi: userId,
      trang_thai: 'cho_duyet',
      du_lieu_hien_tai: dto.duLieuHienTai ?? null,
      du_lieu_de_xuat: dto.duLieuDeXuat,
      ly_do: dto.lyDo?.trim() || null,
      tao_luc: now,
      cap_nhat_luc: now,
    });

    const saved = await this.reviewRepo.save(entity);

    // Tự động tạo thông báo cho tất cả admin
    const admins = await this.userRepo.find({ where: { vai_tro: 'quan_tri' as any } });
    for (const admin of admins) {
      await this.notifRepo.save(this.notifRepo.create({
        tai_khoan_id: admin.id,
        loai: 'de_xuat_thuc_pham',
        tieu_de: 'Có đề xuất sửa thực phẩm mới',
        noi_dung: `Chuyên gia dinh dưỡng đã gửi đề xuất ${dto.loaiYeuCau}.`,
        trang_thai: 'chua_doc',
        duong_dan_hanh_dong: '/admin/food-reviews',
        tao_luc: now,
        cap_nhat_luc: now,
      }));
    }

    return { success: true, message: 'Tao de xuat thanh cong', data: saved };
  }
}
