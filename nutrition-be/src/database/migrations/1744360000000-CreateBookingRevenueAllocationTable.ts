import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableForeignKey } from 'typeorm';

export class CreateBookingRevenueAllocationTable1744360000000
  implements MigrationInterface
{
  name = 'CreateBookingRevenueAllocationTable1744360000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('phan_bo_doanh_thu_booking')) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'phan_bo_doanh_thu_booking',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'lich_hen_id', type: 'bigint', unsigned: true },
          { name: 'thanh_toan_tu_van_id', type: 'bigint', unsigned: true },
          { name: 'chuyen_gia_dinh_duong_id', type: 'bigint', unsigned: true },
          { name: 'so_tien_goc', type: 'decimal', precision: 12, scale: 2 },
          {
            name: 'ty_le_hoa_hong',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: '5.00',
          },
          { name: 'so_tien_hoa_hong', type: 'decimal', precision: 12, scale: 2 },
          { name: 'so_tien_chuyen_gia_nhan', type: 'decimal', precision: 12, scale: 2 },
          {
            name: 'trang_thai',
            type: 'enum',
            enum: ['tam_giu', 'da_ghi_nhan', 'da_hoan_tien'],
            default: "'tam_giu'",
          },
          { name: 'tao_luc', type: 'datetime' },
          { name: 'cap_nhat_luc', type: 'datetime' },
        ],
        uniques: [
          {
            name: 'uq_phan_bo_doanh_thu_booking_lich_hen',
            columnNames: ['lich_hen_id'],
          },
        ],
        indices: [
          {
            name: 'idx_phan_bo_doanh_thu_booking_chuyen_gia',
            columnNames: ['chuyen_gia_dinh_duong_id', 'trang_thai', 'tao_luc'],
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'phan_bo_doanh_thu_booking',
      new TableForeignKey({
        name: 'fk_phan_bo_doanh_thu_booking_lich_hen',
        columnNames: ['lich_hen_id'],
        referencedTableName: 'lich_hen',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'phan_bo_doanh_thu_booking',
      new TableForeignKey({
        name: 'fk_phan_bo_doanh_thu_booking_thanh_toan',
        columnNames: ['thanh_toan_tu_van_id'],
        referencedTableName: 'thanh_toan_tu_van',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'phan_bo_doanh_thu_booking',
      new TableForeignKey({
        name: 'fk_phan_bo_doanh_thu_booking_chuyen_gia',
        columnNames: ['chuyen_gia_dinh_duong_id'],
        referencedTableName: 'chuyen_gia_dinh_duong',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('phan_bo_doanh_thu_booking'))) {
      return;
    }

    await queryRunner.dropForeignKey(
      'phan_bo_doanh_thu_booking',
      'fk_phan_bo_doanh_thu_booking_lich_hen',
    );
    await queryRunner.dropForeignKey(
      'phan_bo_doanh_thu_booking',
      'fk_phan_bo_doanh_thu_booking_thanh_toan',
    );
    await queryRunner.dropForeignKey(
      'phan_bo_doanh_thu_booking',
      'fk_phan_bo_doanh_thu_booking_chuyen_gia',
    );
    await queryRunner.dropTable('phan_bo_doanh_thu_booking');
  }
}
