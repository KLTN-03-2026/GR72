import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { UserRole, UserStatus } from '../user.types';
import { HoSoEntity } from './ho-so.entity';

@Entity({ name: 'tai_khoan' })
export class TaiKhoanEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id!: number;

  @Column({
    type: 'varchar',
    length: 191,
    unique: true,
  })
  email!: string;

  @Column({
    name: 'mat_khau_ma_hoa',
    type: 'varchar',
    length: 255,
  })
  mat_khau_ma_hoa!: string;

  @Column({
    name: 'vai_tro',
    type: 'enum',
    enum: ['nguoi_dung', 'chuyen_gia_dinh_duong', 'quan_tri'],
  })
  vai_tro!: UserRole;

  @Column({
    name: 'trang_thai',
    type: 'enum',
    enum: ['hoat_dong', 'khong_hoat_dong', 'bi_khoa'],
    default: 'hoat_dong',
  })
  trang_thai!: UserStatus;

  @Column({
    name: 'ho_ten',
    type: 'varchar',
    length: 150,
  })
  ho_ten!: string;

  @Column({
    name: 'ma_dat_lai_mat_khau',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  ma_dat_lai_mat_khau!: string | null;

  @Column({
    name: 'het_han_ma_dat_lai',
    type: 'datetime',
    nullable: true,
  })
  het_han_ma_dat_lai!: Date | null;

  @Column({
    name: 'dang_nhap_cuoi_luc',
    type: 'datetime',
    nullable: true,
  })
  dang_nhap_cuoi_luc!: Date | null;

  @Column({
    name: 'tao_luc',
    type: 'datetime',
  })
  tao_luc!: Date;

  @Column({
    name: 'cap_nhat_luc',
    type: 'datetime',
  })
  cap_nhat_luc!: Date;

  @Column({
    name: 'xoa_luc',
    type: 'datetime',
    nullable: true,
  })
  xoa_luc!: Date | null;

  @OneToOne(() => HoSoEntity, (hoSo) => hoSo.tai_khoan)
  ho_so!: HoSoEntity | null;
}
