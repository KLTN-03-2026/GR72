import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateYeuCauDuyetThucPhamTable1744155600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('yeu_cau_duyet_thuc_pham');
    if (hasTable) return;

    await queryRunner.createTable(
      new Table({
        name: 'yeu_cau_duyet_thuc_pham',
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
            name: 'thuc_pham_id',
            type: 'bigint',
            unsigned: true,
            isNullable: true,
          },
          {
            name: 'loai_yeu_cau',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'ten_nguon',
            type: 'varchar',
            length: '120',
            isNullable: true,
          },
          {
            name: 'ma_nguon',
            type: 'varchar',
            length: '191',
            isNullable: true,
          },
          {
            name: 'de_xuat_boi',
            type: 'bigint',
            unsigned: true,
          },
          {
            name: 'trang_thai',
            type: 'enum',
            enum: ['cho_duyet', 'da_duyet', 'tu_choi'],
            default: "'cho_duyet'",
          },
          {
            name: 'du_lieu_hien_tai',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'du_lieu_de_xuat',
            type: 'json',
          },
          {
            name: 'ly_do',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'duyet_boi',
            type: 'bigint',
            unsigned: true,
            isNullable: true,
          },
          {
            name: 'duyet_luc',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'ghi_chu_duyet',
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
      'yeu_cau_duyet_thuc_pham',
      new TableIndex({
        name: 'idx_yeu_cau_duyet_thuc_pham_trang_thai',
        columnNames: ['trang_thai', 'tao_luc'],
      }),
    );

    await queryRunner.createForeignKey(
      'yeu_cau_duyet_thuc_pham',
      new TableForeignKey({
        name: 'fk_yeu_cau_duyet_thuc_pham_thuc_pham',
        columnNames: ['thuc_pham_id'],
        referencedTableName: 'thuc_pham',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'yeu_cau_duyet_thuc_pham',
      new TableForeignKey({
        name: 'fk_yeu_cau_duyet_thuc_pham_de_xuat_boi',
        columnNames: ['de_xuat_boi'],
        referencedTableName: 'tai_khoan',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'yeu_cau_duyet_thuc_pham',
      new TableForeignKey({
        name: 'fk_yeu_cau_duyet_thuc_pham_duyet_boi',
        columnNames: ['duyet_boi'],
        referencedTableName: 'tai_khoan',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('yeu_cau_duyet_thuc_pham');
    if (hasTable) {
      await queryRunner.dropTable('yeu_cau_duyet_thuc_pham', true);
    }
  }
}
