import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateChucNangGoiDichVuTable1744157400000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('chuc_nang_goi_dich_vu');
    if (hasTable) return;

    await queryRunner.createTable(
      new Table({
        name: 'chuc_nang_goi_dich_vu',
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
            name: 'goi_dich_vu_id',
            type: 'bigint',
            unsigned: true,
          },
          {
            name: 'ma_chuc_nang',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'ten_chuc_nang',
            type: 'varchar',
            length: '191',
          },
          {
            name: 'mo_ta',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'duoc_phep_su_dung',
            type: 'tinyint',
            length: '1',
            default: 1,
          },
          {
            name: 'gioi_han_so_lan',
            type: 'int',
            unsigned: true,
            isNullable: true,
          },
          {
            name: 'gioi_han_theo',
            type: 'enum',
            enum: ['ngay', 'thang', 'khong_gioi_han'],
            default: "'khong_gioi_han'",
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
      'chuc_nang_goi_dich_vu',
      new TableIndex({
        name: 'uq_chuc_nang_goi_dich_vu',
        columnNames: ['goi_dich_vu_id', 'ma_chuc_nang'],
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKey(
      'chuc_nang_goi_dich_vu',
      new TableForeignKey({
        name: 'fk_chuc_nang_goi_dich_vu_goi',
        columnNames: ['goi_dich_vu_id'],
        referencedTableName: 'goi_dich_vu',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('chuc_nang_goi_dich_vu');
    if (hasTable) {
      await queryRunner.dropTable('chuc_nang_goi_dich_vu', true);
    }
  }
}
