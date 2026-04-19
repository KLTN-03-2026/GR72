import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateDangKyGoiDichVuTable1744158000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('dang_ky_goi_dich_vu');
    if (hasTable) return;

    await queryRunner.createTable(
      new Table({
        name: 'dang_ky_goi_dich_vu',
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
            name: 'tai_khoan_id',
            type: 'bigint',
            unsigned: true,
          },
          {
            name: 'goi_dich_vu_id',
            type: 'bigint',
            unsigned: true,
          },
          {
            name: 'ma_dang_ky',
            type: 'varchar',
            length: '120',
            isUnique: true,
          },
          {
            name: 'trang_thai',
            type: 'enum',
            enum: ['cho_kich_hoat', 'dang_hoat_dong', 'het_han', 'da_huy'],
            default: "'cho_kich_hoat'",
          },
          {
            name: 'ngay_bat_dau',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'ngay_het_han',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'tu_dong_gia_han',
            type: 'tinyint',
            length: '1',
            default: 0,
          },
          {
            name: 'nguon_dang_ky',
            type: 'enum',
            enum: ['nguoi_dung_tu_nang_cap', 'quan_tri_cap', 'khuyen_mai'],
            default: "'nguoi_dung_tu_nang_cap'",
          },
          {
            name: 'ghi_chu',
            type: 'text',
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
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'dang_ky_goi_dich_vu',
      new TableIndex({
        name: 'idx_dang_ky_goi_dich_vu_tai_khoan_trang_thai',
        columnNames: ['tai_khoan_id', 'trang_thai'],
      }),
    );

    await queryRunner.createForeignKey(
      'dang_ky_goi_dich_vu',
      new TableForeignKey({
        name: 'fk_dang_ky_goi_dich_vu_tai_khoan',
        columnNames: ['tai_khoan_id'],
        referencedTableName: 'tai_khoan',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'dang_ky_goi_dich_vu',
      new TableForeignKey({
        name: 'fk_dang_ky_goi_dich_vu_goi',
        columnNames: ['goi_dich_vu_id'],
        referencedTableName: 'goi_dich_vu',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('dang_ky_goi_dich_vu');
    if (hasTable) {
      await queryRunner.dropTable('dang_ky_goi_dich_vu', true);
    }
  }
}
