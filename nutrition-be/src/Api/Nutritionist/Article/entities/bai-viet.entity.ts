import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TaiKhoanEntity } from '../../../Admin/User/entities/tai-khoan.entity';

export type ArticleStatus = 'ban_nhap' | 'xuat_ban' | 'luu_tru';

@Entity({ name: 'bai_viet' })
export class BaiVietEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'tac_gia_id', type: 'bigint', unsigned: true })
  tac_gia_id!: number;

  @ManyToOne(() => TaiKhoanEntity)
  @JoinColumn({ name: 'tac_gia_id' })
  tac_gia!: TaiKhoanEntity;

  @Column({ type: 'varchar', length: 191 })
  tieu_de!: string;

  @Column({ type: 'varchar', length: 220, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  danh_muc!: string | null;

  @Column({ name: 'the_gan', type: 'json', nullable: true })
  the_gan!: string[] | null;

  @Column({ name: 'huong_dan_ai', type: 'json', nullable: true })
  huong_dan_ai!: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  tom_tat!: string | null;

  @Column({ type: 'longtext' })
  noi_dung!: string;

  @Column({
    name: 'anh_dai_dien_url',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  anh_dai_dien_url!: string | null;

  @Column({
    name: 'trang_thai',
    type: 'enum',
    enum: ['ban_nhap', 'xuat_ban', 'luu_tru'],
    default: 'ban_nhap',
  })
  trang_thai!: ArticleStatus;

  @Column({ name: 'xuat_ban_luc', type: 'datetime', nullable: true })
  xuat_ban_luc!: Date | null;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;

  @Column({ name: 'xoa_luc', type: 'datetime', nullable: true })
  xoa_luc!: Date | null;
}
