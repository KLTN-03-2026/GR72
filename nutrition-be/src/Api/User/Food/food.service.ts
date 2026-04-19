import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, IsNull, Repository } from 'typeorm';
import { NhomThucPhamEntity } from '../../Admin/Food/entities/nhom-thuc-pham.entity';
import { ThucPhamEntity } from '../../Admin/Food/entities/thuc-pham.entity';
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';
import { UserFoodsQueryDto } from './dto/user-foods-query.dto';

@Injectable()
export class UserFoodService {
  constructor(
    @InjectRepository(TaiKhoanEntity)
    private readonly userRepository: Repository<TaiKhoanEntity>,
    @InjectRepository(ThucPhamEntity)
    private readonly foodRepository: Repository<ThucPhamEntity>,
    @InjectRepository(NhomThucPhamEntity)
    private readonly foodGroupRepository: Repository<NhomThucPhamEntity>,
  ) {}

  async findAll(userId: number | undefined, query: UserFoodsQueryDto) {
    await this.getActiveUser(userId);

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(50, query.limit ?? 10));
    const qb = this.foodRepository
      .createQueryBuilder('food')
      .leftJoinAndSelect('food.nhom_thuc_pham', 'group')
      .where('food.xoa_luc IS NULL')
      .andWhere(
        new Brackets((verifiedQuery) => {
          verifiedQuery
            .where('food.da_xac_minh = :verified', { verified: true })
            .orWhere('food.loai_nguon = :internalSource', {
              internalSource: 'noi_bo',
            });
        }),
      );

    if (query.keyword?.trim()) {
      const keyword = `%${query.keyword.trim()}%`;
      qb.andWhere(
        new Brackets((searchQuery) => {
          searchQuery
            .where('food.ten LIKE :keyword', { keyword })
            .orWhere('food.slug LIKE :keyword', { keyword })
            .orWhere('food.ten_nguon LIKE :keyword', { keyword });
        }),
      );
    }

    if (query.nhomThucPhamId) {
      qb.andWhere('food.nhom_thuc_pham_id = :nhomThucPhamId', {
        nhomThucPhamId: query.nhomThucPhamId,
      });
    }

    qb.orderBy('food.ten', 'ASC')
      .addOrderBy('food.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    const groups = await this.foodGroupRepository.find({
      order: { ten: 'ASC' },
    });

    return {
      success: true,
      message: 'Lấy danh sách thực phẩm thành công',
      data: {
        items: items.map((item) => this.toFoodResponse(item)),
        filters: {
          nhom_thuc_pham: groups.map((group) => ({
            id: group.id,
            ten: group.ten,
            slug: group.slug,
          })),
        },
        pagination: { page, limit, total },
      },
    };
  }

  async findOne(userId: number | undefined, id: number) {
    await this.getActiveUser(userId);

    if (!Number.isFinite(id) || id <= 0) {
      throw new BadRequestException('ID thực phẩm không hợp lệ');
    }

    const food = await this.foodRepository.findOne({
      where: {
        id,
        xoa_luc: IsNull(),
      },
      relations: ['nhom_thuc_pham'],
    });

    if (!food || (!food.da_xac_minh && food.loai_nguon !== 'noi_bo')) {
      throw new NotFoundException('Khong tim thay thuc pham');
    }

    return {
      success: true,
      message: 'Lấy chi tiết thực phẩm thành công',
      data: this.toFoodResponse(food),
    };
  }

  private async getActiveUser(userId?: number) {
    if (!userId) {
      throw new UnauthorizedException('Ban chua dang nhap');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, xoa_luc: IsNull() },
    });

    if (!user || user.vai_tro !== 'nguoi_dung') {
      throw new UnauthorizedException('Khong tim thay nguoi dung hop le');
    }

    if (user.trang_thai !== 'hoat_dong') {
      throw new ForbiddenException('Tai khoan khong o trang thai hoat dong');
    }

    return user;
  }

  private toFoodResponse(food: ThucPhamEntity) {
    return {
      id: food.id,
      nhom_thuc_pham_id: food.nhom_thuc_pham_id,
      nhom_thuc_pham: food.nhom_thuc_pham
        ? {
            id: food.nhom_thuc_pham.id,
            ten: food.nhom_thuc_pham.ten,
            slug: food.nhom_thuc_pham.slug,
            mo_ta: food.nhom_thuc_pham.mo_ta,
          }
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
      da_xac_minh: food.da_xac_minh,
      cap_nhat_luc: food.cap_nhat_luc,
    };
  }
}
