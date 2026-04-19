import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GoiDichVuEntity } from '../../Package/entities/goi-dich-vu.entity';
import { DangKyGoiDichVuEntity } from '../../Subscription/entities/dang-ky-goi-dich-vu.entity';
import { TaiKhoanEntity } from '../../User/entities/tai-khoan.entity';

export type PaymentMethod =
  | 'chuyen_khoan'
  | 'vi_dien_tu'
  | 'cong_thanh_toan'
  | 'thu_cong'
  | 'mien_phi';
export type PaymentStatus =
  | 'cho_thanh_toan'
  | 'thanh_cong'
  | 'that_bai'
  | 'da_hoan_tien';

@Entity({ name: 'thanh_toan_goi_dich_vu' })
export class ThanhToanGoiDichVuEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'tai_khoan_id', type: 'bigint', unsigned: true })
  tai_khoan_id!: number;

  @ManyToOne(() => TaiKhoanEntity)
  @JoinColumn({ name: 'tai_khoan_id' })
  tai_khoan!: TaiKhoanEntity;

  @Column({ name: 'dang_ky_goi_dich_vu_id', type: 'bigint', unsigned: true })
  dang_ky_goi_dich_vu_id!: number;

  @ManyToOne(() => DangKyGoiDichVuEntity)
  @JoinColumn({ name: 'dang_ky_goi_dich_vu_id' })
  dang_ky_goi_dich_vu!: DangKyGoiDichVuEntity;

  @Column({ name: 'goi_dich_vu_id', type: 'bigint', unsigned: true })
  goi_dich_vu_id!: number;

  @ManyToOne(() => GoiDichVuEntity)
  @JoinColumn({ name: 'goi_dich_vu_id' })
  goi_dich_vu!: GoiDichVuEntity;

  @Column({ name: 'ma_giao_dich', type: 'varchar', length: 150, unique: true })
  ma_giao_dich!: string;

  @Column({
    name: 'phuong_thuc_thanh_toan',
    type: 'enum',
    enum: [
      'chuyen_khoan',
      'vi_dien_tu',
      'cong_thanh_toan',
      'thu_cong',
      'mien_phi',
    ],
    default: 'cong_thanh_toan',
  })
  phuong_thuc_thanh_toan!: PaymentMethod;

  @Column({ name: 'so_tien', type: 'decimal', precision: 12, scale: 2 })
  so_tien!: number;

  @Column({
    name: 'trang_thai',
    type: 'enum',
    enum: ['cho_thanh_toan', 'thanh_cong', 'that_bai', 'da_hoan_tien'],
    default: 'cho_thanh_toan',
  })
  trang_thai!: PaymentStatus;

  @Column({ name: 'thanh_toan_luc', type: 'datetime', nullable: true })
  thanh_toan_luc!: Date | null;

  @Column({
    name: 'noi_dung_thanh_toan',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  noi_dung_thanh_toan!: string | null;

  @Column({ name: 'du_lieu_thanh_toan', type: 'json', nullable: true })
  du_lieu_thanh_toan!: Record<string, unknown> | null;

  @Column({
    name: 'xac_nhan_boi',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  xac_nhan_boi!: number | null;

  @ManyToOne(() => TaiKhoanEntity)
  @JoinColumn({ name: 'xac_nhan_boi' })
  nguoi_xac_nhan!: TaiKhoanEntity | null;

  @Column({ name: 'xac_nhan_luc', type: 'datetime', nullable: true })
  xac_nhan_luc!: Date | null;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;
}
