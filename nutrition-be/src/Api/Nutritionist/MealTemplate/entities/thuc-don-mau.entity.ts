import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TaiKhoanEntity } from '../../../Admin/User/entities/tai-khoan.entity';

export type MealTemplateStatus = 'ban_nhap' | 'xuat_ban' | 'luu_tru';
export type MealType = 'bua_sang' | 'bua_trua' | 'bua_toi' | 'bua_phu';
export type GoalType = 'giam_can' | 'tang_can' | 'giu_can';

@Entity({ name: 'thuc_don_mau' })
export class ThucDonMauEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'tao_boi', type: 'bigint', unsigned: true })
  tao_boi!: number;

  @ManyToOne(() => TaiKhoanEntity)
  @JoinColumn({ name: 'tao_boi' })
  nguoi_tao!: TaiKhoanEntity;

  @Column({ name: 'tieu_de', type: 'varchar', length: 191 })
  tieu_de!: string;

  @Column({ type: 'text', nullable: true })
  mo_ta!: string | null;

  @Column({
    name: 'loai_muc_tieu_phu_hop',
    type: 'enum',
    enum: ['giam_can', 'tang_can', 'giu_can'],
    nullable: true,
  })
  loai_muc_tieu_phu_hop!: GoalType | null;

  @Column({
    name: 'calories_muc_tieu',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  calories_muc_tieu!: number | null;

  @Column({
    name: 'trang_thai',
    type: 'enum',
    enum: ['ban_nhap', 'xuat_ban', 'luu_tru'],
    default: 'ban_nhap',
  })
  trang_thai!: MealTemplateStatus;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;

  @Column({ name: 'xoa_luc', type: 'datetime', nullable: true })
  xoa_luc!: Date | null;

  @OneToMany(() => ChiTietThucDonMauEntity, (ct) => ct.thuc_don_mau)
  chi_tiet!: ChiTietThucDonMauEntity[];
}

@Entity({ name: 'chi_tiet_thuc_don_mau' })
export class ChiTietThucDonMauEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'thuc_don_mau_id', type: 'bigint', unsigned: true })
  thuc_don_mau_id!: number;

  @ManyToOne(() => ThucDonMauEntity, (tdm) => tdm.chi_tiet)
  @JoinColumn({ name: 'thuc_don_mau_id' })
  thuc_don_mau!: ThucDonMauEntity;

  @Column({ name: 'ngay_so', type: 'int', unsigned: true, default: 1 })
  ngay_so!: number;

  @Column({
    name: 'loai_bua_an',
    type: 'enum',
    enum: ['bua_sang', 'bua_trua', 'bua_toi', 'bua_phu'],
  })
  loai_bua_an!: MealType;

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

  @Column({
    name: 'so_luong',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  so_luong!: number | null;

  @Column({ name: 'don_vi', type: 'varchar', length: 50, nullable: true })
  don_vi!: string | null;

  @Column({ name: 'ghi_chu', type: 'varchar', length: 255, nullable: true })
  ghi_chu!: string | null;

  @Column({ name: 'thu_tu', type: 'int', unsigned: true, default: 1 })
  thu_tu!: number;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;
}
