import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'chuyen_gia' })
export class ChuyenGiaEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Index({ unique: true })
  @Column({ name: 'tai_khoan_id', type: 'bigint', unsigned: true })
  tai_khoan_id!: number;

  @Column({ name: 'chuyen_mon', type: 'text', nullable: true })
  chuyen_mon!: string | null;

  @Column({ name: 'mo_ta', type: 'text', nullable: true })
  mo_ta!: string | null;

  @Column({ name: 'kinh_nghiem', type: 'text', nullable: true })
  kinh_nghiem!: string | null;

  @Column({ name: 'hoc_vi', type: 'varchar', length: 150, nullable: true })
  hoc_vi!: string | null;

  @Column({ name: 'chung_chi', type: 'text', nullable: true })
  chung_chi!: string | null;

  @Column({ name: 'anh_dai_dien_url', type: 'varchar', length: 500, nullable: true })
  anh_dai_dien_url!: string | null;

  @Index()
  @Column({
    name: 'trang_thai',
    type: 'enum',
    enum: ['cho_duyet', 'tu_choi', 'hoat_dong', 'tam_dung', 'bi_khoa'],
    default: 'cho_duyet',
  })
  trang_thai!: 'cho_duyet' | 'tu_choi' | 'hoat_dong' | 'tam_dung' | 'bi_khoa';

  @Column({ name: 'nhan_booking', type: 'tinyint', default: 1 })
  nhan_booking!: boolean;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;
}

