import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table } from 'typeorm';

export class CreateTaiKhoanTable1744068000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tai_khoan',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '191',
            isUnique: true,
          },
          {
            name: 'mat_khau_ma_hoa',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'vai_tro',
            type: 'enum',
            enum: ['nguoi_dung', 'chuyen_gia_dinh_duong', 'quan_tri'],
          },
          {
            name: 'trang_thai',
            type: 'enum',
            enum: ['hoat_dong', 'khong_hoat_dong', 'bi_khoa'],
            default: "'hoat_dong'",
          },
          {
            name: 'ho_ten',
            type: 'varchar',
            length: '150',
          },
          {
            name: 'ma_dat_lai_mat_khau',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'het_han_ma_dat_lai',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'dang_nhap_cuoi_luc',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'tao_luc',
            type: 'datetime',
          },
          {
            name: 'cap_nhat_luc',
            type: 'datetime',
          },
          {
            name: 'xoa_luc',
            type: 'datetime',
            isNullable: true,
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tai_khoan', true);
  }
}
