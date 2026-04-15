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
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';
import { UserHealthAssessmentService } from '../HealthAssessment/health-assessment.service';
import { UpdateUserProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserProfileService {
  constructor(
    @InjectRepository(TaiKhoanEntity)
    private readonly userRepository: Repository<TaiKhoanEntity>,
    @InjectRepository(HoSoEntity)
    private readonly profileRepository: Repository<HoSoEntity>,
    private readonly dataSource: DataSource,
    private readonly assessmentService: UserHealthAssessmentService,
  ) {}

  async getProfile(userId?: number) {
    const user = await this.getActiveUser(userId);
    const profile = await this.profileRepository.findOne({
      where: { tai_khoan_id: user.id },
    });

    if (!profile) {
      throw new NotFoundException('Khong tim thay ho so nguoi dung');
    }

    return {
      success: true,
      message: 'Lấy hồ sơ thành công',
      data: this.toProfileResponse(user, profile),
    };
  }

  async updateProfile(userId: number | undefined, dto: UpdateUserProfileDto) {
    const user = await this.getActiveUser(userId);
    const savedProfile = await this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(TaiKhoanEntity);
      const profileRepository = manager.getRepository(HoSoEntity);
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

      if (dto.hoTen !== undefined) {
        const normalizedName = dto.hoTen.trim();
        if (!normalizedName) {
          throw new BadRequestException('Họ tên không được để trống');
        }
        managedUser.ho_ten = normalizedName;
        managedUser.cap_nhat_luc = new Date();
        await userRepository.save(managedUser);
      }

      if (dto.gioiTinh !== undefined) profile.gioi_tinh = dto.gioiTinh;
      if (dto.ngaySinh !== undefined) profile.ngay_sinh = dto.ngaySinh;
      if (dto.chieuCaoCm !== undefined) {
        profile.chieu_cao_cm = dto.chieuCaoCm.toFixed(2);
      }
      if (dto.canNangHienTaiKg !== undefined) {
        profile.can_nang_hien_tai_kg = dto.canNangHienTaiKg.toFixed(2);
      }
      if (dto.mucDoVanDong !== undefined) {
        profile.muc_do_van_dong = dto.mucDoVanDong;
      }
      if (dto.cheDoAnUuTien !== undefined) {
        profile.che_do_an_uu_tien = this.normalizeStringArray(
          dto.cheDoAnUuTien,
        );
      }
      if (dto.diUng !== undefined) {
        profile.di_ung = this.normalizeStringArray(dto.diUng);
      }
      if (dto.thucPhamKhongThich !== undefined) {
        profile.thuc_pham_khong_thich = this.normalizeStringArray(
          dto.thucPhamKhongThich,
        );
      }
      if (dto.anhDaiDienUrl !== undefined) {
        profile.anh_dai_dien_url = dto.anhDaiDienUrl;
      }

      profile.cap_nhat_luc = new Date();
      const persistedProfile = await profileRepository.save(profile);
      await this.assessmentService.recalculateForUser(user.id, manager);

      return {
        persistedProfile,
        persistedUser: managedUser,
      };
    });

    return {
      success: true,
      message: 'Cập nhật hồ sơ thành công',
      data: this.toProfileResponse(
        savedProfile.persistedUser,
        savedProfile.persistedProfile,
      ),
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

  private toProfileResponse(user: TaiKhoanEntity, profile: HoSoEntity) {
    return {
      tai_khoan_id: user.id,
      ho_ten: user.ho_ten,
      email: user.email,
      gioi_tinh: profile.gioi_tinh,
      ngay_sinh: profile.ngay_sinh,
      chieu_cao_cm: profile.chieu_cao_cm ? Number(profile.chieu_cao_cm) : null,
      can_nang_hien_tai_kg: profile.can_nang_hien_tai_kg
        ? Number(profile.can_nang_hien_tai_kg)
        : null,
      muc_do_van_dong: profile.muc_do_van_dong,
      che_do_an_uu_tien: profile.che_do_an_uu_tien ?? [],
      di_ung: profile.di_ung ?? [],
      thuc_pham_khong_thich: profile.thuc_pham_khong_thich ?? [],
      anh_dai_dien_url: profile.anh_dai_dien_url,
      cap_nhat_luc: profile.cap_nhat_luc,
    };
  }

  private normalizeStringArray(values: string[]) {
    const uniqueValues = Array.from(
      new Set(values.map((value) => value.trim()).filter(Boolean)),
    );

    return uniqueValues.length > 0 ? uniqueValues : [];
  }
}
