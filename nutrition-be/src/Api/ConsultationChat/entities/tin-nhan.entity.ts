import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LichHenEntity } from '../../Admin/Booking/entities/lich-hen.entity';
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';

export type ChatMessageType = 'text' | 'file';

export type ChatAttachment = {
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
};

@Entity({ name: 'tin_nhan' })
export class TinNhanEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'lich_hen_id', type: 'bigint', unsigned: true })
  lich_hen_id!: number;

  @ManyToOne(() => LichHenEntity)
  @JoinColumn({ name: 'lich_hen_id' })
  lich_hen!: LichHenEntity;

  @Column({ name: 'nguoi_gui_id', type: 'bigint', unsigned: true })
  nguoi_gui_id!: number;

  @ManyToOne(() => TaiKhoanEntity)
  @JoinColumn({ name: 'nguoi_gui_id' })
  nguoi_gui!: TaiKhoanEntity;

  @Column({
    name: 'loai',
    type: 'enum',
    enum: ['text', 'file'],
    default: 'text',
  })
  loai!: ChatMessageType;

  @Column({ name: 'noi_dung', type: 'text', nullable: true })
  noi_dung!: string | null;

  @Column({ name: 'tep_dinh_kem', type: 'json', nullable: true })
  tep_dinh_kem!: ChatAttachment | null;

  @Column({ name: 'da_doc_luc', type: 'datetime', nullable: true })
  da_doc_luc!: Date | null;

  @Column({ name: 'da_doc_boi_id', type: 'bigint', unsigned: true, nullable: true })
  da_doc_boi_id!: number | null;

  @ManyToOne(() => TaiKhoanEntity, { nullable: true })
  @JoinColumn({ name: 'da_doc_boi_id' })
  da_doc_boi!: TaiKhoanEntity | null;

  @Column({ name: 'tao_luc', type: 'datetime' })
  tao_luc!: Date;

  @Column({ name: 'cap_nhat_luc', type: 'datetime' })
  cap_nhat_luc!: Date;
}
