import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'nhom_thuc_pham' })
export class NhomThucPhamEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id!: number;

  @Column({
    type: 'varchar',
    length: 150,
  })
  ten!: string;

  @Column({
    type: 'varchar',
    length: 180,
    unique: true,
  })
  slug!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  mo_ta!: string | null;

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
