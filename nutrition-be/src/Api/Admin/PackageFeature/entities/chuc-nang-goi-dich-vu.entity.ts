import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GoiDichVuEntity } from '../../Package/entities/goi-dich-vu.entity';

export type LimitType = 'ngay' | 'thang' | 'khong_gioi_han';

@Entity({ name: 'chuc_nang_goi_dich_vu' })
export class ChucNangGoiDichVuEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id!: number;

  @Column({
    name: 'goi_dich_vu_id',
    type: 'bigint',
    unsigned: true,
  })
  goi_dich_vu_id!: number;

  @ManyToOne(() => GoiDichVuEntity)
  @JoinColumn({ name: 'goi_dich_vu_id' })
  goi_dich_vu!: GoiDichVuEntity;

  @Column({
    name: 'ma_chuc_nang',
    type: 'varchar',
    length: 100,
  })
  ma_chuc_nang!: string;

  @Column({
    name: 'ten_chuc_nang',
    type: 'varchar',
    length: 191,
  })
  ten_chuc_nang!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  mo_ta!: string | null;

  @Column({
    name: 'duoc_phep_su_dung',
    type: 'tinyint',
    default: 1,
  })
  duoc_phep_su_dung!: boolean;

  @Column({
    name: 'gioi_han_so_lan',
    type: 'int',
    unsigned: true,
    nullable: true,
  })
  gioi_han_so_lan!: number | null;

  @Column({
    name: 'gioi_han_theo',
    type: 'enum',
    enum: ['ngay', 'thang', 'khong_gioi_han'],
    default: 'khong_gioi_han',
  })
  gioi_han_theo!: LimitType;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;
}
