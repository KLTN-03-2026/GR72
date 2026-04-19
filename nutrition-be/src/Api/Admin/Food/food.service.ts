import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, IsNull, Repository } from 'typeorm';
import { CreateFoodDto } from './dto/create-food.dto';
import { CreateFoodGroupDto } from './dto/create-food-group.dto';
import { FoodsQueryDto } from './dto/foods-query.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { UpdateFoodGroupDto } from './dto/update-food-group.dto';
import type {
  FoodGroupSummary,
  FoodSourceType,
  PublicFood,
} from './food.types';
import { NhomThucPhamEntity } from './entities/nhom-thuc-pham.entity';
import { ThucPhamEntity } from './entities/thuc-pham.entity';

type SuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

@Injectable()
export class FoodService {
  constructor(
    @InjectRepository(ThucPhamEntity)
    private readonly foodRepository: Repository<ThucPhamEntity>,
    @InjectRepository(NhomThucPhamEntity)
    private readonly foodGroupRepository: Repository<NhomThucPhamEntity>,
  ) {}

  async getMeta(): Promise<
    SuccessResponse<{
      groups: FoodGroupSummary[];
      sourceTypes: FoodSourceType[];
    }>
  > {
    const groups = await this.foodGroupRepository.find({
      order: { ten: 'ASC' },
    });

    return {
      success: true,
      message: 'Lay metadata foods thanh cong',
      data: {
        groups: groups.map((group) => this.toFoodGroupSummary(group)),
        sourceTypes: ['noi_bo', 'thu_cong', 'api_ngoai'],
      },
    };
  }

  async getFoodGroups(): Promise<SuccessResponse<FoodGroupSummary[]>> {
    const groups = await this.foodGroupRepository.find({
      order: { ten: 'ASC' },
    });

    return {
      success: true,
      message: 'Lay danh sach nhom thuc pham thanh cong',
      data: groups.map((group) => this.toFoodGroupSummary(group)),
    };
  }

  async createFoodGroup(
    dto: CreateFoodGroupDto,
  ): Promise<SuccessResponse<FoodGroupSummary>> {
    const now = new Date();
    const slug = await this.buildUniqueFoodGroupSlug(dto.slug, dto.ten);

    const group = this.foodGroupRepository.create({
      ten: dto.ten.trim(),
      slug,
      mo_ta: this.normalizeNullableText(dto.moTa),
      tao_luc: now,
      cap_nhat_luc: now,
    });

    const saved = await this.foodGroupRepository.save(group);

    return {
      success: true,
      message: 'Tao nhom thuc pham thanh cong',
      data: this.toFoodGroupSummary(saved),
    };
  }

  async updateFoodGroup(
    id: number,
    dto: UpdateFoodGroupDto,
  ): Promise<SuccessResponse<FoodGroupSummary>> {
    const group = await this.findGroupById(id);

    if (dto.ten !== undefined) {
      group.ten = dto.ten.trim();
      if (!dto.slug) {
        group.slug = await this.buildUniqueFoodGroupSlug(
          undefined,
          group.ten,
          id,
        );
      }
    }

    if (dto.slug !== undefined) {
      group.slug = await this.buildUniqueFoodGroupSlug(
        dto.slug,
        dto.ten ?? group.ten,
        id,
      );
    }

    if (dto.moTa !== undefined) {
      group.mo_ta = this.normalizeNullableText(dto.moTa);
    }

    group.cap_nhat_luc = new Date();

    const saved = await this.foodGroupRepository.save(group);

    return {
      success: true,
      message: 'Cap nhat nhom thuc pham thanh cong',
      data: this.toFoodGroupSummary(saved),
    };
  }

  async removeFoodGroup(id: number): Promise<SuccessResponse<{ id: number }>> {
    const group = await this.findGroupById(id);
    const linkedFoods = await this.foodRepository.count({
      where: {
        nhom_thuc_pham_id: id,
        xoa_luc: IsNull(),
      },
    });

    if (linkedFoods > 0) {
      throw new BadRequestException(
        'Khong the xoa nhom thuc pham dang duoc gan cho thuc pham',
      );
    }

    await this.foodGroupRepository.remove(group);

    return {
      success: true,
      message: 'Xoa nhom thuc pham thanh cong',
      data: { id },
    };
  }

  async create(
    dto: CreateFoodDto,
    actorId: number | null,
  ): Promise<SuccessResponse<PublicFood>> {
    const group = await this.findGroupById(dto.nhomThucPhamId);
    const slug = await this.buildUniqueSlug(dto.slug, dto.ten);
    const now = new Date();

    const entity = this.foodRepository.create({
      nhom_thuc_pham_id: group.id,
      ten: dto.ten.trim(),
      slug,
      mo_ta: this.normalizeNullableText(dto.moTa),
      the_gan: this.normalizeTags(dto.theGan),
      loai_nguon: this.normalizeSourceType(dto.loaiNguon),
      ten_nguon: this.normalizeNullableText(dto.tenNguon),
      ma_nguon: this.normalizeNullableText(dto.maNguon),
      khau_phan_tham_chieu: String(dto.khauPhanThamChieu),
      don_vi_khau_phan: dto.donViKhauPhan.trim(),
      calories_100g: String(dto.calories100g),
      protein_100g: String(dto.protein100g),
      carb_100g: String(dto.carb100g),
      fat_100g: String(dto.fat100g),
      chat_xo_100g: String(dto.chatXo100g ?? 0),
      duong_100g: String(dto.duong100g ?? 0),
      natri_100g: String(dto.natri100g ?? 0),
      du_lieu_goc: this.parseJson(dto.duLieuGoc),
      da_xac_minh: dto.daXacMinh ?? false,
      tao_boi: actorId,
      cap_nhat_boi: actorId,
      tao_luc: now,
      cap_nhat_luc: now,
      xoa_luc: null,
    });

    const saved = await this.foodRepository.save(entity);
    const created = await this.findFoodById(saved.id);

    return {
      success: true,
      message: 'Tao thuc pham thanh cong',
      data: this.toPublicFood(created),
    };
  }

  async findAll(query: FoodsQueryDto): Promise<
    SuccessResponse<{
      items: PublicFood[];
      pagination: { page: number; limit: number; total: number };
    }>
  > {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const baseWhere: FindOptionsWhere<ThucPhamEntity> = {
      xoa_luc: IsNull(),
    };

    if (!query.keyword) {
      if (query.nhomThucPhamId) {
        baseWhere.nhom_thuc_pham_id = query.nhomThucPhamId;
      }
      if (query.loaiNguon) {
        baseWhere.loai_nguon = query.loaiNguon as FoodSourceType;
      }
      if (query.daXacMinh !== undefined) {
        baseWhere.da_xac_minh = query.daXacMinh;
      }

      const [items, total] = await this.foodRepository.findAndCount({
        where: baseWhere,
        relations: ['nhom_thuc_pham'],
        order: { id: 'DESC' },
        skip,
        take: limit,
      });

      return {
        success: true,
        message: 'Lay danh sach thuc pham thanh cong',
        data: {
          items: items.map((item) => this.toPublicFood(item)),
          pagination: { page, limit, total },
        },
      };
    }

    const keyword = query.keyword.trim();
    const where: FindOptionsWhere<ThucPhamEntity>[] = [
      { ...baseWhere, ten: ILike(`%${keyword}%`) },
      { ...baseWhere, slug: ILike(`%${keyword}%`) },
      { ...baseWhere, ten_nguon: ILike(`%${keyword}%`) },
    ];

    where.forEach((item) => {
      if (query.nhomThucPhamId) {
        item.nhom_thuc_pham_id = query.nhomThucPhamId;
      }
      if (query.loaiNguon) {
        item.loai_nguon = query.loaiNguon as FoodSourceType;
      }
      if (query.daXacMinh !== undefined) {
        item.da_xac_minh = query.daXacMinh;
      }
    });

    const [items, total] = await this.foodRepository.findAndCount({
      where,
      relations: ['nhom_thuc_pham'],
      order: { id: 'DESC' },
      skip,
      take: limit,
    });

    return {
      success: true,
      message: 'Lay danh sach thuc pham thanh cong',
      data: {
        items: items.map((item) => this.toPublicFood(item)),
        pagination: { page, limit, total },
      },
    };
  }

  async findOne(id: number): Promise<SuccessResponse<PublicFood>> {
    const food = await this.findFoodById(id);

    return {
      success: true,
      message: 'Lay chi tiet thuc pham thanh cong',
      data: this.toPublicFood(food),
    };
  }

  async update(
    id: number,
    dto: UpdateFoodDto,
    actorId: number | null,
  ): Promise<SuccessResponse<PublicFood>> {
    const food = await this.findFoodById(id);

    if (dto.nhomThucPhamId !== undefined) {
      const group = await this.findGroupById(dto.nhomThucPhamId);
      food.nhom_thuc_pham_id = group.id;
    }

    if (dto.ten !== undefined) {
      food.ten = dto.ten.trim();
      if (!dto.slug) {
        food.slug = await this.buildUniqueSlug(undefined, food.ten, id);
      }
    }

    if (dto.slug !== undefined) {
      food.slug = await this.buildUniqueSlug(dto.slug, dto.ten ?? food.ten, id);
    }

    if (dto.moTa !== undefined) {
      food.mo_ta = this.normalizeNullableText(dto.moTa);
    }
    if (dto.theGan !== undefined) {
      food.the_gan = this.normalizeTags(dto.theGan);
    }
    if (dto.loaiNguon !== undefined) {
      food.loai_nguon = this.normalizeSourceType(dto.loaiNguon);
    }
    if (dto.tenNguon !== undefined) {
      food.ten_nguon = this.normalizeNullableText(dto.tenNguon);
    }
    if (dto.maNguon !== undefined) {
      food.ma_nguon = this.normalizeNullableText(dto.maNguon);
    }
    if (dto.khauPhanThamChieu !== undefined) {
      food.khau_phan_tham_chieu = String(dto.khauPhanThamChieu);
    }
    if (dto.donViKhauPhan !== undefined) {
      food.don_vi_khau_phan = dto.donViKhauPhan.trim();
    }
    if (dto.calories100g !== undefined) {
      food.calories_100g = String(dto.calories100g);
    }
    if (dto.protein100g !== undefined) {
      food.protein_100g = String(dto.protein100g);
    }
    if (dto.carb100g !== undefined) {
      food.carb_100g = String(dto.carb100g);
    }
    if (dto.fat100g !== undefined) {
      food.fat_100g = String(dto.fat100g);
    }
    if (dto.chatXo100g !== undefined) {
      food.chat_xo_100g = String(dto.chatXo100g);
    }
    if (dto.duong100g !== undefined) {
      food.duong_100g = String(dto.duong100g);
    }
    if (dto.natri100g !== undefined) {
      food.natri_100g = String(dto.natri100g);
    }
    if (dto.duLieuGoc !== undefined) {
      food.du_lieu_goc = this.parseJson(dto.duLieuGoc);
    }
    if (dto.daXacMinh !== undefined) {
      food.da_xac_minh = dto.daXacMinh;
    }

    food.cap_nhat_boi = actorId;
    food.cap_nhat_luc = new Date();

    await this.foodRepository.save(food);
    const updated = await this.findFoodById(id);

    return {
      success: true,
      message: 'Cap nhat thuc pham thanh cong',
      data: this.toPublicFood(updated),
    };
  }

  async remove(
    id: number,
    actorId: number | null,
  ): Promise<SuccessResponse<{ id: number }>> {
    const food = await this.findFoodById(id);
    food.xoa_luc = new Date();
    food.cap_nhat_luc = new Date();
    food.cap_nhat_boi = actorId;
    await this.foodRepository.save(food);

    return {
      success: true,
      message: 'Xoa mem thuc pham thanh cong',
      data: { id },
    };
  }

  private async findFoodById(id: number): Promise<ThucPhamEntity> {
    const food = await this.foodRepository.findOne({
      where: {
        id,
        xoa_luc: IsNull(),
      },
      relations: ['nhom_thuc_pham'],
    });

    if (!food) {
      throw new NotFoundException('Thuc pham khong ton tai');
    }

    return food;
  }

  private async findGroupById(id: number): Promise<NhomThucPhamEntity> {
    const group = await this.foodGroupRepository.findOne({
      where: { id },
    });

    if (!group) {
      throw new BadRequestException('Nhom thuc pham khong hop le');
    }

    return group;
  }

  private async buildUniqueFoodGroupSlug(
    providedSlug: string | undefined,
    fallbackName: string,
    excludeId?: number,
  ): Promise<string> {
    const baseSlug = this.slugify(providedSlug?.trim() || fallbackName.trim());

    if (!baseSlug) {
      throw new BadRequestException('Slug nhom thuc pham khong hop le');
    }

    const existed = await this.foodGroupRepository.findOne({
      where: { slug: baseSlug },
    });

    if (existed && Number(existed.id) !== excludeId) {
      throw new BadRequestException('Slug nhom thuc pham da ton tai');
    }

    return baseSlug;
  }

  private async buildUniqueSlug(
    providedSlug: string | undefined,
    fallbackName: string,
    excludeId?: number,
  ): Promise<string> {
    const baseSlug = this.slugify(providedSlug?.trim() || fallbackName.trim());

    if (!baseSlug) {
      throw new BadRequestException('Slug khong hop le');
    }

    const existed = await this.foodRepository.findOne({
      where: {
        slug: baseSlug,
        xoa_luc: IsNull(),
      },
    });

    if (existed && Number(existed.id) !== excludeId) {
      throw new BadRequestException('Slug da ton tai');
    }

    return baseSlug;
  }

  private normalizeNullableText(value?: string): string | null {
    if (value === undefined) return null;
    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  private normalizeTags(tags?: string[]): string[] {
    if (!tags?.length) return [];

    return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
  }

  private normalizeSourceType(value?: string): FoodSourceType {
    const normalized = (value?.trim() || 'noi_bo') as FoodSourceType;
    const allowed: FoodSourceType[] = ['noi_bo', 'thu_cong', 'api_ngoai'];

    if (!allowed.includes(normalized)) {
      throw new BadRequestException('Loai nguon khong hop le');
    }

    return normalized;
  }

  private parseJson(value?: string): Record<string, unknown> | null {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      return Object.keys(parsed).length ? parsed : null;
    } catch {
      throw new BadRequestException('Du lieu goc phai la JSON hop le');
    }
  }

  private slugify(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private toFoodGroupSummary(group: NhomThucPhamEntity): FoodGroupSummary {
    return {
      id: group.id,
      ten: group.ten,
      slug: group.slug,
      mo_ta: group.mo_ta,
    };
  }

  private toPublicFood(food: ThucPhamEntity): PublicFood {
    return {
      id: food.id,
      nhom_thuc_pham_id: food.nhom_thuc_pham_id,
      nhom_thuc_pham: food.nhom_thuc_pham
        ? this.toFoodGroupSummary(food.nhom_thuc_pham)
        : null,
      ten: food.ten,
      slug: food.slug,
      mo_ta: food.mo_ta,
      the_gan: food.the_gan ?? [],
      loai_nguon: food.loai_nguon,
      ten_nguon: food.ten_nguon,
      ma_nguon: food.ma_nguon,
      khau_phan_tham_chieu: Number(food.khau_phan_tham_chieu),
      don_vi_khau_phan: food.don_vi_khau_phan,
      calories_100g: Number(food.calories_100g),
      protein_100g: Number(food.protein_100g),
      carb_100g: Number(food.carb_100g),
      fat_100g: Number(food.fat_100g),
      chat_xo_100g: Number(food.chat_xo_100g),
      duong_100g: Number(food.duong_100g),
      natri_100g: Number(food.natri_100g),
      du_lieu_goc: food.du_lieu_goc,
      da_xac_minh: food.da_xac_minh,
      tao_boi: food.tao_boi,
      cap_nhat_boi: food.cap_nhat_boi,
      tao_luc: food.tao_luc.toISOString(),
      cap_nhat_luc: food.cap_nhat_luc.toISOString(),
    };
  }
}
