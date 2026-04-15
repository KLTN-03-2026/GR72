import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TaiKhoanEntity } from '../../../Admin/User/entities/tai-khoan.entity';

@Entity({ name: 'chi_so_suc_khoe' })
export class ChiSoSucKhoeEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id!: number;

  @Column({
    name: 'tai_khoan_id',
    type: 'bigint',
    unsigned: true,
  })
  tai_khoan_id!: number;

  @ManyToOne(() => TaiKhoanEntity)
  @JoinColumn({ name: 'tai_khoan_id' })
  tai_khoan!: TaiKhoanEntity;

  @Column({
    name: 'do_luc',
    type: 'datetime',
  })
  do_luc!: Date;

  @Column({
    name: 'can_nang_kg',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  can_nang_kg!: string | null;

  @Column({
    name: 'chieu_cao_cm',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  chieu_cao_cm!: string | null;

  @Column({
    name: 'vong_eo_cm',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  vong_eo_cm!: string | null;

  @Column({
    name: 'vong_mong_cm',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  vong_mong_cm!: string | null;

  @Column({
    name: 'huyet_ap_tam_thu',
    type: 'smallint',
    unsigned: true,
    nullable: true,
  })
  huyet_ap_tam_thu!: number | null;

  @Column({
    name: 'huyet_ap_tam_truong',
    type: 'smallint',
    unsigned: true,
    nullable: true,
  })
  huyet_ap_tam_truong!: number | null;

  @Column({
    name: 'duong_huyet',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  duong_huyet!: string | null;

  @Column({
    name: 'ghi_chu',
    type: 'text',
    nullable: true,
  })
  ghi_chu!: string | null;

  @Column({
    name: 'tao_luc',
    type: 'datetime',
  })
  tao_luc!: Date;

  @Column({
    name: 'cap_nhat_luc',
    type: 'datetime',
  })
  cap_nhat_luc!: Date;
}
