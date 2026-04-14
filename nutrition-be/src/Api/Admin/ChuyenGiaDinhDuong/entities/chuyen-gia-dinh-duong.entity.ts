import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TaiKhoanEntity } from '../../User/entities/tai-khoan.entity';
import { GoiTuVanEntity } from './goi-tu-van.entity';
import { LichHenEntity } from '../../Booking/entities/lich-hen.entity';

export type ChuyenGiaStatus = 'cho_duyet' | 'tu_choi' | 'hoat_dong' | 'khong_hoat_dong' | 'bi_khoa';
export type RegistrationPaymentStatus = 'chua_thanh_toan' | 'dang_cho_thanh_toan' | 'thanh_cong' | 'that_bai' | 'da_hoan';

@Entity({ name: 'chuyen_gia_dinh_duong' })
export class ChuyenGiaDinhDuongEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'tai_khoan_id', type: 'bigint', unsigned: true })
  tai_khoan_id!: number;

  @OneToOne(() => TaiKhoanEntity)
  @JoinColumn({ name: 'tai_khoan_id' })
  tai_khoan!: TaiKhoanEntity;

  @Column({ type: 'text', nullable: true })
  chuyen_mon!: string | null;

  @Column({ type: 'text', nullable: true })
  mo_ta!: string | null;

  @Column({ type: 'text', nullable: true })
  kinh_nghiem!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  hoc_vi!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  chung_chi!: string | null;

  @Column({ name: 'gio_lam_viec', type: 'varchar', length: 255, nullable: true })
  gio_lam_viec!: string | null;

  @Column({ name: 'anh_dai_dien_url', type: 'varchar', length: 255, nullable: true })
  anh_dai_dien_url!: string | null;

  @Column({
    type: 'enum',
    enum: ['cho_duyet', 'tu_choi', 'hoat_dong', 'khong_hoat_dong', 'bi_khoa'],
    default: 'cho_duyet',
  })
  trang_thai!: ChuyenGiaStatus;

  @Column({
    name: 'trang_thai_thanh_toan',
    type: 'enum',
    enum: ['chua_thanh_toan', 'dang_cho_thanh_toan', 'thanh_cong', 'that_bai', 'da_hoan'],
    default: 'chua_thanh_toan',
  })
  trang_thai_thanh_toan!: RegistrationPaymentStatus;

  @Column({ name: 'vnp_txn_ref', type: 'varchar', length: 100, nullable: true })
  vnp_txn_ref!: string | null;

  @Column({ name: 'vnp_transaction_no', type: 'varchar', length: 100, nullable: true })
  vnp_transaction_no!: string | null;

  @Column({ name: 'ngay_thanh_toan', type: 'datetime', nullable: true })
  ngay_thanh_toan!: Date | null;

  @Column({ name: 'lan_thanh_toan', type: 'int', unsigned: true, default: 0 })
  lan_thanh_toan!: number;

  @Column({ name: 'ly_do_tu_choi', type: 'text', nullable: true })
  ly_do_tu_choi!: string | null;

  @Column({ name: 'ly_do_bi_khoa', type: 'text', nullable: true })
  ly_do_bi_khoa!: string | null;

  @Column({ name: 'ngay_duyet', type: 'datetime', nullable: true })
  ngay_duyet!: Date | null;

  @Column({ name: 'ngay_bi_khoa', type: 'datetime', nullable: true })
  ngay_bi_khoa!: Date | null;

  @Column({ name: 'ngay_kich_hoat_lai', type: 'datetime', nullable: true })
  ngay_kich_hoat_lai!: Date | null;

  @Column({ name: 'diem_danh_gia_trung_binh', type: 'decimal', precision: 3, scale: 2, default: 0 })
  diem_danh_gia_trung_binh!: string;

  @Column({ name: 'so_luot_danh_gia', type: 'int', unsigned: true, default: 0 })
  so_luot_danh_gia!: number;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;

  @OneToMany(() => GoiTuVanEntity, (g) => g.chuyen_gia_dinh_duong)
  goi_tu_van!: GoiTuVanEntity[];

  @OneToMany(() => LichHenEntity, (lh) => lh.chuyen_gia_dinh_duong)
  lich_hen!: LichHenEntity[];
}
