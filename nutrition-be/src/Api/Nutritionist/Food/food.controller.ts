import { Controller, Get, NotFoundException, Param, ParseIntPipe, Query } from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Like, Repository } from 'typeorm';
import { ThucPhamEntity } from '../../Admin/Food/entities/thuc-pham.entity';

@Roles('chuyen_gia_dinh_duong')
@Controller('nutritionist/foods')
export class NutritionistFoodController {
  constructor(
    @InjectRepository(ThucPhamEntity)
    private readonly foodRepository: Repository<ThucPhamEntity>,
  ) {}

  @Get()
  async findAll(
    @Query('keyword') keyword?: string,
    @Query('da_xac_minh') daXacMinh?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const p = Math.max(1, Number(page));
    const l = Math.max(1, Math.min(50, Number(limit)));

    const where: FindOptionsWhere<ThucPhamEntity> = { xoa_luc: IsNull() as any };
    if (keyword) where.ten = Like(`%${keyword}%`);
    if (daXacMinh !== undefined) where.da_xac_minh = daXacMinh === 'true';

    const [items, total] = await this.foodRepository.findAndCount({
      where,
      relations: ['nhom_thuc_pham'],
      order: { ten: 'ASC' },
      skip: (p - 1) * l,
      take: l,
    });

    return {
      success: true,
      data: {
        items: items.map((f) => ({
          id: f.id, ten: f.ten, nhom_thuc_pham_id: f.nhom_thuc_pham_id,
          nhom_thuc_pham: f.nhom_thuc_pham ? { id: f.nhom_thuc_pham.id, ten: f.nhom_thuc_pham.ten } : null,
          calories_100g: f.calories_100g ? Number(f.calories_100g) : null,
          protein_100g: f.protein_100g ? Number(f.protein_100g) : null,
          carb_100g: f.carb_100g ? Number(f.carb_100g) : null,
          fat_100g: f.fat_100g ? Number(f.fat_100g) : null,
          khau_phan_tham_chieu: f.khau_phan_tham_chieu,
          don_vi_khau_phan: f.don_vi_khau_phan,
          da_xac_minh: f.da_xac_minh,
        })),
        pagination: { page: p, limit: l, total },
      },
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const food = await this.foodRepository.findOne({
      where: { id },
      relations: ['nhom_thuc_pham'],
    });
    if (!food) {
      throw new NotFoundException('Khong tim thay thuc pham');
    }
    return {
      success: true,
      data: {
        id: food.id,
        ten: food.ten,
        nhom_thuc_pham_id: food.nhom_thuc_pham_id,
        nhom_thuc_pham: food.nhom_thuc_pham
          ? { id: food.nhom_thuc_pham.id, ten: food.nhom_thuc_pham.ten }
          : null,
        calories_100g: food.calories_100g ? Number(food.calories_100g) : null,
        protein_100g: food.protein_100g ? Number(food.protein_100g) : null,
        carb_100g: food.carb_100g ? Number(food.carb_100g) : null,
        fat_100g: food.fat_100g ? Number(food.fat_100g) : null,
        khau_phan_tham_chieu: food.khau_phan_tham_chieu,
        don_vi_khau_phan: food.don_vi_khau_phan,
        da_xac_minh: food.da_xac_minh,
      },
    };
  }
}
