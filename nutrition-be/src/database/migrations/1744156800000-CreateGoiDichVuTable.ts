import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableIndex } from 'typeorm';

export class CreateGoiDichVuTable1744156800000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('goi_dich_vu');
    if (hasTable) return;

    await queryRunner.createTable(
      new Table({
        name: 'goi_dich_vu',
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
            name: 'ten_goi',
            type: 'varchar',
            length: '150',
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '180',
            isUnique: true,
          },
          {
            name: 'mo_ta',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'gia_niem_yet',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'gia_khuyen_mai',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'thoi_han_ngay',
            type: 'int',
            unsigned: true,
            isNullable: true,
          },
          {
            name: 'loai_chu_ky',
            type: 'enum',
            enum: ['thang', 'quy', 'nam', 'tron_doi'],
            default: "'thang'",
          },
          {
            name: 'trang_thai',
            type: 'enum',
            enum: ['ban_nhap', 'dang_kinh_doanh', 'ngung_kinh_doanh'],
            default: "'ban_nhap'",
          },
          {
            name: 'la_goi_mien_phi',
            type: 'tinyint',
            length: '1',
            default: 0,
          },
          {
            name: 'goi_noi_bat',
            type: 'tinyint',
            length: '1',
            default: 0,
          },
          {
            name: 'thu_tu_hien_thi',
            type: 'int',
            unsigned: true,
            default: 1,
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
    const hasTable = await queryRunner.hasTable('goi_dich_vu');
    if (hasTable) {
      await queryRunner.dropTable('goi_dich_vu', true);
    }
  }
}
