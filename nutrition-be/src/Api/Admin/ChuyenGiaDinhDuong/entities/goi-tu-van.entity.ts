import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChuyenGiaDinhDuongEntity } from './chuyen-gia-dinh-duong.entity';
import { TaiKhoanEntity } from '../../User/entities/tai-khoan.entity';
import { LichHenEntity } from '../../Booking/entities/lich-hen.entity';

export type GoiTuVanStatus = 'ban_nhap' | 'dang_ban' | 'ngung_ban';

@Entity({ name: 'goi_tu_van' })
export class GoiTuVanEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'chuyen_gia_dinh_duong_id', type: 'bigint', unsigned: true })
  chuyen_gia_dinh_duong_id!: number;

  @ManyToOne(() => ChuyenGiaDinhDuongEntity, (cg) => cg.goi_tu_van)
  @JoinColumn({ name: 'chuyen_gia_dinh_duong_id' })
  chuyen_gia_dinh_duong!: ChuyenGiaDinhDuongEntity;

  @Column({ type: 'varchar', length: 191 })
  ten!: string;

  @Column({ type: 'text', nullable: true })
  mo_ta!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  gia!: string;

  @Column({ name: 'thoi_luong_phut', type: 'int', unsigned: true, default: 30 })
  thoi_luong_phut!: number;

  @Column({
    name: 'so_lan_dung_mien_phi',
    type: 'int',
    unsigned: true,
    default: 0,
  })
  so_lan_dung_mien_phi!: number;

  @Column({
    type: 'enum',
    enum: ['ban_nhap', 'dang_ban', 'ngung_ban'],
    default: 'ban_nhap',
  })
  trang_thai!: GoiTuVanStatus;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;

  @Column({ name: 'xoa_luc', type: 'datetime', nullable: true })
  xoa_luc!: Date | null;

  @OneToMany(() => LichHenEntity, (lh) => lh.goi_tu_van)
  lich_hen!: LichHenEntity[];
}
