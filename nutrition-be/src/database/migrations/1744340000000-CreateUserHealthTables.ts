import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateUserHealthTables1744340000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasMucTieuTable = await queryRunner.hasTable('muc_tieu');
    if (!hasMucTieuTable) {
      await queryRunner.createTable(
        new Table({
          name: 'muc_tieu',
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
              name: 'loai_muc_tieu',
              type: 'enum',
              enum: ['giam_can', 'tang_can', 'giu_can'],
            },
            {
              name: 'trang_thai',
              type: 'enum',
              enum: ['dang_ap_dung', 'luu_tru', 'hoan_thanh'],
              default: "'dang_ap_dung'",
            },
            {
              name: 'can_nang_bat_dau_kg',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'can_nang_muc_tieu_kg',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'muc_tieu_calories_ngay',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'muc_tieu_protein_g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'muc_tieu_carb_g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'muc_tieu_fat_g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'ngay_bat_dau',
              type: 'date',
              isNullable: true,
            },
            {
              name: 'ngay_muc_tieu',
              type: 'date',
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
      );

      await queryRunner.createIndex(
        'muc_tieu',
        new TableIndex({
          name: 'idx_muc_tieu_tai_khoan_trang_thai',
          columnNames: ['tai_khoan_id', 'trang_thai'],
        }),
      );

      await queryRunner.createForeignKey(
        'muc_tieu',
        new TableForeignKey({
          name: 'fk_muc_tieu_tai_khoan',
          columnNames: ['tai_khoan_id'],
          referencedTableName: 'tai_khoan',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
    }

    const hasChiSoTable = await queryRunner.hasTable('chi_so_suc_khoe');
    if (!hasChiSoTable) {
      await queryRunner.createTable(
        new Table({
          name: 'chi_so_suc_khoe',
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
              name: 'do_luc',
              type: 'datetime',
            },
            {
              name: 'can_nang_kg',
              type: 'decimal',
              precision: 10,
              scale: 2,
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
              name: 'vong_eo_cm',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'vong_mong_cm',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'huyet_ap_tam_thu',
              type: 'smallint',
              unsigned: true,
              isNullable: true,
            },
            {
              name: 'huyet_ap_tam_truong',
              type: 'smallint',
              unsigned: true,
              isNullable: true,
            },
            {
              name: 'duong_huyet',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
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
      );

      await queryRunner.createIndex(
        'chi_so_suc_khoe',
        new TableIndex({
          name: 'idx_chi_so_suc_khoe_tai_khoan_do_luc',
          columnNames: ['tai_khoan_id', 'do_luc'],
        }),
      );

      await queryRunner.createForeignKey(
        'chi_so_suc_khoe',
        new TableForeignKey({
          name: 'fk_chi_so_suc_khoe_tai_khoan',
          columnNames: ['tai_khoan_id'],
          referencedTableName: 'tai_khoan',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
    }

    const hasDanhGiaTable = await queryRunner.hasTable('danh_gia_suc_khoe');
    if (!hasDanhGiaTable) {
      await queryRunner.createTable(
        new Table({
          name: 'danh_gia_suc_khoe',
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
              name: 'chi_so_suc_khoe_id',
              type: 'bigint',
              unsigned: true,
              isNullable: true,
            },
            {
              name: 'muc_tieu_id',
              type: 'bigint',
              unsigned: true,
              isNullable: true,
            },
            {
              name: 'bmi',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'phan_loai_bmi',
              type: 'varchar',
              length: '50',
              isNullable: true,
            },
            {
              name: 'bmr',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'tdee',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'calories_khuyen_nghi',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'protein_khuyen_nghi_g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'carb_khuyen_nghi_g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'fat_khuyen_nghi_g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'tom_tat',
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
      );

      await queryRunner.createIndex(
        'danh_gia_suc_khoe',
        new TableIndex({
          name: 'idx_danh_gia_suc_khoe_tai_khoan_tao_luc',
          columnNames: ['tai_khoan_id', 'tao_luc'],
        }),
      );

      await queryRunner.createForeignKeys('danh_gia_suc_khoe', [
        new TableForeignKey({
          name: 'fk_danh_gia_suc_khoe_tai_khoan',
          columnNames: ['tai_khoan_id'],
          referencedTableName: 'tai_khoan',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
        new TableForeignKey({
          name: 'fk_danh_gia_suc_khoe_chi_so',
          columnNames: ['chi_so_suc_khoe_id'],
          referencedTableName: 'chi_so_suc_khoe',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
        new TableForeignKey({
          name: 'fk_danh_gia_suc_khoe_muc_tieu',
          columnNames: ['muc_tieu_id'],
          referencedTableName: 'muc_tieu',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasDanhGiaTable = await queryRunner.hasTable('danh_gia_suc_khoe');
    if (hasDanhGiaTable) {
      await queryRunner.dropTable('danh_gia_suc_khoe', true);
    }

    const hasChiSoTable = await queryRunner.hasTable('chi_so_suc_khoe');
    if (hasChiSoTable) {
      await queryRunner.dropTable('chi_so_suc_khoe', true);
    }

    const hasMucTieuTable = await queryRunner.hasTable('muc_tieu');
    if (hasMucTieuTable) {
      await queryRunner.dropTable('muc_tieu', true);
    }
  }
}
