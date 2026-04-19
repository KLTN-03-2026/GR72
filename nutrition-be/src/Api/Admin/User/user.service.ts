import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import {
  DataSource,
  FindOptionsWhere,
  ILike,
  IsNull,
  Repository,
} from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ResetPasswordDto, UpdateUserDto } from './dto/update-user.dto';
import { HoSoEntity } from './entities/ho-so.entity';
import { UsersQueryDto } from './dto/users-query.dto';
import { TaiKhoanEntity } from './entities/tai-khoan.entity';
import {
  PublicUser,
  PublicUserDetail,
  UserRole,
  UserStatus,
} from './user.types';

type SuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

@Injectable()
export class UserService {
  private readonly saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

  constructor(
    @InjectRepository(TaiKhoanEntity)
    private readonly userRepository: Repository<TaiKhoanEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateUserDto): Promise<SuccessResponse<PublicUser>> {
    const email = dto.email.trim().toLowerCase();
    await this.ensureEmailNotTaken(email);
    const now = new Date();
    const password = dto.password?.trim();
    if (!password || password.length < 8) {
      throw new BadRequestException('Mật khẩu phải có ít nhất 8 ký tự');
    }
    const passwordHash = await this.hashPassword(password);

    const savedUser = await this.dataSource.transaction(async (manager) => {
      const user = manager.create(TaiKhoanEntity, {
        email,
        mat_khau_ma_hoa: passwordHash,
        vai_tro: dto.vaiTro as UserRole,
        trang_thai: dto.trangThai as UserStatus,
        ho_ten: dto.hoTen.trim(),
        ma_dat_lai_mat_khau: null,
        het_han_ma_dat_lai: null,
        dang_nhap_cuoi_luc: null,
        tao_luc: now,
        cap_nhat_luc: now,
        xoa_luc: null,
      });

      const insertedUser = await manager.save(TaiKhoanEntity, user);

      const profile = manager.create(HoSoEntity, {
        tai_khoan_id: insertedUser.id,
        gioi_tinh: null,
        ngay_sinh: null,
        chieu_cao_cm: null,
        can_nang_hien_tai_kg: null,
        muc_do_van_dong: null,
        che_do_an_uu_tien: null,
        di_ung: null,
        thuc_pham_khong_thich: null,
        anh_dai_dien_url: null,
        tao_luc: now,
        cap_nhat_luc: now,
      });

      await manager.save(HoSoEntity, profile);

      return insertedUser;
    });

    return {
      success: true,
      message: 'Tao nguoi dung thanh cong',
      data: this.toPublicUser(savedUser),
    };
  }

  async findAll(query: UsersQueryDto): Promise<
    SuccessResponse<{
      items: PublicUser[];
      pagination: { page: number; limit: number; total: number };
    }>
  > {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const baseWhere: FindOptionsWhere<TaiKhoanEntity> = {
      xoa_luc: IsNull(),
    };

    if (!query.keyword) {
      if (query.vaiTro) {
        baseWhere.vai_tro = query.vaiTro as UserRole;
      }
      if (query.trangThai) {
        baseWhere.trang_thai = query.trangThai as UserStatus;
      }

      const [items, total] = await this.userRepository.findAndCount({
        where: baseWhere,
        order: { id: 'DESC' },
        skip,
        take: limit,
      });

      return {
        success: true,
        message: 'Lay danh sach nguoi dung thanh cong',
        data: {
          items: items.map((item) => this.toPublicUser(item)),
          pagination: { page, limit, total },
        },
      };
    }

    const keyword = query.keyword.trim();
    const where: FindOptionsWhere<TaiKhoanEntity>[] = [
      { ...baseWhere, ho_ten: ILike(`%${keyword}%`) },
      { ...baseWhere, email: ILike(`%${keyword}%`) },
    ];

    if (query.vaiTro) {
      where.forEach((item) => {
        item.vai_tro = query.vaiTro as UserRole;
      });
    }

    if (query.trangThai) {
      where.forEach((item) => {
        item.trang_thai = query.trangThai as UserStatus;
      });
    }

    const [items, total] = await this.userRepository.findAndCount({
      where,
      order: { id: 'DESC' },
      skip,
      take: limit,
    });

    return {
      success: true,
      message: 'Lay danh sach nguoi dung thanh cong',
      data: {
        items: items.map((item) => this.toPublicUser(item)),
        pagination: { page, limit, total },
      },
    };
  }

  // Fix #2: GET /:id giờ join ho_so để hiển thị thông tin mở rộng theo spec
  async findOne(id: number): Promise<SuccessResponse<PublicUserDetail>> {
    const user = await this.userRepository.findOne({
      where: {
        id,
        xoa_luc: IsNull(),
      },
      relations: ['ho_so'],
    });

    if (!user) {
      throw new NotFoundException('Nguoi dung khong ton tai');
    }

    return {
      success: true,
      message: 'Lay chi tiet nguoi dung thanh cong',
      data: this.toPublicUserDetail(user),
    };
  }

  // Fix #1: PATCH /:id chỉ cho sửa hoTen và email, không sửa vaiTro/trangThai
  async update(
    id: number,
    dto: UpdateUserDto,
  ): Promise<SuccessResponse<PublicUser>> {
    const user = await this.findUserById(id);

    if (dto.hoTen !== undefined) {
      user.ho_ten = dto.hoTen.trim();
    }

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      await this.ensureEmailNotTaken(email, id);
      user.email = email;
    }

    user.cap_nhat_luc = new Date();

    const savedUser = await this.userRepository.save(user);

    return {
      success: true,
      message: 'Cap nhat nguoi dung thanh cong',
      data: this.toPublicUser(savedUser),
    };
  }

  async remove(id: number): Promise<SuccessResponse<{ id: number }>> {
    const user = await this.findUserById(id);

    user.xoa_luc = new Date();
    user.cap_nhat_luc = new Date();
    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Xoa mem nguoi dung thanh cong',
      data: { id },
    };
  }

  async updateStatus(
    id: number,
    dto: UpdateStatusDto,
  ): Promise<SuccessResponse<{ id: number; trang_thai: UserStatus }>> {
    const user = await this.findUserById(id);

    user.trang_thai = dto.trangThai as UserStatus;
    user.cap_nhat_luc = new Date();
    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Cap nhat trang thai thanh cong',
      data: { id, trang_thai: user.trang_thai },
    };
  }

  async resetPassword(
    id: number,
    dto: ResetPasswordDto,
  ): Promise<SuccessResponse<{ id: number }>> {
    const user = await this.findUserById(id);

    user.mat_khau_ma_hoa = await this.hashPassword(dto.newPassword.trim());
    user.ma_dat_lai_mat_khau = null;
    user.het_han_ma_dat_lai = null;
    user.cap_nhat_luc = new Date();
    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Reset mat khau thanh cong',
      data: { id },
    };
  }

  private async findUserById(id: number): Promise<TaiKhoanEntity> {
    const user = await this.userRepository.findOne({
      where: {
        id,
        xoa_luc: IsNull(),
      },
    });

    if (!user) {
      throw new NotFoundException('Nguoi dung khong ton tai');
    }

    return user;
  }

  private async ensureEmailNotTaken(
    email: string,
    excludeId?: number,
  ): Promise<void> {
    const existedUser = await this.userRepository.findOne({
      where: {
        email,
        xoa_luc: IsNull(),
      },
    });

    if (existedUser && existedUser.id !== excludeId) {
      throw new BadRequestException('Email da ton tai');
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return hash(password, this.saltRounds);
  }

  private toPublicUser(user: TaiKhoanEntity): PublicUser {
    return {
      id: user.id,
      email: user.email,
      vai_tro: user.vai_tro,
      trang_thai: user.trang_thai,
      ho_ten: user.ho_ten,
      dang_nhap_cuoi_luc: user.dang_nhap_cuoi_luc?.toISOString() ?? null,
      tao_luc: user.tao_luc.toISOString(),
      cap_nhat_luc: user.cap_nhat_luc.toISOString(),
    };
  }

  // Fix #2: Thêm mapper cho chi tiết kèm hồ sơ
  private toPublicUserDetail(user: TaiKhoanEntity): PublicUserDetail {
    return {
      ...this.toPublicUser(user),
      ho_so: user.ho_so
        ? {
            gioi_tinh: user.ho_so.gioi_tinh,
            ngay_sinh: user.ho_so.ngay_sinh,
            chieu_cao_cm: user.ho_so.chieu_cao_cm
              ? Number(user.ho_so.chieu_cao_cm)
              : null,
            can_nang_hien_tai_kg: user.ho_so.can_nang_hien_tai_kg
              ? Number(user.ho_so.can_nang_hien_tai_kg)
              : null,
            muc_do_van_dong: user.ho_so.muc_do_van_dong,
            che_do_an_uu_tien: user.ho_so.che_do_an_uu_tien,
            di_ung: user.ho_so.di_ung,
            thuc_pham_khong_thich: user.ho_so.thuc_pham_khong_thich,
            anh_dai_dien_url: user.ho_so.anh_dai_dien_url,
          }
        : null,
    };
  }
}
