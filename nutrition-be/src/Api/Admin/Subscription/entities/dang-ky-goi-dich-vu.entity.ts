import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GoiDichVuEntity } from '../../Package/entities/goi-dich-vu.entity';
import { TaiKhoanEntity } from '../../User/entities/tai-khoan.entity';

export type SubscriptionStatus = 'cho_kich_hoat' | 'dang_hoat_dong' | 'het_han' | 'da_huy';
export type SubscriptionSource = 'nguoi_dung_tu_nang_cap' | 'quan_tri_cap' | 'khuyen_mai';

@Entity({ name: 'dang_ky_goi_dich_vu' })
export class DangKyGoiDichVuEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'tai_khoan_id', type: 'bigint', unsigned: true })
  tai_khoan_id!: number;

  @ManyToOne(() => TaiKhoanEntity)
  @JoinColumn({ name: 'tai_khoan_id' })
  tai_khoan!: TaiKhoanEntity;

  @Column({ name: 'goi_dich_vu_id', type: 'bigint', unsigned: true })
  goi_dich_vu_id!: number;

  @ManyToOne(() => GoiDichVuEntity)
  @JoinColumn({ name: 'goi_dich_vu_id' })
  goi_dich_vu!: GoiDichVuEntity;

  @Column({ name: 'ma_dang_ky', type: 'varchar', length: 120, unique: true })
  ma_dang_ky!: string;

  @Column({
    name: 'trang_thai',
    type: 'enum',
    enum: ['cho_kich_hoat', 'dang_hoat_dong', 'het_han', 'da_huy'],
    default: 'cho_kich_hoat',
  })
  trang_thai!: SubscriptionStatus;

  @Column({ name: 'ngay_bat_dau', type: 'datetime', nullable: true })
  ngay_bat_dau!: Date | null;

  @Column({ name: 'ngay_het_han', type: 'datetime', nullable: true })
  ngay_het_han!: Date | null;

  @Column({ name: 'tu_dong_gia_han', type: 'tinyint', default: 0 })
  tu_dong_gia_han!: boolean;

  @Column({
    name: 'nguon_dang_ky',
    type: 'enum',
    enum: ['nguoi_dung_tu_nang_cap', 'quan_tri_cap', 'khuyen_mai'],
    default: 'nguoi_dung_tu_nang_cap',
  })
  nguon_dang_ky!: SubscriptionSource;

  @Column({ name: 'ghi_chu', type: 'text', nullable: true })
  ghi_chu!: string | null;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;
}
