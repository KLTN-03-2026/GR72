import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChuyenGiaDinhDuongEntity } from '../../ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import { TaiKhoanEntity } from '../../User/entities/tai-khoan.entity';
import { GoiTuVanEntity } from '../../ChuyenGiaDinhDuong/entities/goi-tu-van.entity';

export type LichHenStatus =
  | 'cho_thanh_toan'
  | 'da_xac_nhan'
  | 'da_checkin'
  | 'dang_tu_van'
  | 'hoan_thanh'
  | 'da_huy'
  | 'vo_hieu_hoa';

@Entity({ name: 'lich_hen' })
export class LichHenEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'chuyen_gia_dinh_duong_id', type: 'bigint', unsigned: true })
  chuyen_gia_dinh_duong_id!: number;

  @ManyToOne(() => ChuyenGiaDinhDuongEntity)
  @JoinColumn({ name: 'chuyen_gia_dinh_duong_id' })
  chuyen_gia_dinh_duong!: ChuyenGiaDinhDuongEntity;

  @Column({ name: 'tai_khoan_id', type: 'bigint', unsigned: true })
  tai_khoan_id!: number;

  @ManyToOne(() => TaiKhoanEntity)
  @JoinColumn({ name: 'tai_khoan_id' })
  tai_khoan!: TaiKhoanEntity;

  @Column({ name: 'goi_tu_van_id', type: 'bigint', unsigned: true })
  goi_tu_van_id!: number;

  @ManyToOne(() => GoiTuVanEntity)
  @JoinColumn({ name: 'goi_tu_van_id' })
  goi_tu_van!: GoiTuVanEntity;

  @Column({ name: 'ma_lich_hen', type: 'varchar', length: 50 })
  ma_lich_hen!: string;

  @Column({ name: 'muc_dich', type: 'text', nullable: true })
  muc_dich!: string | null;

  @Column({ name: 'ngay_hen', type: 'date' })
  ngay_hen!: string;

  @Column({ name: 'gio_bat_dau', type: 'time' })
  gio_bat_dau!: string;

  @Column({ name: 'gio_ket_thuc', type: 'time' })
  gio_ket_thuc!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  dia_diem!: string | null;

  @Column({
    type: 'enum',
    enum: ['cho_thanh_toan', 'da_xac_nhan', 'da_checkin', 'dang_tu_van', 'hoan_thanh', 'da_huy', 'vo_hieu_hoa'],
    default: 'cho_thanh_toan',
  })
  trang_thai!: LichHenStatus;

  @Column({ name: 'ly_do_huy', type: 'text', nullable: true })
  ly_do_huy!: string | null;

  @Column({ name: 'huy_boi', type: 'bigint', unsigned: true, nullable: true })
  huy_boi!: number | null;

  @Column({ name: 'huy_luc', type: 'datetime', nullable: true })
  huy_luc!: Date | null;

  @Column({ name: 'ghi_chu_nutritionist', type: 'text', nullable: true })
  ghi_chu_nutritionist!: string | null;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;
}
