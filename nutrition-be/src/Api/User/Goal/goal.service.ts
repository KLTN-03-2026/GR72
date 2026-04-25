import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { HoSoEntity } from '../../Admin/User/entities/ho-so.entity';
import { MucTieuEntity } from '../../Admin/User/entities/muc-tieu.entity';
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';
import { UserHealthAssessmentService } from '../HealthAssessment/health-assessment.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class UserGoalService {
  constructor(
    @InjectRepository(TaiKhoanEntity)
    private readonly userRepository: Repository<TaiKhoanEntity>,
    @InjectRepository(HoSoEntity)
    private readonly profileRepository: Repository<HoSoEntity>,
    @InjectRepository(MucTieuEntity)
    private readonly goalRepository: Repository<MucTieuEntity>,
    private readonly dataSource: DataSource,
    private readonly assessmentService: UserHealthAssessmentService,
  ) {}

  async getGoals(userId?: number) {
    const user = await this.getActiveUser(userId);
    const goals = await this.goalRepository.find({
      where: { tai_khoan_id: user.id },
      order: { cap_nhat_luc: 'DESC', id: 'DESC' },
    });

    return {
      success: true,
      message: 'Lấy danh sách mục tiêu thành công',
      data: {
        items: goals.map((goal) => this.toGoalResponse(goal)),
        total: goals.length,
      },
    };
  }

  async getCurrentGoal(userId?: number) {
    const user = await this.getActiveUser(userId);
    const goal = await this.goalRepository.findOne({
      where: { tai_khoan_id: user.id, trang_thai: 'dang_ap_dung' },
      order: { cap_nhat_luc: 'DESC', id: 'DESC' },
    });

    return {
      success: true,
      message: 'Lấy mục tiêu hiện tại thành công',
      data: goal ? this.toGoalResponse(goal) : null,
    };
  }

  async createGoal(userId: number | undefined, dto: CreateGoalDto) {
    const user = await this.getActiveUser(userId);
    const goal = await this.dataSource.transaction(async (manager) => {
      const profileRepository = manager.getRepository(HoSoEntity);
      const goalRepository = manager.getRepository(MucTieuEntity);

      const profile = await profileRepository.findOne({
        where: { tai_khoan_id: user.id },
      });

      const startWeight =
        dto.canNangBatDauKg ?? this.pickProfileWeight(profile);
      if (startWeight === null) {
        throw new BadRequestException(
          'Cần có cân nặng bắt đầu hoặc cân nặng hiện tại trong hồ sơ',
        );
      }

      const now = new Date();
      const ngayBatDau = dto.ngayBatDau ?? now.toISOString().slice(0, 10);
      const ngayMucTieu = dto.ngayMucTieu ?? null;

      this.assertValidGoalRange(ngayBatDau, ngayMucTieu);
      await this.assertNoOverlappingGoals(manager, user.id, {
        start: ngayBatDau,
        end: ngayMucTieu,
      });

      await goalRepository.update(
        { tai_khoan_id: user.id, trang_thai: 'dang_ap_dung' },
        { trang_thai: 'luu_tru', cap_nhat_luc: now },
      );

      const createdGoal = await goalRepository.save(
        goalRepository.create({
          tai_khoan_id: user.id,
          loai_muc_tieu: dto.loaiMucTieu,
          trang_thai: 'dang_ap_dung',
          can_nang_bat_dau_kg: startWeight.toFixed(2),
          can_nang_muc_tieu_kg:
            dto.canNangMucTieuKg !== undefined
              ? dto.canNangMucTieuKg.toFixed(2)
              : null,
          muc_tieu_calories_ngay:
            dto.mucTieuCaloriesNgay !== undefined
              ? dto.mucTieuCaloriesNgay.toFixed(2)
              : null,
          muc_tieu_protein_g:
            dto.mucTieuProteinG !== undefined
              ? dto.mucTieuProteinG.toFixed(2)
              : null,
          muc_tieu_carb_g:
            dto.mucTieuCarbG !== undefined ? dto.mucTieuCarbG.toFixed(2) : null,
          muc_tieu_fat_g:
            dto.mucTieuFatG !== undefined ? dto.mucTieuFatG.toFixed(2) : null,
          ngay_bat_dau: ngayBatDau,
          ngay_muc_tieu: ngayMucTieu,
          tao_luc: now,
          cap_nhat_luc: now,
        }),
      );

      await this.assessmentService.recalculateForUser(user.id, manager);
      return createdGoal;
    });

    return {
      success: true,
      message: 'Tạo mục tiêu thành công',
      data: this.toGoalResponse(goal),
    };
  }

  async updateGoal(
    userId: number | undefined,
    goalId: number,
    dto: UpdateGoalDto,
  ) {
    const user = await this.getActiveUser(userId);
    const savedGoal = await this.dataSource.transaction(async (manager) => {
      const goalRepository = manager.getRepository(MucTieuEntity);
      const goal = await goalRepository.findOne({
        where: { id: goalId, tai_khoan_id: user.id },
      });

      if (!goal) {
        throw new NotFoundException('Khong tim thay muc tieu');
      }

      if (
        dto.trangThai === 'dang_ap_dung' &&
        goal.trang_thai !== 'dang_ap_dung'
      ) {
        await goalRepository.update(
          { tai_khoan_id: user.id, trang_thai: 'dang_ap_dung' },
          { trang_thai: 'luu_tru', cap_nhat_luc: new Date() },
        );
      }

      const nextStart = dto.ngayBatDau ?? goal.ngay_bat_dau ?? null;
      const nextEnd = dto.ngayMucTieu ?? goal.ngay_muc_tieu ?? null;
      if (!nextStart) {
        throw new BadRequestException('Mục tiêu phải có ngày bắt đầu hợp lệ');
      }
      this.assertValidGoalRange(nextStart, nextEnd);
      await this.assertNoOverlappingGoals(
        manager,
        user.id,
        { start: nextStart, end: nextEnd },
        goal.id,
      );

      if (dto.loaiMucTieu !== undefined) goal.loai_muc_tieu = dto.loaiMucTieu;
      if (dto.trangThai !== undefined) goal.trang_thai = dto.trangThai;
      if (dto.canNangBatDauKg !== undefined) {
        goal.can_nang_bat_dau_kg = dto.canNangBatDauKg.toFixed(2);
      }
      if (dto.canNangMucTieuKg !== undefined) {
        goal.can_nang_muc_tieu_kg = dto.canNangMucTieuKg.toFixed(2);
      }
      if (dto.mucTieuCaloriesNgay !== undefined) {
        goal.muc_tieu_calories_ngay = dto.mucTieuCaloriesNgay.toFixed(2);
      }
      if (dto.mucTieuProteinG !== undefined) {
        goal.muc_tieu_protein_g = dto.mucTieuProteinG.toFixed(2);
      }
      if (dto.mucTieuCarbG !== undefined) {
        goal.muc_tieu_carb_g = dto.mucTieuCarbG.toFixed(2);
      }
      if (dto.mucTieuFatG !== undefined) {
        goal.muc_tieu_fat_g = dto.mucTieuFatG.toFixed(2);
      }
      if (dto.ngayBatDau !== undefined) goal.ngay_bat_dau = dto.ngayBatDau;
      if (dto.ngayMucTieu !== undefined) goal.ngay_muc_tieu = dto.ngayMucTieu;

      goal.cap_nhat_luc = new Date();
      const persistedGoal = await goalRepository.save(goal);
      await this.assessmentService.recalculateForUser(user.id, manager);
      return persistedGoal;
    });

    return {
      success: true,
      message: 'Cập nhật mục tiêu thành công',
      data: this.toGoalResponse(savedGoal),
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

  private pickProfileWeight(profile: HoSoEntity | null): number | null {
    if (!profile?.can_nang_hien_tai_kg) return null;
    const parsed = Number(profile.can_nang_hien_tai_kg);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private toGoalResponse(goal: MucTieuEntity) {
    return {
      id: goal.id,
      tai_khoan_id: goal.tai_khoan_id,
      loai_muc_tieu: goal.loai_muc_tieu,
      trang_thai: goal.trang_thai,
      can_nang_bat_dau_kg: goal.can_nang_bat_dau_kg
        ? Number(goal.can_nang_bat_dau_kg)
        : null,
      can_nang_muc_tieu_kg: goal.can_nang_muc_tieu_kg
        ? Number(goal.can_nang_muc_tieu_kg)
        : null,
      muc_tieu_calories_ngay: goal.muc_tieu_calories_ngay
        ? Number(goal.muc_tieu_calories_ngay)
        : null,
      muc_tieu_protein_g: goal.muc_tieu_protein_g
        ? Number(goal.muc_tieu_protein_g)
        : null,
      muc_tieu_carb_g: goal.muc_tieu_carb_g
        ? Number(goal.muc_tieu_carb_g)
        : null,
      muc_tieu_fat_g: goal.muc_tieu_fat_g ? Number(goal.muc_tieu_fat_g) : null,
      ngay_bat_dau: goal.ngay_bat_dau,
      ngay_muc_tieu: goal.ngay_muc_tieu,
      tao_luc: goal.tao_luc,
      cap_nhat_luc: goal.cap_nhat_luc,
    };
  }

  private assertValidGoalRange(start: string, end: string | null) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) {
      throw new BadRequestException('Ngày bắt đầu không hợp lệ');
    }
    if (end && !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
      throw new BadRequestException('Ngày mục tiêu không hợp lệ');
    }
    if (end && this.toDateNumber(start) > this.toDateNumber(end)) {
      throw new BadRequestException(
        'Ngày mục tiêu phải lớn hơn hoặc bằng ngày bắt đầu',
      );
    }
  }

  private async assertNoOverlappingGoals(
    manager: DataSource['manager'],
    userId: number,
    range: { start: string; end: string | null },
    ignoreGoalId?: number,
  ) {
    const goalRepository = manager.getRepository(MucTieuEntity);
    const goals = await goalRepository.find({
      where: { tai_khoan_id: userId },
      select: ['id', 'ngay_bat_dau', 'ngay_muc_tieu'],
    });

    const nextStart = range.start;
    const nextEnd = range.end ?? '9999-12-31';

    for (const goal of goals) {
      if (ignoreGoalId && goal.id === ignoreGoalId) continue;
      const currentStart = goal.ngay_bat_dau ?? '0001-01-01';
      const currentEnd = goal.ngay_muc_tieu ?? '9999-12-31';
      const hasOverlap =
        this.toDateNumber(nextStart) <= this.toDateNumber(currentEnd) &&
        this.toDateNumber(currentStart) <= this.toDateNumber(nextEnd);
      if (hasOverlap) {
        throw new BadRequestException(
          'Khoảng thời gian mục tiêu bị trùng với mục tiêu khác. Vui lòng chọn khoảng ngày không giao nhau.',
        );
      }
    }
  }

  private toDateNumber(value: string) {
    const [year, month, day] = value.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  }
}
