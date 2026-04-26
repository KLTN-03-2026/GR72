import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type OtpType = 'xac_thuc' | 'dat_lai_mat_khau';

@Entity({ name: 'otp' })
export class OtpEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Index()
  @Column({ type: 'varchar', length: 191 })
  email!: string;

  @Column({ name: 'ma_otp', type: 'varchar', length: 10 })
  ma_otp!: string;

  @Column({
    name: 'loai',
    type: 'enum',
    enum: ['xac_thuc', 'dat_lai_mat_khau'],
  })
  loai!: OtpType;

  @Column({ name: 'da_su_dung', type: 'tinyint', default: 0 })
  da_su_dung!: boolean;

  @Column({ name: 'het_han_luc', type: 'datetime' })
  het_han_luc!: Date;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;
}

