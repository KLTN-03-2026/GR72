import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TaiKhoanEntity } from '../../../Admin/User/entities/tai-khoan.entity';
import type { UserMealType } from '../../MealPlan/entities/ke-hoach-an.entity';

@Entity({ name: 'nhat_ky_bua_an' })
export class NhatKyBuaAnEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'tai_khoan_id', type: 'bigint', unsigned: true })
  tai_khoan_id!: number;

  @ManyToOne(() => TaiKhoanEntity)
  @JoinColumn({ name: 'tai_khoan_id' })
  tai_khoan!: TaiKhoanEntity;

  @Column({ name: 'ngay_ghi', type: 'date' })
  ngay_ghi!: string;

  @Column({
    name: 'loai_bua_an',
    type: 'enum',
    enum: ['bua_sang', 'bua_trua', 'bua_toi', 'bua_phu'],
  })
  loai_bua_an!: UserMealType;

  @Column({ name: 'ghi_chu', type: 'text', nullable: true })
  ghi_chu!: string | null;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;

  @OneToMany(() => ChiTietNhatKyBuaAnEntity, (detail) => detail.nhat_ky_bua_an)
  chi_tiet!: ChiTietNhatKyBuaAnEntity[];
}

@Entity({ name: 'chi_tiet_nhat_ky_bua_an' })
export class ChiTietNhatKyBuaAnEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'nhat_ky_bua_an_id', type: 'bigint', unsigned: true })
  nhat_ky_bua_an_id!: number;

  @ManyToOne(() => NhatKyBuaAnEntity, (mealLog) => mealLog.chi_tiet)
  @JoinColumn({ name: 'nhat_ky_bua_an_id' })
  nhat_ky_bua_an!: NhatKyBuaAnEntity;

  @Column({ name: 'loai_nguon', type: 'varchar', length: 50 })
  loai_nguon!: string;

  @Column({ name: 'nguon_id', type: 'bigint', unsigned: true, nullable: true })
  nguon_id!: number | null;

  @Column({
    name: 'cong_thuc_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  cong_thuc_id!: number | null;

  @Column({
    name: 'thuc_pham_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  thuc_pham_id!: number | null;

  @Column({ name: 'so_luong', type: 'decimal', precision: 10, scale: 2 })
  so_luong!: string;

  @Column({ name: 'don_vi', type: 'varchar', length: 50 })
  don_vi!: string;

  @Column({ name: 'calories', type: 'decimal', precision: 10, scale: 2 })
  calories!: string;

  @Column({
    name: 'protein_g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  protein_g!: string;

  @Column({
    name: 'carb_g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  carb_g!: string;

  @Column({
    name: 'fat_g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  fat_g!: string;

  @Column({
    name: 'chat_xo_g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  chat_xo_g!: string | null;

  @Column({
    name: 'natri_mg',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  natri_mg!: string | null;

  @Column({ name: 'du_lieu_chup_lai', type: 'json', nullable: true })
  du_lieu_chup_lai!: Record<string, unknown> | null;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;
}

@Entity({ name: 'tong_hop_dinh_duong_ngay' })
export class TongHopDinhDuongNgayEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'tai_khoan_id', type: 'bigint', unsigned: true })
  tai_khoan_id!: number;

  @Column({ name: 'ngay', type: 'date' })
  ngay!: string;

  @Column({
    name: 'tong_calories',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  tong_calories!: string;

  @Column({
    name: 'tong_protein_g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  tong_protein_g!: string;

  @Column({
    name: 'tong_carb_g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  tong_carb_g!: string;

  @Column({
    name: 'tong_fat_g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  tong_fat_g!: string;

  @Column({
    name: 'so_bua_da_ghi',
    type: 'smallint',
    unsigned: true,
    default: 0,
  })
  so_bua_da_ghi!: number;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;
}
