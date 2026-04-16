import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { LichHenEntity } from './lich-hen.entity';
import { ThanhToanTuVanEntity } from './thanh-toan-tu-van.entity';
import { ChuyenGiaDinhDuongEntity } from '../../ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';

export type PhanBoDoanhThuBookingStatus = 'tam_giu' | 'da_ghi_nhan' | 'da_hoan_tien';

@Entity({ name: 'phan_bo_doanh_thu_booking' })
export class PhanBoDoanhThuBookingEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'lich_hen_id', type: 'bigint', unsigned: true })
  lich_hen_id!: number;

  @ManyToOne(() => LichHenEntity)
  @JoinColumn({ name: 'lich_hen_id' })
  lich_hen!: LichHenEntity;

  @Column({ name: 'thanh_toan_tu_van_id', type: 'bigint', unsigned: true })
  thanh_toan_tu_van_id!: number;

  @ManyToOne(() => ThanhToanTuVanEntity)
  @JoinColumn({ name: 'thanh_toan_tu_van_id' })
  thanh_toan_tu_van!: ThanhToanTuVanEntity;

  @Column({ name: 'chuyen_gia_dinh_duong_id', type: 'bigint', unsigned: true })
  chuyen_gia_dinh_duong_id!: number;

  @ManyToOne(() => ChuyenGiaDinhDuongEntity)
  @JoinColumn({ name: 'chuyen_gia_dinh_duong_id' })
  chuyen_gia_dinh_duong!: ChuyenGiaDinhDuongEntity;

  @Column({ name: 'so_tien_goc', type: 'decimal', precision: 12, scale: 2 })
  so_tien_goc!: string;

  @Column({ name: 'ty_le_hoa_hong', type: 'decimal', precision: 5, scale: 2, default: 5 })
  ty_le_hoa_hong!: string;

  @Column({ name: 'so_tien_hoa_hong', type: 'decimal', precision: 12, scale: 2 })
  so_tien_hoa_hong!: string;

  @Column({ name: 'so_tien_chuyen_gia_nhan', type: 'decimal', precision: 12, scale: 2 })
  so_tien_chuyen_gia_nhan!: string;

  @Column({
    name: 'trang_thai',
    type: 'enum',
    enum: ['tam_giu', 'da_ghi_nhan', 'da_hoan_tien'],
    default: 'tam_giu',
  })
  trang_thai!: PhanBoDoanhThuBookingStatus;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;
}
