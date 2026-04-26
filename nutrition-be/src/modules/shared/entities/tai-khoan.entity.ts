import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type AccountRole = 'customer' | 'expert' | 'admin';
export type AccountStatus = 'hoat_dong' | 'khong_hoat_dong' | 'bi_khoa';

@Entity({ name: 'tai_khoan' })
export class TaiKhoanEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ type: 'varchar', length: 191, unique: true })
  email!: string;

  @Column({ name: 'mat_khau_ma_hoa', type: 'varchar', length: 255 })
  mat_khau_ma_hoa!: string;

  @Index()
  @Column({
    name: 'vai_tro',
    type: 'enum',
    enum: ['customer', 'expert', 'admin'],
  })
  vai_tro!: AccountRole;

  @Index()
  @Column({
    name: 'trang_thai',
    type: 'enum',
    enum: ['hoat_dong', 'khong_hoat_dong', 'bi_khoa'],
    default: 'hoat_dong',
  })
  trang_thai!: AccountStatus;

  @Column({ name: 'ho_ten', type: 'varchar', length: 150 })
  ho_ten!: string;

  @Column({ name: 'so_dien_thoai', type: 'varchar', length: 30, nullable: true })
  so_dien_thoai!: string | null;

  @Column({
    name: 'ma_dat_lai_mat_khau',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  ma_dat_lai_mat_khau!: string | null;

  @Column({ name: 'het_han_ma_dat_lai', type: 'datetime', nullable: true })
  het_han_ma_dat_lai!: Date | null;

  @Column({ name: 'dang_nhap_cuoi_luc', type: 'datetime', nullable: true })
  dang_nhap_cuoi_luc!: Date | null;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;

  @Column({ name: 'xoa_luc', type: 'datetime', nullable: true })
  xoa_luc!: Date | null;
}

