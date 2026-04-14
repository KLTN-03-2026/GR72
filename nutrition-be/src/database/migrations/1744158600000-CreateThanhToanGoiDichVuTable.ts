import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateThanhToanGoiDichVuTable1744158600000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('thanh_toan_goi_dich_vu');
    if (hasTable) return;

    await queryRunner.createTable(
      new Table({
        name: 'thanh_toan_goi_dich_vu',
        columns: [
          { name: 'id', type: 'bigint', unsigned: true, isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'tai_khoan_id', type: 'bigint', unsigned: true },
          { name: 'dang_ky_goi_dich_vu_id', type: 'bigint', unsigned: true },
          { name: 'goi_dich_vu_id', type: 'bigint', unsigned: true },
          { name: 'ma_giao_dich', type: 'varchar', length: '150', isUnique: true },
          {
            name: 'phuong_thuc_thanh_toan',
            type: 'enum',
            enum: ['chuyen_khoan', 'vi_dien_tu', 'cong_thanh_toan', 'thu_cong', 'mien_phi'],
            default: "'cong_thanh_toan'",
          },
          { name: 'so_tien', type: 'decimal', precision: 12, scale: 2 },
          {
            name: 'trang_thai',
            type: 'enum',
            enum: ['cho_thanh_toan', 'thanh_cong', 'that_bai', 'da_hoan_tien'],
            default: "'cho_thanh_toan'",
          },
          { name: 'thanh_toan_luc', type: 'datetime', isNullable: true },
          { name: 'noi_dung_thanh_toan', type: 'varchar', length: '255', isNullable: true },
          { name: 'du_lieu_thanh_toan', type: 'json', isNullable: true },
          { name: 'xac_nhan_boi', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'xac_nhan_luc', type: 'datetime', isNullable: true },
          { name: 'tao_luc', type: 'datetime' },
          { name: 'cap_nhat_luc', type: 'datetime' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'thanh_toan_goi_dich_vu',
      new TableIndex({
        name: 'idx_thanh_toan_goi_dich_vu_tai_khoan_trang_thai',
        columnNames: ['tai_khoan_id', 'trang_thai', 'tao_luc'],
      }),
    );

    await queryRunner.createForeignKey('thanh_toan_goi_dich_vu', new TableForeignKey({ name: 'fk_thanh_toan_goi_dich_vu_tai_khoan', columnNames: ['tai_khoan_id'], referencedTableName: 'tai_khoan', referencedColumnNames: ['id'], onDelete: 'RESTRICT', onUpdate: 'CASCADE' }));
    await queryRunner.createForeignKey('thanh_toan_goi_dich_vu', new TableForeignKey({ name: 'fk_thanh_toan_goi_dich_vu_dang_ky', columnNames: ['dang_ky_goi_dich_vu_id'], referencedTableName: 'dang_ky_goi_dich_vu', referencedColumnNames: ['id'], onDelete: 'RESTRICT', onUpdate: 'CASCADE' }));
    await queryRunner.createForeignKey('thanh_toan_goi_dich_vu', new TableForeignKey({ name: 'fk_thanh_toan_goi_dich_vu_goi', columnNames: ['goi_dich_vu_id'], referencedTableName: 'goi_dich_vu', referencedColumnNames: ['id'], onDelete: 'RESTRICT', onUpdate: 'CASCADE' }));
    await queryRunner.createForeignKey('thanh_toan_goi_dich_vu', new TableForeignKey({ name: 'fk_thanh_toan_goi_dich_vu_xac_nhan_boi', columnNames: ['xac_nhan_boi'], referencedTableName: 'tai_khoan', referencedColumnNames: ['id'], onDelete: 'SET NULL', onUpdate: 'CASCADE' }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('thanh_toan_goi_dich_vu');
    if (hasTable) {
      await queryRunner.dropTable('thanh_toan_goi_dich_vu', true);
    }
  }
}
