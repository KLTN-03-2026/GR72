import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TaiKhoanEntity } from '../../../Admin/User/entities/tai-khoan.entity';
import { KeHoachAnEntity } from '../../MealPlan/entities/ke-hoach-an.entity';

export type RecommendationStatus =
  | 'cho_xu_ly'
  | 'da_chap_nhan'
  | 'tu_choi'
  | 'da_ap_dung';

@Entity({ name: 'phien_tu_van_ai' })
export class PhienTuVanAiEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'tai_khoan_id', type: 'bigint', unsigned: true })
  tai_khoan_id!: number;

  @ManyToOne(() => TaiKhoanEntity)
  @JoinColumn({ name: 'tai_khoan_id' })
  tai_khoan!: TaiKhoanEntity;

  @Column({ name: 'tieu_de', type: 'varchar', length: 191, nullable: true })
  tieu_de!: string | null;

  @Column({
    name: 'trang_thai',
    type: 'enum',
    enum: ['dang_mo', 'da_dong'],
    default: 'dang_mo',
  })
  trang_thai!: 'dang_mo' | 'da_dong';

  @Column({ name: 'tin_nhan', type: 'longtext', nullable: true })
  tin_nhan!: string | null;

  @Column({ name: 'ngu_canh_chup_lai', type: 'json', nullable: true })
  ngu_canh_chup_lai!: Record<string, unknown> | null;

  @Column({
    name: 'mo_hinh_cuoi',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  mo_hinh_cuoi!: string | null;

  @Column({
    name: 'tong_token_cuoi',
    type: 'int',
    unsigned: true,
    nullable: true,
  })
  tong_token_cuoi!: number | null;

  @Column({ name: 'loi_cuoi', type: 'text', nullable: true })
  loi_cuoi!: string | null;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;
}

@Entity({ name: 'khuyen_nghi_ai' })
export class KhuyenNghiAiEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'tai_khoan_id', type: 'bigint', unsigned: true })
  tai_khoan_id!: number;

  @ManyToOne(() => TaiKhoanEntity)
  @JoinColumn({ name: 'tai_khoan_id' })
  tai_khoan!: TaiKhoanEntity;

  @Column({
    name: 'phien_tu_van_ai_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  phien_tu_van_ai_id!: number | null;

  @ManyToOne(() => PhienTuVanAiEntity)
  @JoinColumn({ name: 'phien_tu_van_ai_id' })
  phien_tu_van_ai!: PhienTuVanAiEntity | null;

  @Column({
    name: 'trang_thai',
    type: 'enum',
    enum: ['cho_xu_ly', 'da_chap_nhan', 'tu_choi', 'da_ap_dung'],
    default: 'cho_xu_ly',
  })
  trang_thai!: RecommendationStatus;

  @Column({ name: 'loai_khuyen_nghi', type: 'varchar', length: 50 })
  loai_khuyen_nghi!: string;

  @Column({ name: 'ngay_muc_tieu', type: 'date', nullable: true })
  ngay_muc_tieu!: string | null;

  @Column({
    name: 'muc_tieu_calories',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  muc_tieu_calories!: string | null;

  @Column({
    name: 'muc_tieu_protein_g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  muc_tieu_protein_g!: string | null;

  @Column({
    name: 'muc_tieu_carb_g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  muc_tieu_carb_g!: string | null;

  @Column({
    name: 'muc_tieu_fat_g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  muc_tieu_fat_g!: string | null;

  @Column({ name: 'canh_bao', type: 'json', nullable: true })
  canh_bao!: unknown[] | null;

  @Column({ name: 'ly_giai', type: 'text', nullable: true })
  ly_giai!: string | null;

  @Column({ name: 'du_lieu_khuyen_nghi', type: 'json' })
  du_lieu_khuyen_nghi!: Record<string, unknown>;

  @Column({
    name: 'ke_hoach_an_da_ap_dung_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  ke_hoach_an_da_ap_dung_id!: number | null;

  @ManyToOne(() => KeHoachAnEntity)
  @JoinColumn({ name: 'ke_hoach_an_da_ap_dung_id' })
  ke_hoach_an_da_ap_dung!: KeHoachAnEntity | null;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;
}
