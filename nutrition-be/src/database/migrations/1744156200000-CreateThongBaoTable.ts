import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateThongBaoTable1744156200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('thong_bao');
    if (hasTable) return;

    await queryRunner.createTable(
      new Table({
        name: 'thong_bao',
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
            name: 'loai',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'tieu_de',
            type: 'varchar',
            length: '191',
          },
          {
            name: 'noi_dung',
            type: 'text',
          },
          {
            name: 'trang_thai',
            type: 'enum',
            enum: ['chua_doc', 'da_doc'],
            default: "'chua_doc'",
          },
          {
            name: 'duong_dan_hanh_dong',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'tao_luc',
            type: 'datetime',
          },
          {
            name: 'doc_luc',
            type: 'datetime',
            isNullable: true,
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
      'thong_bao',
      new TableIndex({
        name: 'idx_thong_bao_tai_khoan_trang_thai',
        columnNames: ['tai_khoan_id', 'trang_thai', 'tao_luc'],
      }),
    );

    await queryRunner.createForeignKey(
      'thong_bao',
      new TableForeignKey({
        name: 'fk_thong_bao_tai_khoan',
        columnNames: ['tai_khoan_id'],
        referencedTableName: 'tai_khoan',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('thong_bao');
    if (hasTable) {
      await queryRunner.dropTable('thong_bao', true);
    }
  }
}
