import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TaiKhoanEntity } from './tai-khoan.entity';

export type LoaiMucTieu = 'giam_can' | 'tang_can' | 'giu_can';
export type TrangThaiMucTieu = 'dang_ap_dung' | 'luu_tru' | 'hoan_thanh';

@Entity({ name: 'muc_tieu' })
export class MucTieuEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id!: number;

  @Column({
    name: 'tai_khoan_id',
    type: 'bigint',
    unsigned: true,
  })
  tai_khoan_id!: number;

  @ManyToOne(() => TaiKhoanEntity)
  @JoinColumn({ name: 'tai_khoan_id' })
  tai_khoan!: TaiKhoanEntity;

  @Column({
    name: 'loai_muc_tieu',
    type: 'enum',
    enum: ['giam_can', 'tang_can', 'giu_can'],
  })
  loai_muc_tieu!: LoaiMucTieu;

  @Column({
    name: 'trang_thai',
    type: 'enum',
    enum: ['dang_ap_dung', 'luu_tru', 'hoan_thanh'],
    default: 'dang_ap_dung',
  })
  trang_thai!: TrangThaiMucTieu;

  @Column({
    name: 'can_nang_bat_dau_kg',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  can_nang_bat_dau_kg!: string | null;

  @Column({
    name: 'can_nang_muc_tieu_kg',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  can_nang_muc_tieu_kg!: string | null;

  @Column({
    name: 'muc_tieu_calories_ngay',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  muc_tieu_calories_ngay!: string | null;

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

  @Column({
    name: 'ngay_bat_dau',
    type: 'date',
    nullable: true,
  })
  ngay_bat_dau!: string | null;

  @Column({
    name: 'ngay_muc_tieu',
    type: 'date',
    nullable: true,
  })
  ngay_muc_tieu!: string | null;

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
}
