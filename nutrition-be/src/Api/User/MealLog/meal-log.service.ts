import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, MoreThanOrEqual, Repository } from 'typeorm';
import { ThucPhamEntity } from '../../Admin/Food/entities/thuc-pham.entity';
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';
import { CongThucEntity } from '../../Nutritionist/Recipe/entities/cong-thuc.entity';
import {
  ChiTietKeHoachAnEntity,
  KeHoachAnEntity,
  UserMealType,
} from '../MealPlan/entities/ke-hoach-an.entity';
import {
  ChiTietNhatKyBuaAnEntity,
  NhatKyBuaAnEntity,
  TongHopDinhDuongNgayEntity,
} from './entities/nhat-ky-bua-an.entity';
import { CreateMealLogDto } from './dto/create-meal-log.dto';
import { LogMealPlanDto } from './dto/log-meal-plan.dto';
import { MealLogQueryDto } from './dto/meal-log-query.dto';
import { NutritionSummaryQueryDto } from './dto/nutrition-summary-query.dto';
import { UpdateMealLogDto } from './dto/update-meal-log.dto';
import type { MealLogDetailDto } from './dto/meal-log-detail.dto';

@Injectable()
export class UserMealLogService {
  constructor(
    @InjectRepository(TaiKhoanEntity)
    private readonly userRepository: Repository<TaiKhoanEntity>,
    @InjectRepository(ThucPhamEntity)
    private readonly foodRepository: Repository<ThucPhamEntity>,
    @InjectRepository(CongThucEntity)
    private readonly recipeRepository: Repository<CongThucEntity>,
    @InjectRepository(KeHoachAnEntity)
    private readonly mealPlanRepository: Repository<KeHoachAnEntity>,
    @InjectRepository(ChiTietKeHoachAnEntity)
    private readonly mealPlanDetailRepository: Repository<ChiTietKeHoachAnEntity>,
    @InjectRepository(NhatKyBuaAnEntity)
    private readonly mealLogRepository: Repository<NhatKyBuaAnEntity>,
    @InjectRepository(ChiTietNhatKyBuaAnEntity)
    private readonly mealLogDetailRepository: Repository<ChiTietNhatKyBuaAnEntity>,
    @InjectRepository(TongHopDinhDuongNgayEntity)
    private readonly nutritionSummaryRepository: Repository<TongHopDinhDuongNgayEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getMealLogs(userId: number | undefined, query: MealLogQueryDto) {
    const user = await this.getActiveUser(userId);
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(50, query.limit ?? 10));
    const where: Record<string, unknown> = { tai_khoan_id: user.id };

    if (query.date) {
      where.ngay_ghi = query.date;
    } else if (query.from && query.to) {
      where.ngay_ghi = MoreThanOrEqual(query.from);
    }

    const qb = this.mealLogRepository
      .createQueryBuilder('meal_log')
      .leftJoinAndSelect('meal_log.chi_tiet', 'detail')
      .where('meal_log.tai_khoan_id = :userId', { userId: user.id });

    if (query.date) {
      qb.andWhere('meal_log.ngay_ghi = :date', { date: query.date });
    }
    if (query.from) {
      qb.andWhere('meal_log.ngay_ghi >= :from', { from: query.from });
    }
    if (query.to) {
      qb.andWhere('meal_log.ngay_ghi <= :to', { to: query.to });
    }

    qb.orderBy('meal_log.ngay_ghi', 'DESC')
      .addOrderBy('meal_log.loai_bua_an', 'ASC')
      .addOrderBy('meal_log.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      success: true,
      message: 'Lấy nhật ký ăn uống thành công',
      data: {
        items: items.map((item) => this.toMealLogResponse(item)),
        pagination: { page, limit, total },
      },
    };
  }

  async getMealLog(userId: number | undefined, mealLogId: number) {
    const user = await this.getActiveUser(userId);
    const mealLog = await this.mealLogRepository.findOne({
      where: { id: mealLogId, tai_khoan_id: user.id },
      relations: ['chi_tiet'],
    });

    if (!mealLog) {
      throw new NotFoundException('Khong tim thay nhat ky bua an');
    }

    return {
      success: true,
      message: 'Lấy chi tiết nhật ký ăn uống thành công',
      data: this.toMealLogResponse(mealLog),
    };
  }

  async createMealLog(userId: number | undefined, dto: CreateMealLogDto) {
    const user = await this.getActiveUser(userId);
    this.ensureDateNotFuture(dto.ngayGhi, 'Ngày ghi');

    const result = await this.dataSource.transaction(async (manager) => {
      const mealLogRepository = manager.getRepository(NhatKyBuaAnEntity);
      const existing = await mealLogRepository.findOne({
        where: {
          tai_khoan_id: user.id,
          ngay_ghi: dto.ngayGhi,
          loai_bua_an: dto.loaiBuaAn,
        },
      });

      if (existing) {
        throw new BadRequestException(
          'Bữa ăn này đã tồn tại trong ngày, vui lòng cập nhật thay vì tạo mới',
        );
      }

      const now = new Date();
      const mealLog = await mealLogRepository.save(
        mealLogRepository.create({
          tai_khoan_id: user.id,
          ngay_ghi: dto.ngayGhi,
          loai_bua_an: dto.loaiBuaAn,
          ghi_chu: dto.ghiChu?.trim() || null,
          tao_luc: now,
          cap_nhat_luc: now,
        }),
      );

      await this.replaceMealLogDetails(manager, mealLog.id, dto.chiTiet);
      await this.recalculateNutritionSummary(manager, user.id, dto.ngayGhi);

      return mealLogRepository.findOne({
        where: { id: mealLog.id },
        relations: ['chi_tiet'],
      });
    });

    return {
      success: true,
      message: 'Tạo nhật ký ăn uống thành công',
      data: this.toMealLogResponse(result!),
    };
  }

  async updateMealLog(
    userId: number | undefined,
    mealLogId: number,
    dto: UpdateMealLogDto,
  ) {
    if (!Number.isFinite(mealLogId) || mealLogId <= 0) {
      throw new BadRequestException('ID nhật ký ăn uống không hợp lệ');
    }

    const user = await this.getActiveUser(userId);
    const result = await this.dataSource.transaction(async (manager) => {
      const mealLogRepository = manager.getRepository(NhatKyBuaAnEntity);
      const mealLog = await mealLogRepository.findOne({
        where: { id: mealLogId, tai_khoan_id: user.id },
        relations: ['chi_tiet'],
      });

      if (!mealLog) {
        throw new NotFoundException('Khong tim thay nhat ky bua an');
      }

      const oldDate = mealLog.ngay_ghi;
      const nextDate = dto.ngayGhi ?? mealLog.ngay_ghi;
      const nextMealType = dto.loaiBuaAn ?? mealLog.loai_bua_an;

      this.ensureDateNotFuture(nextDate, 'Ngày ghi');

      if (nextDate !== oldDate || nextMealType !== mealLog.loai_bua_an) {
        const conflict = await mealLogRepository.findOne({
          where: {
            tai_khoan_id: user.id,
            ngay_ghi: nextDate,
            loai_bua_an: nextMealType,
          },
        });

        if (conflict && conflict.id !== mealLog.id) {
          throw new BadRequestException(
            'Đã tồn tại bữa ăn khác với cùng ngày và loại bữa',
          );
        }
      }

      if (dto.ngayGhi !== undefined) {
        mealLog.ngay_ghi = dto.ngayGhi;
      }
      if (dto.loaiBuaAn !== undefined) {
        mealLog.loai_bua_an = dto.loaiBuaAn;
      }
      if (dto.ghiChu !== undefined) {
        mealLog.ghi_chu = dto.ghiChu?.trim() || null;
      }

      mealLog.cap_nhat_luc = new Date();
      await mealLogRepository.save(mealLog);

      if (dto.chiTiet !== undefined) {
        if (dto.chiTiet.length === 0) {
          throw new BadRequestException('Bữa ăn phải có ít nhất một món');
        }
        await this.replaceMealLogDetails(manager, mealLog.id, dto.chiTiet);
      }

      await this.recalculateNutritionSummary(manager, user.id, oldDate);
      if (nextDate !== oldDate) {
        await this.recalculateNutritionSummary(manager, user.id, nextDate);
      }

      return mealLogRepository.findOne({
        where: { id: mealLog.id },
        relations: ['chi_tiet'],
      });
    });

    return {
      success: true,
      message: 'Cập nhật nhật ký ăn uống thành công',
      data: this.toMealLogResponse(result!),
    };
  }

  async deleteMealLog(userId: number | undefined, mealLogId: number) {
    if (!Number.isFinite(mealLogId) || mealLogId <= 0) {
      throw new BadRequestException('ID nhật ký ăn uống không hợp lệ');
    }

    const user = await this.getActiveUser(userId);
    await this.dataSource.transaction(async (manager) => {
      const mealLogRepository = manager.getRepository(NhatKyBuaAnEntity);
      const mealLog = await mealLogRepository.findOne({
        where: { id: mealLogId, tai_khoan_id: user.id },
      });

      if (!mealLog) {
        throw new NotFoundException('Khong tim thay nhat ky bua an');
      }

      const date = mealLog.ngay_ghi;
      await manager.delete(NhatKyBuaAnEntity, { id: mealLog.id });
      await this.recalculateNutritionSummary(manager, user.id, date);
    });

    return {
      success: true,
      message: 'Xóa nhật ký ăn uống thành công',
    };
  }

  async logMealFromPlan(
    userId: number | undefined,
    planId: number,
    dto: LogMealPlanDto,
  ) {
    if (!Number.isFinite(planId) || planId <= 0) {
      throw new BadRequestException('ID kế hoạch ăn không hợp lệ');
    }

    const user = await this.getActiveUser(userId);
    const result = await this.dataSource.transaction(async (manager) => {
      const mealPlanRepository = manager.getRepository(KeHoachAnEntity);
      const mealPlanDetailRepository = manager.getRepository(
        ChiTietKeHoachAnEntity,
      );
      const mealLogRepository = manager.getRepository(NhatKyBuaAnEntity);
      const mealLogDetailRepository = manager.getRepository(
        ChiTietNhatKyBuaAnEntity,
      );

      const plan = await mealPlanRepository.findOne({
        where: { id: planId, tai_khoan_id: user.id },
      });

      if (!plan) {
        throw new NotFoundException('Khong tim thay ke hoach an');
      }

      const date = dto.ngayGhi ?? plan.ngay_ap_dung;
      this.ensureDateNotFuture(date, 'Ngày ghi');

      const details = await mealPlanDetailRepository.find({
        where: { ke_hoach_an_id: plan.id },
        order: { loai_bua_an: 'ASC', thu_tu: 'ASC', id: 'ASC' },
      });

      if (details.length === 0) {
        throw new BadRequestException(
          'Kế hoạch ăn không có chi tiết để ghi nhận',
        );
      }

      const byMealType = new Map<UserMealType, ChiTietKeHoachAnEntity[]>();
      for (const detail of details) {
        const current = byMealType.get(detail.loai_bua_an) ?? [];
        current.push(detail);
        byMealType.set(detail.loai_bua_an, current);
      }

      const savedIds: number[] = [];

      for (const [mealType, mealDetails] of byMealType.entries()) {
        let mealLog = await mealLogRepository.findOne({
          where: {
            tai_khoan_id: user.id,
            ngay_ghi: date,
            loai_bua_an: mealType,
          },
        });

        const now = new Date();
        if (!mealLog) {
          mealLog = await mealLogRepository.save(
            mealLogRepository.create({
              tai_khoan_id: user.id,
              ngay_ghi: date,
              loai_bua_an: mealType,
              ghi_chu: `Ghi nhận từ kế hoạch ăn #${plan.id}`,
              tao_luc: now,
              cap_nhat_luc: now,
            }),
          );
        } else {
          const existingDetailsCount = await mealLogDetailRepository.count({
            where: { nhat_ky_bua_an_id: mealLog.id },
          });
          if (existingDetailsCount > 0 && !dto.ghiDe) {
            throw new BadRequestException(
              'Bữa ăn này đã có dữ liệu. Vui lòng cập nhật trực tiếp hoặc gọi lại với ghiDe=true nếu muốn thay thế bằng kế hoạch ăn',
            );
          }
          mealLog.ghi_chu = `Ghi nhận từ kế hoạch ăn #${plan.id}`;
          mealLog.cap_nhat_luc = now;
          await mealLogRepository.save(mealLog);
          if (existingDetailsCount > 0) {
            await mealLogDetailRepository.delete({
              nhat_ky_bua_an_id: mealLog.id,
            });
          }
        }

        for (const detail of mealDetails) {
          const snapshot = await this.buildSnapshot({
            loaiNguon: detail.cong_thuc_id ? 'cong_thuc' : 'thuc_pham',
            thucPhamId: detail.thuc_pham_id ?? undefined,
            congThucId: detail.cong_thuc_id ?? undefined,
            soLuong: detail.so_luong ? Number(detail.so_luong) : 1,
            donVi: detail.don_vi ?? (detail.cong_thuc_id ? 'phan' : 'g'),
          });
          await mealLogDetailRepository.save(
            mealLogDetailRepository.create({
              nhat_ky_bua_an_id: mealLog.id,
              loai_nguon: snapshot.cong_thuc_id ? 'cong_thuc' : 'thuc_pham',
              nguon_id: snapshot.nguon_id,
              cong_thuc_id: snapshot.cong_thuc_id,
              thuc_pham_id: snapshot.thuc_pham_id,
              so_luong: detail.so_luong
                ? Number(detail.so_luong).toFixed(2)
                : '1.00',
              don_vi: detail.don_vi ?? (detail.cong_thuc_id ? 'phan' : 'g'),
              calories: snapshot.calories.toFixed(2),
              protein_g: snapshot.protein_g.toFixed(2),
              carb_g: snapshot.carb_g.toFixed(2),
              fat_g: snapshot.fat_g.toFixed(2),
              chat_xo_g:
                snapshot.chat_xo_g !== null
                  ? snapshot.chat_xo_g.toFixed(2)
                  : null,
              natri_mg:
                snapshot.natri_mg !== null
                  ? snapshot.natri_mg.toFixed(2)
                  : null,
              du_lieu_chup_lai: {
                ...snapshot.du_lieu_chup_lai,
                nguon_ke_hoach_an_id: plan.id,
                loai_nguon_ke_hoach: plan.loai_nguon,
                tieu_de_ke_hoach: plan.tieu_de,
              },
              tao_luc: now,
              cap_nhat_luc: now,
            }),
          );
        }

        savedIds.push(mealLog.id);
      }

      await this.recalculateNutritionSummary(manager, user.id, date);

      const savedMealLogs = await mealLogRepository.find({
        where: savedIds.map((id) => ({ id, tai_khoan_id: user.id })),
        relations: ['chi_tiet'],
        order: { loai_bua_an: 'ASC' },
      });

      return { date, savedMealLogs };
    });

    return {
      success: true,
      message: 'Đã ghi nhận bữa ăn từ kế hoạch thành công',
      data: {
        ngay_ghi: result.date,
        items: result.savedMealLogs.map((item) => this.toMealLogResponse(item)),
      },
    };
  }

  async getNutritionSummary(
    userId: number | undefined,
    query: NutritionSummaryQueryDto,
  ) {
    const user = await this.getActiveUser(userId);

    if (!query.date && !(query.from && query.to)) {
      throw new BadRequestException(
        'Cần truyền date hoặc cặp from/to để lấy tổng hợp dinh dưỡng',
      );
    }

    if (query.date) {
      const summary = await this.nutritionSummaryRepository.findOne({
        where: { tai_khoan_id: user.id, ngay: query.date },
      });

      return {
        success: true,
        message: 'Lấy tổng hợp dinh dưỡng theo ngày thành công',
        data: summary ? this.toSummaryResponse(summary) : null,
      };
    }

    const items = await this.nutritionSummaryRepository.find({
      where: {
        tai_khoan_id: user.id,
        ngay: MoreThanOrEqual(query.from!),
      },
      order: { ngay: 'ASC' },
    });

    const filtered = items.filter((item) => item.ngay <= query.to!);

    return {
      success: true,
      message: 'Lấy lịch sử tổng hợp dinh dưỡng thành công',
      data: {
        items: filtered.map((item) => this.toSummaryResponse(item)),
        total: filtered.length,
      },
    };
  }

  private async replaceMealLogDetails(
    manager: DataSource['manager'],
    mealLogId: number,
    details: MealLogDetailDto[],
  ) {
    const mealLogDetailRepository = manager.getRepository(
      ChiTietNhatKyBuaAnEntity,
    );
    await mealLogDetailRepository.delete({ nhat_ky_bua_an_id: mealLogId });

    const now = new Date();
    for (const detail of details) {
      const snapshot = await this.buildSnapshot(detail);
      await mealLogDetailRepository.save(
        mealLogDetailRepository.create({
          nhat_ky_bua_an_id: mealLogId,
          loai_nguon: detail.loaiNguon,
          nguon_id: snapshot.nguon_id,
          cong_thuc_id: snapshot.cong_thuc_id,
          thuc_pham_id: snapshot.thuc_pham_id,
          so_luong: detail.soLuong.toFixed(2),
          don_vi: detail.donVi.trim(),
          calories: snapshot.calories.toFixed(2),
          protein_g: snapshot.protein_g.toFixed(2),
          carb_g: snapshot.carb_g.toFixed(2),
          fat_g: snapshot.fat_g.toFixed(2),
          chat_xo_g:
            snapshot.chat_xo_g !== null ? snapshot.chat_xo_g.toFixed(2) : null,
          natri_mg:
            snapshot.natri_mg !== null ? snapshot.natri_mg.toFixed(2) : null,
          du_lieu_chup_lai: snapshot.du_lieu_chup_lai,
          tao_luc: now,
          cap_nhat_luc: now,
        }),
      );
    }
  }

  private async buildSnapshot(detail: MealLogDetailDto) {
    if (detail.loaiNguon === 'thuc_pham') {
      if (!detail.thucPhamId || detail.congThucId) {
        throw new BadRequestException(
          'Chi tiết thực phẩm phải có thucPhamId và không được kèm congThucId',
        );
      }

      const food = await this.foodRepository.findOne({
        where: { id: detail.thucPhamId, xoa_luc: IsNull() },
        relations: ['nhom_thuc_pham'],
      });

      if (!food || (!food.da_xac_minh && food.loai_nguon !== 'noi_bo')) {
        throw new NotFoundException('Khong tim thay thuc pham hop le');
      }

      const normalizedUnit = this.normalizeUnit(detail.donVi);
      const servingUnit = this.normalizeUnit(food.don_vi_khau_phan ?? null);

      if (
        normalizedUnit !== 'g' &&
        (!servingUnit || normalizedUnit !== servingUnit)
      ) {
        throw new BadRequestException(
          `Đơn vị "${detail.donVi}" không hợp lệ cho thực phẩm này. Chỉ chấp nhận "g" hoặc "${food.don_vi_khau_phan}"`,
        );
      }

      if (
        normalizedUnit !== 'g' &&
        (!food.khau_phan_tham_chieu || Number(food.khau_phan_tham_chieu) <= 0)
      ) {
        throw new BadRequestException(
          'Thực phẩm này chưa có khẩu phần tham chiếu hợp lệ để ghi nhật ký',
        );
      }

      const denominator =
        normalizedUnit === 'g' ? 100 : Number(food.khau_phan_tham_chieu || 100);
      const ratio = detail.soLuong / (denominator > 0 ? denominator : 100);

      return {
        nguon_id: food.id,
        cong_thuc_id: null,
        thuc_pham_id: food.id,
        calories: Number(food.calories_100g) * ratio,
        protein_g: Number(food.protein_100g) * ratio,
        carb_g: Number(food.carb_100g) * ratio,
        fat_g: Number(food.fat_100g) * ratio,
        chat_xo_g: Number(food.chat_xo_100g) * ratio,
        natri_mg: Number(food.natri_100g) * ratio,
        du_lieu_chup_lai: {
          loai_nguon: 'thuc_pham',
          ten: food.ten,
          nhom_thuc_pham: food.nhom_thuc_pham?.ten ?? null,
          don_vi_nguoi_dung: detail.donVi.trim(),
          khau_phan_tham_chieu: Number(food.khau_phan_tham_chieu || 100),
          don_vi_khau_phan: food.don_vi_khau_phan,
        },
      };
    }

    if (!detail.congThucId || detail.thucPhamId) {
      throw new BadRequestException(
        'Chi tiết công thức phải có congThucId và không được kèm thucPhamId',
      );
    }

    const recipe = await this.recipeRepository.findOne({
      where: {
        id: detail.congThucId,
        xoa_luc: IsNull(),
        trang_thai: 'xuat_ban',
      },
    });

    if (!recipe) {
      throw new NotFoundException('Khong tim thay cong thuc hop le');
    }

    const normalizedUnit = this.normalizeUnit(detail.donVi);
    if (!['phan', 'khau_phan', 'serving'].includes(normalizedUnit)) {
      throw new BadRequestException(
        'Công thức chỉ hỗ trợ đơn vị khẩu phần, vui lòng dùng "phan" hoặc "khau_phan"',
      );
    }

    const servingCount =
      recipe.so_khau_phan && recipe.so_khau_phan > 0 ? recipe.so_khau_phan : 1;
    const ratio = detail.soLuong / servingCount;

    return {
      nguon_id: recipe.id,
      cong_thuc_id: recipe.id,
      thuc_pham_id: null,
      calories: Number(recipe.tong_calories || 0) * ratio,
      protein_g: Number(recipe.tong_protein_g || 0) * ratio,
      carb_g: Number(recipe.tong_carb_g || 0) * ratio,
      fat_g: Number(recipe.tong_fat_g || 0) * ratio,
      chat_xo_g: null,
      natri_mg: null,
      du_lieu_chup_lai: {
        loai_nguon: 'cong_thuc',
        ten: recipe.ten,
        so_khau_phan: servingCount,
        don_vi_nguoi_dung: detail.donVi.trim(),
      },
    };
  }

  private async recalculateNutritionSummary(
    manager: DataSource['manager'],
    userId: number,
    date: string,
  ) {
    const mealLogRepository = manager.getRepository(NhatKyBuaAnEntity);
    const detailRepository = manager.getRepository(ChiTietNhatKyBuaAnEntity);
    const summaryRepository = manager.getRepository(TongHopDinhDuongNgayEntity);

    const mealLogs = await mealLogRepository.find({
      where: { tai_khoan_id: userId, ngay_ghi: date },
      relations: ['chi_tiet'],
    });

    if (mealLogs.length === 0) {
      await summaryRepository.delete({ tai_khoan_id: userId, ngay: date });
      return;
    }

    let calories = 0;
    let protein = 0;
    let carb = 0;
    let fat = 0;

    for (const mealLog of mealLogs) {
      for (const detail of mealLog.chi_tiet ?? []) {
        calories += Number(detail.calories || 0);
        protein += Number(detail.protein_g || 0);
        carb += Number(detail.carb_g || 0);
        fat += Number(detail.fat_g || 0);
      }
    }

    const now = new Date();
    const existing = await summaryRepository.findOne({
      where: { tai_khoan_id: userId, ngay: date },
    });

    if (existing) {
      existing.tong_calories = calories.toFixed(2);
      existing.tong_protein_g = protein.toFixed(2);
      existing.tong_carb_g = carb.toFixed(2);
      existing.tong_fat_g = fat.toFixed(2);
      existing.so_bua_da_ghi = mealLogs.length;
      existing.cap_nhat_luc = now;
      await summaryRepository.save(existing);
      return;
    }

    await summaryRepository.save(
      summaryRepository.create({
        tai_khoan_id: userId,
        ngay: date,
        tong_calories: calories.toFixed(2),
        tong_protein_g: protein.toFixed(2),
        tong_carb_g: carb.toFixed(2),
        tong_fat_g: fat.toFixed(2),
        so_bua_da_ghi: mealLogs.length,
        tao_luc: now,
        cap_nhat_luc: now,
      }),
    );
  }

  private ensureDateNotFuture(date: string, label: string) {
    const normalized = new Date(`${date}T00:00:00`);
    if (Number.isNaN(normalized.getTime())) {
      throw new BadRequestException(`${label} không hợp lệ`);
    }

    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();

    if (normalized.getTime() > today) {
      throw new BadRequestException(`${label} không được ở tương lai`);
    }
  }

  private normalizeUnit(value: string | null | undefined) {
    const normalized = (value ?? '').trim().toLowerCase();
    if (normalized === 'gram' || normalized === 'grams') {
      return 'g';
    }
    if (normalized === 'ml') {
      return 'ml';
    }
    if (normalized === 'khẩu phần' || normalized === 'khau phan') {
      return 'khau_phan';
    }
    if (normalized === 'servings') {
      return 'serving';
    }
    return normalized;
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

  private toMealLogResponse(mealLog: NhatKyBuaAnEntity) {
    return {
      id: mealLog.id,
      tai_khoan_id: mealLog.tai_khoan_id,
      ngay_ghi: mealLog.ngay_ghi,
      loai_bua_an: mealLog.loai_bua_an,
      ghi_chu: mealLog.ghi_chu,
      chi_tiet:
        mealLog.chi_tiet?.map((detail) => ({
          id: detail.id,
          loai_nguon: detail.loai_nguon,
          nguon_id: detail.nguon_id,
          cong_thuc_id: detail.cong_thuc_id,
          thuc_pham_id: detail.thuc_pham_id,
          so_luong: Number(detail.so_luong),
          don_vi: detail.don_vi,
          calories: Number(detail.calories),
          protein_g: Number(detail.protein_g),
          carb_g: Number(detail.carb_g),
          fat_g: Number(detail.fat_g),
          chat_xo_g: detail.chat_xo_g ? Number(detail.chat_xo_g) : null,
          natri_mg: detail.natri_mg ? Number(detail.natri_mg) : null,
          du_lieu_chup_lai: detail.du_lieu_chup_lai,
        })) ?? [],
      tao_luc: mealLog.tao_luc,
      cap_nhat_luc: mealLog.cap_nhat_luc,
    };
  }

  private toSummaryResponse(summary: TongHopDinhDuongNgayEntity) {
    return {
      ngay: summary.ngay,
      tong_calories: Number(summary.tong_calories),
      tong_protein_g: Number(summary.tong_protein_g),
      tong_carb_g: Number(summary.tong_carb_g),
      tong_fat_g: Number(summary.tong_fat_g),
      so_bua_da_ghi: summary.so_bua_da_ghi,
      cap_nhat_luc: summary.cap_nhat_luc,
    };
  }
}
