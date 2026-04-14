import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type PackageCycleType = 'thang' | 'quy' | 'nam' | 'tron_doi';
export type PackageStatus = 'ban_nhap' | 'dang_kinh_doanh' | 'ngung_kinh_doanh';

@Entity({ name: 'goi_dich_vu' })
export class GoiDichVuEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id!: number;

  @Column({
    name: 'ten_goi',
    type: 'varchar',
    length: 150,
  })
  ten_goi!: string;

  @Column({
    type: 'varchar',
    length: 180,
    unique: true,
  })
  slug!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  mo_ta!: string | null;

  @Column({
    name: 'gia_niem_yet',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  gia_niem_yet!: string;

  @Column({
    name: 'gia_khuyen_mai',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  gia_khuyen_mai!: string | null;

  @Column({
    name: 'thoi_han_ngay',
    type: 'int',
    unsigned: true,
    nullable: true,
  })
  thoi_han_ngay!: number | null;

  @Column({
    name: 'loai_chu_ky',
    type: 'enum',
    enum: ['thang', 'quy', 'nam', 'tron_doi'],
    default: 'thang',
  })
  loai_chu_ky!: PackageCycleType;

  @Column({
    name: 'trang_thai',
    type: 'enum',
    enum: ['ban_nhap', 'dang_kinh_doanh', 'ngung_kinh_doanh'],
    default: 'ban_nhap',
  })
  trang_thai!: PackageStatus;

  @Column({
    name: 'la_goi_mien_phi',
    type: 'tinyint',
    default: 0,
  })
  la_goi_mien_phi!: boolean;

  @Column({
    name: 'goi_noi_bat',
    type: 'tinyint',
    default: 0,
  })
  goi_noi_bat!: boolean;

  @Column({
    name: 'thu_tu_hien_thi',
    type: 'int',
    unsigned: true,
    default: 1,
  })
  thu_tu_hien_thi!: number;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;

  @Column({ name: 'xoa_luc', type: 'datetime', nullable: true })
  xoa_luc!: Date | null;
}
