import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableForeignKey } from 'typeorm';

export class CreateNutritionistTables1744159200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // === bai_viet ===
    if (!(await queryRunner.hasTable('bai_viet'))) {
      await queryRunner.createTable(
        new Table({
          name: 'bai_viet',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              unsigned: true,
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'tac_gia_id', type: 'bigint', unsigned: true },
            { name: 'tieu_de', type: 'varchar', length: '191' },
            { name: 'slug', type: 'varchar', length: '220', isUnique: true },
            {
              name: 'danh_muc',
              type: 'varchar',
              length: '120',
              isNullable: true,
            },
            { name: 'the_gan', type: 'json', isNullable: true },
            { name: 'huong_dan_ai', type: 'json', isNullable: true },
            { name: 'tom_tat', type: 'text', isNullable: true },
            { name: 'noi_dung', type: 'longtext' },
            {
              name: 'anh_dai_dien_url',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'trang_thai',
              type: 'enum',
              enum: ['ban_nhap', 'xuat_ban', 'luu_tru'],
              default: "'ban_nhap'",
            },
            { name: 'xuat_ban_luc', type: 'datetime', isNullable: true },
            { name: 'tao_luc', type: 'datetime' },
            { name: 'cap_nhat_luc', type: 'datetime' },
            { name: 'xoa_luc', type: 'datetime', isNullable: true },
          ],
        }),
        true,
      );
      await queryRunner.createForeignKey(
        'bai_viet',
        new TableForeignKey({
          name: 'fk_bai_viet_tac_gia',
          columnNames: ['tac_gia_id'],
          referencedTableName: 'tai_khoan',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        }),
      );
    }

    // === cong_thuc ===
    if (!(await queryRunner.hasTable('cong_thuc'))) {
      await queryRunner.createTable(
        new Table({
          name: 'cong_thuc',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              unsigned: true,
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'tao_boi', type: 'bigint', unsigned: true },
            { name: 'ten', type: 'varchar', length: '191' },
            { name: 'slug', type: 'varchar', length: '220', isUnique: true },
            { name: 'mo_ta', type: 'text', isNullable: true },
            { name: 'huong_dan', type: 'longtext', isNullable: true },
            {
              name: 'so_khau_phan',
              type: 'int',
              unsigned: true,
              isNullable: true,
            },
            {
              name: 'tong_calories',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'tong_protein_g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'tong_carb_g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'tong_fat_g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'trang_thai',
              type: 'enum',
              enum: ['ban_nhap', 'xuat_ban', 'luu_tru'],
              default: "'ban_nhap'",
            },
            { name: 'tao_luc', type: 'datetime' },
            { name: 'cap_nhat_luc', type: 'datetime' },
            { name: 'xoa_luc', type: 'datetime', isNullable: true },
          ],
        }),
        true,
      );
      await queryRunner.createForeignKey(
        'cong_thuc',
        new TableForeignKey({
          name: 'fk_cong_thuc_tao_boi',
          columnNames: ['tao_boi'],
          referencedTableName: 'tai_khoan',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        }),
      );
    }

    // === thanh_phan_cong_thuc ===
    if (!(await queryRunner.hasTable('thanh_phan_cong_thuc'))) {
      await queryRunner.createTable(
        new Table({
          name: 'thanh_phan_cong_thuc',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              unsigned: true,
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'cong_thuc_id', type: 'bigint', unsigned: true },
            { name: 'thuc_pham_id', type: 'bigint', unsigned: true },
            { name: 'so_luong', type: 'decimal', precision: 10, scale: 2 },
            { name: 'don_vi', type: 'varchar', length: '50' },
            {
              name: 'calories',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'protein_g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'carb_g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'fat_g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            { name: 'tao_luc', type: 'datetime' },
            { name: 'cap_nhat_luc', type: 'datetime' },
          ],
        }),
        true,
      );
      await queryRunner.createForeignKey(
        'thanh_phan_cong_thuc',
        new TableForeignKey({
          name: 'fk_thanh_phan_cong_thuc_cong_thuc',
          columnNames: ['cong_thuc_id'],
          referencedTableName: 'cong_thuc',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
      await queryRunner.createForeignKey(
        'thanh_phan_cong_thuc',
        new TableForeignKey({
          name: 'fk_thanh_phan_cong_thuc_thuc_pham',
          columnNames: ['thuc_pham_id'],
          referencedTableName: 'thuc_pham',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        }),
      );
    }

    // === thuc_don_mau ===
    if (!(await queryRunner.hasTable('thuc_don_mau'))) {
      await queryRunner.createTable(
        new Table({
          name: 'thuc_don_mau',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              unsigned: true,
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'tao_boi', type: 'bigint', unsigned: true },
            { name: 'tieu_de', type: 'varchar', length: '191' },
            { name: 'mo_ta', type: 'text', isNullable: true },
            {
              name: 'loai_muc_tieu_phu_hop',
              type: 'enum',
              enum: ['giam_can', 'tang_can', 'giu_can'],
              isNullable: true,
            },
            {
              name: 'calories_muc_tieu',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'trang_thai',
              type: 'enum',
              enum: ['ban_nhap', 'xuat_ban', 'luu_tru'],
              default: "'ban_nhap'",
            },
            { name: 'tao_luc', type: 'datetime' },
            { name: 'cap_nhat_luc', type: 'datetime' },
            { name: 'xoa_luc', type: 'datetime', isNullable: true },
          ],
        }),
        true,
      );
      await queryRunner.createForeignKey(
        'thuc_don_mau',
        new TableForeignKey({
          name: 'fk_thuc_don_mau_tao_boi',
          columnNames: ['tao_boi'],
          referencedTableName: 'tai_khoan',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        }),
      );
    }

    // === chi_tiet_thuc_don_mau ===
    if (!(await queryRunner.hasTable('chi_tiet_thuc_don_mau'))) {
      await queryRunner.createTable(
        new Table({
          name: 'chi_tiet_thuc_don_mau',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              unsigned: true,
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'thuc_don_mau_id', type: 'bigint', unsigned: true },
            { name: 'ngay_so', type: 'int', unsigned: true, default: 1 },
            {
              name: 'loai_bua_an',
              type: 'enum',
              enum: ['bua_sang', 'bua_trua', 'bua_toi', 'bua_phu'],
            },
            {
              name: 'cong_thuc_id',
              type: 'bigint',
              unsigned: true,
              isNullable: true,
            },
            {
              name: 'thuc_pham_id',
              type: 'bigint',
              unsigned: true,
              isNullable: true,
            },
            {
              name: 'so_luong',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            { name: 'don_vi', type: 'varchar', length: '50', isNullable: true },
            {
              name: 'ghi_chu',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            { name: 'thu_tu', type: 'int', unsigned: true, default: 1 },
            { name: 'tao_luc', type: 'datetime' },
            { name: 'cap_nhat_luc', type: 'datetime' },
          ],
        }),
        true,
      );
      await queryRunner.createForeignKey(
        'chi_tiet_thuc_don_mau',
        new TableForeignKey({
          name: 'fk_chi_tiet_thuc_don_mau_thuc_don',
          columnNames: ['thuc_don_mau_id'],
          referencedTableName: 'thuc_don_mau',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
      await queryRunner.createForeignKey(
        'chi_tiet_thuc_don_mau',
        new TableForeignKey({
          name: 'fk_chi_tiet_thuc_don_mau_cong_thuc',
          columnNames: ['cong_thuc_id'],
          referencedTableName: 'cong_thuc',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
      await queryRunner.createForeignKey(
        'chi_tiet_thuc_don_mau',
        new TableForeignKey({
          name: 'fk_chi_tiet_thuc_don_mau_thuc_pham',
          columnNames: ['thuc_pham_id'],
          referencedTableName: 'thuc_pham',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('chi_tiet_thuc_don_mau', true);
    await queryRunner.dropTable('thuc_don_mau', true);
    await queryRunner.dropTable('thanh_phan_cong_thuc', true);
    await queryRunner.dropTable('cong_thuc', true);
    await queryRunner.dropTable('bai_viet', true);
  }
}
