import type { MigrationInterface, QueryRunner } from 'typeorm';
import { TableForeignKey, TableIndex } from 'typeorm';

export class AddNguoiGuiIdToThongBao1744300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE thong_bao
      ADD COLUMN nguoi_gui_id bigint unsigned NULL
      AFTER tai_khoan_id
    `);

    await queryRunner.createIndex(
      'thong_bao',
      new TableIndex({
        name: 'idx_thong_bao_nguoi_gui_id',
        columnNames: ['nguoi_gui_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'thong_bao',
      new TableForeignKey({
        name: 'fk_thong_bao_nguoi_gui',
        columnNames: ['nguoi_gui_id'],
        referencedTableName: 'tai_khoan',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.dropForeignKey('thong_bao', 'fk_thong_bao_nguoi_gui')
    } catch { /* ignore if not exists */ }
    try {
      await queryRunner.dropIndex('thong_bao', 'idx_thong_bao_nguoi_gui_id')
    } catch { /* ignore if not exists */ }
    await queryRunner.query(`ALTER TABLE thong_bao DROP COLUMN nguoi_gui_id`)
  }
}