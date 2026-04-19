import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TaiKhoanEntity } from '../../../Admin/User/entities/tai-khoan.entity';

export type NotificationStatus = 'chua_doc' | 'da_doc';

@Entity({ name: 'thong_bao' })
export class ThongBaoEntity {
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
    name: 'nguoi_gui_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  nguoi_gui_id!: number | null;

  @ManyToOne(() => TaiKhoanEntity)
  @JoinColumn({ name: 'nguoi_gui_id' })
  nguoi_gui!: TaiKhoanEntity | null;

  @Column({
    type: 'varchar',
    length: 50,
  })
  loai!: string;

  @Column({
    type: 'varchar',
    length: 191,
  })
  tieu_de!: string;

  @Column({
    type: 'text',
  })
  noi_dung!: string;

  @Column({
    name: 'trang_thai',
    type: 'enum',
    enum: ['chua_doc', 'da_doc'],
    default: 'chua_doc',
  })
  trang_thai!: NotificationStatus;

  @Column({
    name: 'duong_dan_hanh_dong',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  duong_dan_hanh_dong!: string | null;

  @Column({
    name: 'tao_luc',
    type: 'datetime',
  })
  tao_luc!: Date;

  @Column({
    name: 'doc_luc',
    type: 'datetime',
    nullable: true,
  })
  doc_luc!: Date | null;

  @Column({
    name: 'cap_nhat_luc',
    type: 'datetime',
  })
  cap_nhat_luc!: Date;
}
