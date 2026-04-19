import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TaiKhoanEntity } from './tai-khoan.entity';

export type GioiTinh = 'nam' | 'nu' | 'khac';

export type MucDoVanDong =
  | 'it_van_dong'
  | 'van_dong_nhe'
  | 'van_dong_vua'
  | 'nang_dong'
  | 'rat_nang_dong';

@Entity({ name: 'ho_so' })
export class HoSoEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id!: number;

  @Column({
    name: 'tai_khoan_id',
    type: 'bigint',
    unsigned: true,
    unique: true,
  })
  tai_khoan_id!: number;

  @OneToOne(() => TaiKhoanEntity, (taiKhoan) => taiKhoan.ho_so)
  @JoinColumn({ name: 'tai_khoan_id' })
  tai_khoan!: TaiKhoanEntity;

  @Column({
    name: 'gioi_tinh',
    type: 'enum',
    enum: ['nam', 'nu', 'khac'],
    nullable: true,
  })
  gioi_tinh!: GioiTinh | null;

  @Column({
    name: 'ngay_sinh',
    type: 'date',
    nullable: true,
  })
  ngay_sinh!: string | null;

  @Column({
    name: 'chieu_cao_cm',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  chieu_cao_cm!: string | null;

  @Column({
    name: 'can_nang_hien_tai_kg',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  can_nang_hien_tai_kg!: string | null;

  @Column({
    name: 'muc_do_van_dong',
    type: 'enum',
    enum: [
      'it_van_dong',
      'van_dong_nhe',
      'van_dong_vua',
      'nang_dong',
      'rat_nang_dong',
    ],
    nullable: true,
  })
  muc_do_van_dong!: MucDoVanDong | null;

  @Column({
    name: 'che_do_an_uu_tien',
    type: 'json',
    nullable: true,
  })
  che_do_an_uu_tien!: string[] | null;

  @Column({
    name: 'di_ung',
    type: 'json',
    nullable: true,
  })
  di_ung!: string[] | null;

  @Column({
    name: 'thuc_pham_khong_thich',
    type: 'json',
    nullable: true,
  })
  thuc_pham_khong_thich!: string[] | null;

  @Column({
    name: 'anh_dai_dien_url',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  anh_dai_dien_url!: string | null;

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
