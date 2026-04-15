import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TaiKhoanEntity } from '../../../Admin/User/entities/tai-khoan.entity';
import { MucTieuEntity } from '../../../Admin/User/entities/muc-tieu.entity';
import { ChiSoSucKhoeEntity } from './chi-so-suc-khoe.entity';

@Entity({ name: 'danh_gia_suc_khoe' })
export class DanhGiaSucKhoeEntity {
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
    name: 'chi_so_suc_khoe_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  chi_so_suc_khoe_id!: number | null;

  @ManyToOne(() => ChiSoSucKhoeEntity)
  @JoinColumn({ name: 'chi_so_suc_khoe_id' })
  chi_so_suc_khoe!: ChiSoSucKhoeEntity | null;

  @Column({
    name: 'muc_tieu_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  muc_tieu_id!: number | null;

  @ManyToOne(() => MucTieuEntity)
  @JoinColumn({ name: 'muc_tieu_id' })
  muc_tieu!: MucTieuEntity | null;

  @Column({
    name: 'bmi',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  bmi!: string | null;

  @Column({
    name: 'phan_loai_bmi',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  phan_loai_bmi!: string | null;

  @Column({
    name: 'bmr',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  bmr!: string | null;

  @Column({
    name: 'tdee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  tdee!: string | null;

  @Column({
    name: 'calories_khuyen_nghi',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  calories_khuyen_nghi!: string | null;

  @Column({
    name: 'protein_khuyen_nghi_g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  protein_khuyen_nghi_g!: string | null;

  @Column({
    name: 'carb_khuyen_nghi_g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  carb_khuyen_nghi_g!: string | null;

  @Column({
    name: 'fat_khuyen_nghi_g',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  fat_khuyen_nghi_g!: string | null;

  @Column({
    name: 'tom_tat',
    type: 'text',
    nullable: true,
  })
  tom_tat!: string | null;

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
