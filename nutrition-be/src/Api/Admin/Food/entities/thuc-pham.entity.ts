import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { FoodSourceType } from '../food.types';
import { NhomThucPhamEntity } from './nhom-thuc-pham.entity';

@Entity({ name: 'thuc_pham' })
export class ThucPhamEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id!: number;

  @Column({
    name: 'nhom_thuc_pham_id',
    type: 'bigint',
    unsigned: true,
  })
  nhom_thuc_pham_id!: number;

  @ManyToOne(() => NhomThucPhamEntity, { nullable: false })
  @JoinColumn({ name: 'nhom_thuc_pham_id' })
  nhom_thuc_pham!: NhomThucPhamEntity;

  @Column({
    type: 'varchar',
    length: 180,
  })
  ten!: string;

  @Column({
    type: 'varchar',
    length: 191,
    unique: true,
  })
  slug!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  mo_ta!: string | null;

  @Column({
    name: 'the_gan',
    type: 'json',
    nullable: true,
  })
  the_gan!: string[] | null;

  @Column({
    name: 'loai_nguon',
    type: 'varchar',
    length: 50,
    default: 'noi_bo',
  })
  loai_nguon!: FoodSourceType;

  @Column({
    name: 'ten_nguon',
    type: 'varchar',
    length: 180,
    nullable: true,
  })
  ten_nguon!: string | null;

  @Column({
    name: 'ma_nguon',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  ma_nguon!: string | null;

  @Column({
    name: 'khau_phan_tham_chieu',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 100,
  })
  khau_phan_tham_chieu!: string;

  @Column({
    name: 'don_vi_khau_phan',
    type: 'varchar',
    length: 50,
    default: 'g',
  })
  don_vi_khau_phan!: string;

  @Column({
    name: 'calories_100g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  calories_100g!: string;

  @Column({
    name: 'protein_100g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  protein_100g!: string;

  @Column({
    name: 'carb_100g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  carb_100g!: string;

  @Column({
    name: 'fat_100g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  fat_100g!: string;

  @Column({
    name: 'chat_xo_100g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  chat_xo_100g!: string;

  @Column({
    name: 'duong_100g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  duong_100g!: string;

  @Column({
    name: 'natri_100g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  natri_100g!: string;

  @Column({
    name: 'du_lieu_goc',
    type: 'json',
    nullable: true,
  })
  du_lieu_goc!: Record<string, unknown> | null;

  @Column({
    name: 'da_xac_minh',
    type: 'boolean',
    default: false,
  })
  da_xac_minh!: boolean;

  @Column({
    name: 'tao_boi',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  tao_boi!: number | null;

  @Column({
    name: 'cap_nhat_boi',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  cap_nhat_boi!: number | null;

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
}
