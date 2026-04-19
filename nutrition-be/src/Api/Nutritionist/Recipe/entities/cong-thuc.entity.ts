import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TaiKhoanEntity } from '../../../Admin/User/entities/tai-khoan.entity';

export type RecipeStatus = 'ban_nhap' | 'xuat_ban' | 'luu_tru';

@Entity({ name: 'cong_thuc' })
export class CongThucEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'tao_boi', type: 'bigint', unsigned: true })
  tao_boi!: number;

  @ManyToOne(() => TaiKhoanEntity)
  @JoinColumn({ name: 'tao_boi' })
  nguoi_tao!: TaiKhoanEntity;

  @Column({ type: 'varchar', length: 191 })
  ten!: string;

  @Column({ type: 'varchar', length: 220, unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  mo_ta!: string | null;

  @Column({ type: 'longtext', nullable: true })
  huong_dan!: string | null;

  @Column({ name: 'so_khau_phan', type: 'int', unsigned: true, nullable: true })
  so_khau_phan!: number | null;

  @Column({
    name: 'tong_calories',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  tong_calories!: number | null;

  @Column({
    name: 'tong_protein_g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  tong_protein_g!: number | null;

  @Column({
    name: 'tong_carb_g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  tong_carb_g!: number | null;

  @Column({
    name: 'tong_fat_g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  tong_fat_g!: number | null;

  @Column({
    name: 'trang_thai',
    type: 'enum',
    enum: ['ban_nhap', 'xuat_ban', 'luu_tru'],
    default: 'ban_nhap',
  })
  trang_thai!: RecipeStatus;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;

  @Column({ name: 'xoa_luc', type: 'datetime', nullable: true })
  xoa_luc!: Date | null;

  @OneToMany(() => ThanhPhanCongThucEntity, (tp) => tp.cong_thuc)
  thanh_phan!: ThanhPhanCongThucEntity[];
}

@Entity({ name: 'thanh_phan_cong_thuc' })
export class ThanhPhanCongThucEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'cong_thuc_id', type: 'bigint', unsigned: true })
  cong_thuc_id!: number;

  @ManyToOne(() => CongThucEntity, (ct) => ct.thanh_phan)
  @JoinColumn({ name: 'cong_thuc_id' })
  cong_thuc!: CongThucEntity;

  @Column({ name: 'thuc_pham_id', type: 'bigint', unsigned: true })
  thuc_pham_id!: number;

  @Column({ name: 'so_luong', type: 'decimal', precision: 10, scale: 2 })
  so_luong!: number;

  @Column({ name: 'don_vi', type: 'varchar', length: 50 })
  don_vi!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  calories!: number | null;

  @Column({
    name: 'protein_g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  protein_g!: number | null;

  @Column({
    name: 'carb_g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  carb_g!: number | null;

  @Column({
    name: 'fat_g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  fat_g!: number | null;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;
}
