import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TaiKhoanEntity } from '../../../Admin/User/entities/tai-khoan.entity';
import { ThucPhamEntity } from '../../../Admin/Food/entities/thuc-pham.entity';

export type ReviewRequestStatus = 'cho_duyet' | 'da_duyet' | 'tu_choi';

@Entity({ name: 'yeu_cau_duyet_thuc_pham' })
export class YeuCauDuyetThucPhamEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id!: number;

  @Column({
    name: 'thuc_pham_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  thuc_pham_id!: number | null;

  @ManyToOne(() => ThucPhamEntity, { nullable: true })
  @JoinColumn({ name: 'thuc_pham_id' })
  thuc_pham!: ThucPhamEntity | null;

  @Column({
    name: 'loai_yeu_cau',
    type: 'varchar',
    length: 50,
  })
  loai_yeu_cau!: string;

  @Column({
    name: 'ten_nguon',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  ten_nguon!: string | null;

  @Column({
    name: 'ma_nguon',
    type: 'varchar',
    length: 191,
    nullable: true,
  })
  ma_nguon!: string | null;

  @Column({
    name: 'de_xuat_boi',
    type: 'bigint',
    unsigned: true,
  })
  de_xuat_boi!: number;

  @ManyToOne(() => TaiKhoanEntity)
  @JoinColumn({ name: 'de_xuat_boi' })
  nguoi_de_xuat!: TaiKhoanEntity;

  @Column({
    name: 'trang_thai',
    type: 'enum',
    enum: ['cho_duyet', 'da_duyet', 'tu_choi'],
    default: 'cho_duyet',
  })
  trang_thai!: ReviewRequestStatus;

  @Column({
    name: 'du_lieu_hien_tai',
    type: 'json',
    nullable: true,
  })
  du_lieu_hien_tai!: Record<string, unknown> | null;

  @Column({
    name: 'du_lieu_de_xuat',
    type: 'json',
  })
  du_lieu_de_xuat!: Record<string, unknown>;

  @Column({
    name: 'ly_do',
    type: 'text',
    nullable: true,
  })
  ly_do!: string | null;

  @Column({
    name: 'duyet_boi',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  duyet_boi!: number | null;

  @ManyToOne(() => TaiKhoanEntity)
  @JoinColumn({ name: 'duyet_boi' })
  nguoi_duyet!: TaiKhoanEntity | null;

  @Column({
    name: 'duyet_luc',
    type: 'datetime',
    nullable: true,
  })
  duyet_luc!: Date | null;

  @Column({
    name: 'ghi_chu_duyet',
    type: 'text',
    nullable: true,
  })
  ghi_chu_duyet!: string | null;

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
