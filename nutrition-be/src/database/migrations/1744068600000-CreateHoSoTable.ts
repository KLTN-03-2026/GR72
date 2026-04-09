import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateHoSoTable1744068600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('ho_so');

    if (!hasTable) {
      await queryRunner.createTable(
        new Table({
          name: 'ho_so',
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
              isNullable: false,
            },
            {
              name: 'gioi_tinh',
              type: 'enum',
              enum: ['nam', 'nu', 'khac'],
              isNullable: true,
            },
            {
              name: 'ngay_sinh',
              type: 'date',
              isNullable: true,
            },
            {
              name: 'chieu_cao_cm',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'can_nang_hien_tai_kg',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'muc_do_van_dong',
              type: 'enum',
              enum: [
                'it_van_dong',
                'van_dong_nhe',
                'van_dong_vua',
                'nang_dong',
                'rat_nang_dong',
              ],
              isNullable: true,
            },
            {
              name: 'che_do_an_uu_tien',
              type: 'json',
              isNullable: true,
            },
            {
              name: 'di_ung',
              type: 'json',
              isNullable: true,
            },
            {
              name: 'thuc_pham_khong_thich',
              type: 'json',
              isNullable: true,
            },
            {
              name: 'anh_dai_dien_url',
              type: 'varchar',
              length: '255',
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
        'ho_so',
        new TableIndex({
          name: 'uq_ho_so_tai_khoan_id',
          columnNames: ['tai_khoan_id'],
          isUnique: true,
        }),
      );

      await queryRunner.createForeignKey(
        'ho_so',
        new TableForeignKey({
          name: 'fk_ho_so_tai_khoan',
          columnNames: ['tai_khoan_id'],
          referencedTableName: 'tai_khoan',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
    }

    await queryRunner.query(`
      INSERT INTO ho_so (
        tai_khoan_id,
        gioi_tinh,
        ngay_sinh,
        chieu_cao_cm,
        can_nang_hien_tai_kg,
        muc_do_van_dong,
        che_do_an_uu_tien,
        di_ung,
        thuc_pham_khong_thich,
        anh_dai_dien_url,
        tao_luc,
        cap_nhat_luc
      )
      SELECT
        tk.id,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NOW(),
        NOW()
      FROM tai_khoan tk
      LEFT JOIN ho_so hs ON hs.tai_khoan_id = tk.id
      WHERE hs.id IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('ho_so');

    if (hasTable) {
      await queryRunner.dropTable('ho_so', true);
    }
  }
}
