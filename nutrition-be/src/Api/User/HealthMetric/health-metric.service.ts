import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DataSource,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { HoSoEntity } from '../../Admin/User/entities/ho-so.entity';
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';
import { UserHealthAssessmentService } from '../HealthAssessment/health-assessment.service';
import { ChiSoSucKhoeEntity } from '../HealthAssessment/entities/chi-so-suc-khoe.entity';
import { CreateHealthMetricDto } from './dto/create-health-metric.dto';
import { HealthMetricsQueryDto } from './dto/health-metrics-query.dto';
import { UpdateHealthMetricDto } from './dto/update-health-metric.dto';

@Injectable()
export class UserHealthMetricService {
  constructor(
    @InjectRepository(TaiKhoanEntity)
    private readonly userRepository: Repository<TaiKhoanEntity>,
    @InjectRepository(HoSoEntity)
    private readonly profileRepository: Repository<HoSoEntity>,
    @InjectRepository(ChiSoSucKhoeEntity)
    private readonly healthMetricRepository: Repository<ChiSoSucKhoeEntity>,
    private readonly dataSource: DataSource,
    private readonly assessmentService: UserHealthAssessmentService,
  ) {}

  async getMetrics(userId: number | undefined, query: HealthMetricsQueryDto) {
    const user = await this.getActiveUser(userId);
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(50, query.limit ?? 10));

    const where: Record<string, unknown> = { tai_khoan_id: user.id };

    if (query.from && query.to) {
      const fromDate = new Date(query.from);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(query.to);
      toDate.setHours(23, 59, 59, 999);
      where.do_luc = Between(fromDate, toDate);
    } else if (query.from) {
      const fromDate = new Date(query.from);
      fromDate.setHours(0, 0, 0, 0);
      where.do_luc = MoreThanOrEqual(fromDate);
    } else if (query.to) {
      const toDate = new Date(query.to);
      toDate.setHours(23, 59, 59, 999);
      where.do_luc = LessThanOrEqual(toDate);
    }

    const [items, total] = await this.healthMetricRepository.findAndCount({
      where,
      order: { do_luc: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      success: true,
      message: 'Lấy lịch sử chỉ số sức khỏe thành công',
      data: {
        items: items.map((item) => this.toMetricResponse(item)),
        pagination: { page, limit, total },
      },
    };
  }

  async createMetric(userId: number | undefined, dto: CreateHealthMetricDto) {
    const user = await this.getActiveUser(userId);
    const savedMetric = await this.dataSource.transaction(async (manager) => {
      const profileRepository = manager.getRepository(HoSoEntity);
      const metricRepository = manager.getRepository(ChiSoSucKhoeEntity);
      const userRepository = manager.getRepository(TaiKhoanEntity);

      const managedUser = await userRepository.findOne({
        where: { id: user.id, xoa_luc: IsNull() },
      });

      const profile = await profileRepository.findOne({
        where: { tai_khoan_id: user.id },
      });

      if (!managedUser || managedUser.vai_tro !== 'nguoi_dung') {
        throw new UnauthorizedException('Khong tim thay nguoi dung hop le');
      }

      if (managedUser.trang_thai !== 'hoat_dong') {
        throw new ForbiddenException('Tai khoan khong o trang thai hoat dong');
      }

      if (!profile) {
        throw new NotFoundException('Khong tim thay ho so nguoi dung');
      }

      const now = new Date();
      const doLuc = dto.doLuc ? new Date(dto.doLuc) : now;
      this.validateMetricInput({
        doLuc,
        canNangKg: dto.canNangKg,
        chieuCaoCm: dto.chieuCaoCm,
        vongEoCm: dto.vongEoCm,
        vongMongCm: dto.vongMongCm,
        huyetApTamThu: dto.huyetApTamThu,
        huyetApTamTruong: dto.huyetApTamTruong,
        duongHuyet: dto.duongHuyet,
      });

      const metric = metricRepository.create({
        tai_khoan_id: user.id,
        do_luc: doLuc,
        can_nang_kg:
          dto.canNangKg !== undefined ? dto.canNangKg.toFixed(2) : null,
        chieu_cao_cm:
          dto.chieuCaoCm !== undefined ? dto.chieuCaoCm.toFixed(2) : null,
        vong_eo_cm: dto.vongEoCm !== undefined ? dto.vongEoCm.toFixed(2) : null,
        vong_mong_cm:
          dto.vongMongCm !== undefined ? dto.vongMongCm.toFixed(2) : null,
        huyet_ap_tam_thu: dto.huyetApTamThu ?? null,
        huyet_ap_tam_truong: dto.huyetApTamTruong ?? null,
        duong_huyet:
          dto.duongHuyet !== undefined ? dto.duongHuyet.toFixed(2) : null,
        ghi_chu: dto.ghiChu?.trim() || null,
        tao_luc: now,
        cap_nhat_luc: now,
      });

      const persistedMetric = await metricRepository.save(metric);
      await this.syncProfileWeight(
        user.id,
        profile,
        metricRepository,
        profileRepository,
      );
      await this.assessmentService.recalculateForUser(user.id, manager);

      return persistedMetric;
    });

    return {
      success: true,
      message: 'Lưu chỉ số sức khỏe thành công',
      data: this.toMetricResponse(savedMetric),
    };
  }

  async updateMetric(
    userId: number | undefined,
    metricId: number,
    dto: UpdateHealthMetricDto,
  ) {
    if (!Number.isFinite(metricId) || metricId <= 0) {
      throw new BadRequestException('ID chỉ số sức khỏe không hợp lệ');
    }

    const user = await this.getActiveUser(userId);
    const savedMetric = await this.dataSource.transaction(async (manager) => {
      const profileRepository = manager.getRepository(HoSoEntity);
      const metricRepository = manager.getRepository(ChiSoSucKhoeEntity);
      const userRepository = manager.getRepository(TaiKhoanEntity);

      const managedUser = await userRepository.findOne({
        where: { id: user.id, xoa_luc: IsNull() },
      });

      const profile = await profileRepository.findOne({
        where: { tai_khoan_id: user.id },
      });
      const metric = await metricRepository.findOne({
        where: { id: metricId, tai_khoan_id: user.id },
      });

      if (!managedUser || managedUser.vai_tro !== 'nguoi_dung') {
        throw new UnauthorizedException('Khong tim thay nguoi dung hop le');
      }

      if (managedUser.trang_thai !== 'hoat_dong') {
        throw new ForbiddenException('Tai khoan khong o trang thai hoat dong');
      }

      if (!profile) {
        throw new NotFoundException('Khong tim thay ho so nguoi dung');
      }

      if (!metric) {
        throw new NotFoundException('Khong tim thay chi so suc khoe');
      }

      const nextDoLuc =
        dto.doLuc !== undefined ? new Date(dto.doLuc) : metric.do_luc;
      const nextCanNangKg =
        dto.canNangKg !== undefined
          ? dto.canNangKg
          : metric.can_nang_kg !== null
            ? Number(metric.can_nang_kg)
            : undefined;
      const nextChieuCaoCm =
        dto.chieuCaoCm !== undefined
          ? dto.chieuCaoCm
          : metric.chieu_cao_cm !== null
            ? Number(metric.chieu_cao_cm)
            : undefined;
      const nextVongEoCm =
        dto.vongEoCm !== undefined
          ? dto.vongEoCm
          : metric.vong_eo_cm !== null
            ? Number(metric.vong_eo_cm)
            : undefined;
      const nextVongMongCm =
        dto.vongMongCm !== undefined
          ? dto.vongMongCm
          : metric.vong_mong_cm !== null
            ? Number(metric.vong_mong_cm)
            : undefined;
      const nextHuyetApTamThu =
        dto.huyetApTamThu !== undefined
          ? dto.huyetApTamThu
          : (metric.huyet_ap_tam_thu ?? undefined);
      const nextHuyetApTamTruong =
        dto.huyetApTamTruong !== undefined
          ? dto.huyetApTamTruong
          : (metric.huyet_ap_tam_truong ?? undefined);
      const nextDuongHuyet =
        dto.duongHuyet !== undefined
          ? dto.duongHuyet
          : metric.duong_huyet !== null
            ? Number(metric.duong_huyet)
            : undefined;

      this.validateMetricInput({
        doLuc: nextDoLuc,
        canNangKg: nextCanNangKg,
        chieuCaoCm: nextChieuCaoCm,
        vongEoCm: nextVongEoCm,
        vongMongCm: nextVongMongCm,
        huyetApTamThu: nextHuyetApTamThu,
        huyetApTamTruong: nextHuyetApTamTruong,
        duongHuyet: nextDuongHuyet,
      });

      if (dto.doLuc !== undefined) metric.do_luc = nextDoLuc;
      if (dto.canNangKg !== undefined) {
        metric.can_nang_kg = dto.canNangKg.toFixed(2);
      }
      if (dto.chieuCaoCm !== undefined) {
        metric.chieu_cao_cm = dto.chieuCaoCm.toFixed(2);
      }
      if (dto.vongEoCm !== undefined) {
        metric.vong_eo_cm = dto.vongEoCm.toFixed(2);
      }
      if (dto.vongMongCm !== undefined) {
        metric.vong_mong_cm = dto.vongMongCm.toFixed(2);
      }
      if (dto.huyetApTamThu !== undefined) {
        metric.huyet_ap_tam_thu = dto.huyetApTamThu;
      }
      if (dto.huyetApTamTruong !== undefined) {
        metric.huyet_ap_tam_truong = dto.huyetApTamTruong;
      }
      if (dto.duongHuyet !== undefined) {
        metric.duong_huyet = dto.duongHuyet.toFixed(2);
      }
      if (dto.ghiChu !== undefined) {
        metric.ghi_chu = dto.ghiChu?.trim() || null;
      }

      metric.cap_nhat_luc = new Date();
      const persistedMetric = await metricRepository.save(metric);

      await this.syncProfileWeight(
        user.id,
        profile,
        metricRepository,
        profileRepository,
      );
      await this.assessmentService.recalculateForUser(user.id, manager);

      return persistedMetric;
    });

    return {
      success: true,
      message: 'Cập nhật chỉ số sức khỏe thành công',
      data: this.toMetricResponse(savedMetric),
    };
  }

  private async syncProfileWeight(
    userId: number,
    profile: HoSoEntity,
    metricRepository: Repository<ChiSoSucKhoeEntity>,
    profileRepository: Repository<HoSoEntity>,
  ) {
    const latestMetric = await metricRepository.findOne({
      where: { tai_khoan_id: userId },
      order: { do_luc: 'DESC', id: 'DESC' },
    });

    if (!latestMetric?.can_nang_kg) {
      return;
    }

    if (profile.can_nang_hien_tai_kg === latestMetric.can_nang_kg) {
      return;
    }

    profile.can_nang_hien_tai_kg = latestMetric.can_nang_kg;
    profile.cap_nhat_luc = new Date();
    await profileRepository.save(profile);
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

  private validateMetricInput(input: {
    doLuc: Date;
    canNangKg?: number;
    chieuCaoCm?: number;
    vongEoCm?: number;
    vongMongCm?: number;
    huyetApTamThu?: number;
    huyetApTamTruong?: number;
    duongHuyet?: number;
  }) {
    if (Number.isNaN(input.doLuc.getTime())) {
      throw new BadRequestException('Thời điểm đo không hợp lệ');
    }

    if (input.doLuc.getTime() > Date.now()) {
      throw new BadRequestException(
        'Không được lưu chỉ số đo ở thời điểm tương lai',
      );
    }

    const hasAtLeastOneMetric = [
      input.canNangKg,
      input.chieuCaoCm,
      input.vongEoCm,
      input.vongMongCm,
      input.huyetApTamThu,
      input.huyetApTamTruong,
      input.duongHuyet,
    ].some((value) => value !== undefined && value !== null);

    if (!hasAtLeastOneMetric) {
      throw new BadRequestException(
        'Cần nhập ít nhất một chỉ số sức khỏe thực tế để lưu bản ghi',
      );
    }

    this.ensureRange('Cân nặng', input.canNangKg, 1, 500);
    this.ensureRange('Chiều cao', input.chieuCaoCm, 30, 300);
    this.ensureRange('Vòng eo', input.vongEoCm, 20, 300);
    this.ensureRange('Vòng mông', input.vongMongCm, 20, 300);
    this.ensureRange('Huyết áp tâm thu', input.huyetApTamThu, 50, 300);
    this.ensureRange('Huyết áp tâm trương', input.huyetApTamTruong, 30, 200);
    this.ensureRange('Đường huyết', input.duongHuyet, 20, 1000);

    if (
      input.huyetApTamThu !== undefined &&
      input.huyetApTamTruong !== undefined &&
      input.huyetApTamThu <= input.huyetApTamTruong
    ) {
      throw new BadRequestException(
        'Huyết áp tâm thu phải lớn hơn huyết áp tâm trương',
      );
    }
  }

  private ensureRange(
    label: string,
    value: number | undefined,
    min: number,
    max: number,
  ) {
    if (value === undefined || value === null) {
      return;
    }

    if (!Number.isFinite(value) || value < min || value > max) {
      throw new BadRequestException(
        `${label} phải nằm trong khoảng hợp lệ ${min}-${max}`,
      );
    }
  }

  private toMetricResponse(metric: ChiSoSucKhoeEntity) {
    return {
      id: metric.id,
      tai_khoan_id: metric.tai_khoan_id,
      do_luc: metric.do_luc,
      can_nang_kg: metric.can_nang_kg ? Number(metric.can_nang_kg) : null,
      chieu_cao_cm: metric.chieu_cao_cm ? Number(metric.chieu_cao_cm) : null,
      vong_eo_cm: metric.vong_eo_cm ? Number(metric.vong_eo_cm) : null,
      vong_mong_cm: metric.vong_mong_cm ? Number(metric.vong_mong_cm) : null,
      huyet_ap_tam_thu: metric.huyet_ap_tam_thu,
      huyet_ap_tam_truong: metric.huyet_ap_tam_truong,
      duong_huyet: metric.duong_huyet ? Number(metric.duong_huyet) : null,
      ghi_chu: metric.ghi_chu,
      tao_luc: metric.tao_luc,
      cap_nhat_luc: metric.cap_nhat_luc,
    };
  }
}
