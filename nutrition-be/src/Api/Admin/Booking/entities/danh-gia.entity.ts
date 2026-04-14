import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LichHenEntity } from '../../Booking/entities/lich-hen.entity';
import { TaiKhoanEntity } from '../../User/entities/tai-khoan.entity';
import { ChuyenGiaDinhDuongEntity } from '../../ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';

@Entity({ name: 'danh_gia' })
export class DanhGiaEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'lich_hen_id', type: 'bigint', unsigned: true })
  lich_hen_id!: number;

  @OneToOne(() => LichHenEntity)
  @JoinColumn({ name: 'lich_hen_id' })
  lich_hen!: LichHenEntity;

  @Column({ name: 'tai_khoan_id', type: 'bigint', unsigned: true })
  tai_khoan_id!: number;

  @ManyToOne(() => TaiKhoanEntity)
  @JoinColumn({ name: 'tai_khoan_id' })
  tai_khoan!: TaiKhoanEntity;

  @Column({ name: 'chuyen_gia_dinh_duong_id', type: 'bigint', unsigned: true })
  chuyen_gia_dinh_duong_id!: number;

  @ManyToOne(() => ChuyenGiaDinhDuongEntity)
  @JoinColumn({ name: 'chuyen_gia_dinh_duong_id' })
  chuyen_gia_dinh_duong!: ChuyenGiaDinhDuongEntity;

  @Column({ type: 'int', unsigned: true, comment: 'Diem 1-5 sao' })
  diem!: number;

  @Column({ type: 'text', nullable: true })
  noi_dung!: string | null;

  @Column({ type: 'text', nullable: true, comment: 'Phan hoi tu Nutritionist' })
  tra_loi!: string | null;

  @Column({ name: 'tra_loi_luc', type: 'datetime', nullable: true })
  tra_loi_luc!: Date | null;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;
}
