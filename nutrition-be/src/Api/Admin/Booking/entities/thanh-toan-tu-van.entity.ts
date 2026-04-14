import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { LichHenEntity } from './lich-hen.entity';
import { TaiKhoanEntity } from '../../User/entities/tai-khoan.entity';

export type ThanhToanStatus = 'cho_thanh_toan' | 'dang_xu_ly' | 'thanh_cong' | 'that_bai' | 'da_hoan_tien';

export type PhuongThucThanhToan = 'vnpay' | 'chuyen_khoan' | 'vi_dien_tu' | 'thu_cong' | 'mien_phi';

@Entity({ name: 'thanh_toan_tu_van' })
export class ThanhToanTuVanEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'lich_hen_id', type: 'bigint', unsigned: true })
  lich_hen_id!: number;

  @ManyToOne(() => LichHenEntity)
  @JoinColumn({ name: 'lich_hen_id' })
  lich_hen!: LichHenEntity;

  @Column({ name: 'tai_khoan_id', type: 'bigint', unsigned: true })
  tai_khoan_id!: number;

  @ManyToOne(() => TaiKhoanEntity)
  @JoinColumn({ name: 'tai_khoan_id' })
  tai_khoan!: TaiKhoanEntity;

  @Column({ name: 'ma_giao_dich', type: 'varchar', length: 150 })
  ma_giao_dich!: string;

  @Column({
    type: 'enum',
    enum: ['vnpay', 'chuyen_khoan', 'vi_dien_tu', 'thu_cong', 'mien_phi'],
    default: 'vnpay',
  })
  phuong_thuc!: PhuongThucThanhToan;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  so_tien!: string;

  @Column({
    type: 'enum',
    enum: ['cho_thanh_toan', 'dang_xu_ly', 'thanh_cong', 'that_bai', 'da_hoan_tien'],
    default: 'cho_thanh_toan',
  })
  trang_thai!: ThanhToanStatus;

  @Column({ name: 'thanh_toan_luc', type: 'datetime', nullable: true })
  thanh_toan_luc!: Date | null;

  @Column({ name: 'du_lieu_thanh_toan', type: 'json', nullable: true })
  du_lieu_thanh_toan!: object | null;

  @Column({ name: 'xac_nhan_boi', type: 'bigint', unsigned: true, nullable: true })
  xac_nhan_boi!: number | null;

  @Column({ name: 'xac_nhan_luc', type: 'datetime', nullable: true })
  xac_nhan_luc!: Date | null;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;
}
