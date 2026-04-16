import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TaiKhoanEntity } from '../../../Admin/User/entities/tai-khoan.entity';

export type UserMealType = 'bua_sang' | 'bua_trua' | 'bua_toi' | 'bua_phu';
export type UserMealPlanStatus =
  | 'ban_nhap'
  | 'dang_ap_dung'
  | 'hoan_thanh'
  | 'luu_tru';

@Entity({ name: 'ke_hoach_an' })
export class KeHoachAnEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'tai_khoan_id', type: 'bigint', unsigned: true })
  tai_khoan_id!: number;

  @ManyToOne(() => TaiKhoanEntity)
  @JoinColumn({ name: 'tai_khoan_id' })
  tai_khoan!: TaiKhoanEntity;

  @Column({ name: 'loai_nguon', type: 'varchar', length: 50 })
  loai_nguon!: string;

  @Column({ name: 'nguon_id', type: 'bigint', unsigned: true, nullable: true })
  nguon_id!: number | null;

  @Column({ name: 'tieu_de', type: 'varchar', length: 191 })
  tieu_de!: string;

  @Column({ type: 'text', nullable: true })
  mo_ta!: string | null;

  @Column({ name: 'ngay_ap_dung', type: 'date' })
  ngay_ap_dung!: string;

  @Column({
    name: 'trang_thai',
    type: 'enum',
    enum: ['ban_nhap', 'dang_ap_dung', 'hoan_thanh', 'luu_tru'],
    default: 'dang_ap_dung',
  })
  trang_thai!: UserMealPlanStatus;

  @Column({ name: 'tong_calories', type: 'decimal', precision: 10, scale: 2, nullable: true })
  tong_calories!: string | null;

  @Column({ name: 'tong_protein_g', type: 'decimal', precision: 10, scale: 2, nullable: true })
  tong_protein_g!: string | null;

  @Column({ name: 'tong_carb_g', type: 'decimal', precision: 10, scale: 2, nullable: true })
  tong_carb_g!: string | null;

  @Column({ name: 'tong_fat_g', type: 'decimal', precision: 10, scale: 2, nullable: true })
  tong_fat_g!: string | null;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;

  @OneToMany(() => ChiTietKeHoachAnEntity, (detail) => detail.ke_hoach_an)
  chi_tiet!: ChiTietKeHoachAnEntity[];
}

@Entity({ name: 'chi_tiet_ke_hoach_an' })
export class ChiTietKeHoachAnEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'ke_hoach_an_id', type: 'bigint', unsigned: true })
  ke_hoach_an_id!: number;

  @ManyToOne(() => KeHoachAnEntity, (plan) => plan.chi_tiet)
  @JoinColumn({ name: 'ke_hoach_an_id' })
  ke_hoach_an!: KeHoachAnEntity;

  @Column({
    name: 'loai_bua_an',
    type: 'enum',
    enum: ['bua_sang', 'bua_trua', 'bua_toi', 'bua_phu'],
  })
  loai_bua_an!: UserMealType;

  @Column({ name: 'cong_thuc_id', type: 'bigint', unsigned: true, nullable: true })
  cong_thuc_id!: number | null;

  @Column({ name: 'thuc_pham_id', type: 'bigint', unsigned: true, nullable: true })
  thuc_pham_id!: number | null;

  @Column({ name: 'so_luong', type: 'decimal', precision: 10, scale: 2, nullable: true })
  so_luong!: string | null;

  @Column({ name: 'don_vi', type: 'varchar', length: 50, nullable: true })
  don_vi!: string | null;

  @Column({ name: 'calories', type: 'decimal', precision: 10, scale: 2, nullable: true })
  calories!: string | null;

  @Column({ name: 'protein_g', type: 'decimal', precision: 10, scale: 2, nullable: true })
  protein_g!: string | null;

  @Column({ name: 'carb_g', type: 'decimal', precision: 10, scale: 2, nullable: true })
  carb_g!: string | null;

  @Column({ name: 'fat_g', type: 'decimal', precision: 10, scale: 2, nullable: true })
  fat_g!: string | null;

  @Column({ name: 'ghi_chu', type: 'varchar', length: 255, nullable: true })
  ghi_chu!: string | null;

  @Column({ name: 'thu_tu', type: 'int', unsigned: true, default: 1 })
  thu_tu!: number;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;
}
