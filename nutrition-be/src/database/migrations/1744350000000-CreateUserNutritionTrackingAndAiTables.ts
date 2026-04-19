import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableForeignKey } from 'typeorm';

export class CreateUserNutritionTrackingAndAiTables1744350000000 implements MigrationInterface {
  name = 'CreateUserNutritionTrackingAndAiTables1744350000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('ke_hoach_an'))) {
      await queryRunner.createTable(
        new Table({
          name: 'ke_hoach_an',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              unsigned: true,
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'tai_khoan_id', type: 'bigint', unsigned: true },
            { name: 'loai_nguon', type: 'varchar', length: '50' },
            {
              name: 'nguon_id',
              type: 'bigint',
              unsigned: true,
              isNullable: true,
            },
            { name: 'tieu_de', type: 'varchar', length: '191' },
            { name: 'mo_ta', type: 'text', isNullable: true },
            { name: 'ngay_ap_dung', type: 'date' },
            {
              name: 'trang_thai',
              type: 'enum',
              enum: ['ban_nhap', 'dang_ap_dung', 'hoan_thanh', 'luu_tru'],
              default: "'dang_ap_dung'",
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
            { name: 'tao_luc', type: 'datetime' },
            { name: 'cap_nhat_luc', type: 'datetime' },
          ],
          indices: [
            {
              name: 'idx_ke_hoach_an_tai_khoan_ngay_ap_dung',
              columnNames: ['tai_khoan_id', 'ngay_ap_dung'],
            },
          ],
        }),
      );
      await queryRunner.createForeignKey(
        'ke_hoach_an',
        new TableForeignKey({
          name: 'fk_ke_hoach_an_tai_khoan',
          columnNames: ['tai_khoan_id'],
          referencedTableName: 'tai_khoan',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
    }

    if (!(await queryRunner.hasTable('chi_tiet_ke_hoach_an'))) {
      await queryRunner.createTable(
        new Table({
          name: 'chi_tiet_ke_hoach_an',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              unsigned: true,
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'ke_hoach_an_id', type: 'bigint', unsigned: true },
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
      );
      await queryRunner.createForeignKey(
        'chi_tiet_ke_hoach_an',
        new TableForeignKey({
          name: 'fk_chi_tiet_ke_hoach_an_ke_hoach',
          columnNames: ['ke_hoach_an_id'],
          referencedTableName: 'ke_hoach_an',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
      await queryRunner.createForeignKey(
        'chi_tiet_ke_hoach_an',
        new TableForeignKey({
          name: 'fk_chi_tiet_ke_hoach_an_cong_thuc',
          columnNames: ['cong_thuc_id'],
          referencedTableName: 'cong_thuc',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
      await queryRunner.createForeignKey(
        'chi_tiet_ke_hoach_an',
        new TableForeignKey({
          name: 'fk_chi_tiet_ke_hoach_an_thuc_pham',
          columnNames: ['thuc_pham_id'],
          referencedTableName: 'thuc_pham',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
    }

    if (!(await queryRunner.hasTable('nhat_ky_bua_an'))) {
      await queryRunner.createTable(
        new Table({
          name: 'nhat_ky_bua_an',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              unsigned: true,
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'tai_khoan_id', type: 'bigint', unsigned: true },
            { name: 'ngay_ghi', type: 'date' },
            {
              name: 'loai_bua_an',
              type: 'enum',
              enum: ['bua_sang', 'bua_trua', 'bua_toi', 'bua_phu'],
            },
            { name: 'ghi_chu', type: 'text', isNullable: true },
            { name: 'tao_luc', type: 'datetime' },
            { name: 'cap_nhat_luc', type: 'datetime' },
          ],
          uniques: [
            {
              name: 'uq_nhat_ky_bua_an_tai_khoan_ngay_loai_bua',
              columnNames: ['tai_khoan_id', 'ngay_ghi', 'loai_bua_an'],
            },
          ],
        }),
      );
      await queryRunner.createForeignKey(
        'nhat_ky_bua_an',
        new TableForeignKey({
          name: 'fk_nhat_ky_bua_an_tai_khoan',
          columnNames: ['tai_khoan_id'],
          referencedTableName: 'tai_khoan',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
    }

    if (!(await queryRunner.hasTable('chi_tiet_nhat_ky_bua_an'))) {
      await queryRunner.createTable(
        new Table({
          name: 'chi_tiet_nhat_ky_bua_an',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              unsigned: true,
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'nhat_ky_bua_an_id', type: 'bigint', unsigned: true },
            { name: 'loai_nguon', type: 'varchar', length: '50' },
            {
              name: 'nguon_id',
              type: 'bigint',
              unsigned: true,
              isNullable: true,
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
            { name: 'so_luong', type: 'decimal', precision: 10, scale: 2 },
            { name: 'don_vi', type: 'varchar', length: '50' },
            { name: 'calories', type: 'decimal', precision: 10, scale: 2 },
            {
              name: 'protein_g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              default: 0,
            },
            {
              name: 'carb_g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              default: 0,
            },
            {
              name: 'fat_g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              default: 0,
            },
            {
              name: 'chat_xo_g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'natri_mg',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            { name: 'du_lieu_chup_lai', type: 'json', isNullable: true },
            { name: 'tao_luc', type: 'datetime' },
            { name: 'cap_nhat_luc', type: 'datetime' },
          ],
        }),
      );
      await queryRunner.createForeignKey(
        'chi_tiet_nhat_ky_bua_an',
        new TableForeignKey({
          name: 'fk_chi_tiet_nhat_ky_bua_an_nhat_ky',
          columnNames: ['nhat_ky_bua_an_id'],
          referencedTableName: 'nhat_ky_bua_an',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
      await queryRunner.createForeignKey(
        'chi_tiet_nhat_ky_bua_an',
        new TableForeignKey({
          name: 'fk_chi_tiet_nhat_ky_bua_an_cong_thuc',
          columnNames: ['cong_thuc_id'],
          referencedTableName: 'cong_thuc',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
      await queryRunner.createForeignKey(
        'chi_tiet_nhat_ky_bua_an',
        new TableForeignKey({
          name: 'fk_chi_tiet_nhat_ky_bua_an_thuc_pham',
          columnNames: ['thuc_pham_id'],
          referencedTableName: 'thuc_pham',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
    }

    if (!(await queryRunner.hasTable('tong_hop_dinh_duong_ngay'))) {
      await queryRunner.createTable(
        new Table({
          name: 'tong_hop_dinh_duong_ngay',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              unsigned: true,
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'tai_khoan_id', type: 'bigint', unsigned: true },
            { name: 'ngay', type: 'date' },
            {
              name: 'tong_calories',
              type: 'decimal',
              precision: 10,
              scale: 2,
              default: 0,
            },
            {
              name: 'tong_protein_g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              default: 0,
            },
            {
              name: 'tong_carb_g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              default: 0,
            },
            {
              name: 'tong_fat_g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              default: 0,
            },
            {
              name: 'so_bua_da_ghi',
              type: 'smallint',
              unsigned: true,
              default: 0,
            },
            { name: 'tao_luc', type: 'datetime' },
            { name: 'cap_nhat_luc', type: 'datetime' },
          ],
          uniques: [
            {
              name: 'uq_tong_hop_dinh_duong_ngay',
              columnNames: ['tai_khoan_id', 'ngay'],
            },
          ],
        }),
      );
      await queryRunner.createForeignKey(
        'tong_hop_dinh_duong_ngay',
        new TableForeignKey({
          name: 'fk_tong_hop_dinh_duong_ngay_tai_khoan',
          columnNames: ['tai_khoan_id'],
          referencedTableName: 'tai_khoan',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
    }

    if (!(await queryRunner.hasTable('phien_tu_van_ai'))) {
      await queryRunner.createTable(
        new Table({
          name: 'phien_tu_van_ai',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              unsigned: true,
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'tai_khoan_id', type: 'bigint', unsigned: true },
            {
              name: 'tieu_de',
              type: 'varchar',
              length: '191',
              isNullable: true,
            },
            {
              name: 'trang_thai',
              type: 'enum',
              enum: ['dang_mo', 'da_dong'],
              default: "'dang_mo'",
            },
            { name: 'tin_nhan', type: 'longtext', isNullable: true },
            { name: 'ngu_canh_chup_lai', type: 'json', isNullable: true },
            {
              name: 'mo_hinh_cuoi',
              type: 'varchar',
              length: '100',
              isNullable: true,
            },
            {
              name: 'tong_token_cuoi',
              type: 'int',
              unsigned: true,
              isNullable: true,
            },
            { name: 'loi_cuoi', type: 'text', isNullable: true },
            { name: 'tao_luc', type: 'datetime' },
            { name: 'cap_nhat_luc', type: 'datetime' },
          ],
        }),
      );
      await queryRunner.createForeignKey(
        'phien_tu_van_ai',
        new TableForeignKey({
          name: 'fk_phien_tu_van_ai_tai_khoan',
          columnNames: ['tai_khoan_id'],
          referencedTableName: 'tai_khoan',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
    }

    if (!(await queryRunner.hasTable('khuyen_nghi_ai'))) {
      await queryRunner.createTable(
        new Table({
          name: 'khuyen_nghi_ai',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              unsigned: true,
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'tai_khoan_id', type: 'bigint', unsigned: true },
            {
              name: 'phien_tu_van_ai_id',
              type: 'bigint',
              unsigned: true,
              isNullable: true,
            },
            {
              name: 'trang_thai',
              type: 'enum',
              enum: ['cho_xu_ly', 'da_chap_nhan', 'tu_choi', 'da_ap_dung'],
              default: "'cho_xu_ly'",
            },
            { name: 'loai_khuyen_nghi', type: 'varchar', length: '50' },
            { name: 'ngay_muc_tieu', type: 'date', isNullable: true },
            {
              name: 'muc_tieu_calories',
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
            { name: 'canh_bao', type: 'json', isNullable: true },
            { name: 'ly_giai', type: 'text', isNullable: true },
            { name: 'du_lieu_khuyen_nghi', type: 'json' },
            {
              name: 'ke_hoach_an_da_ap_dung_id',
              type: 'bigint',
              unsigned: true,
              isNullable: true,
            },
            { name: 'tao_luc', type: 'datetime' },
            { name: 'cap_nhat_luc', type: 'datetime' },
          ],
          indices: [
            {
              name: 'idx_khuyen_nghi_ai_tai_khoan_trang_thai',
              columnNames: ['tai_khoan_id', 'trang_thai', 'tao_luc'],
            },
          ],
        }),
      );
      await queryRunner.createForeignKey(
        'khuyen_nghi_ai',
        new TableForeignKey({
          name: 'fk_khuyen_nghi_ai_tai_khoan',
          columnNames: ['tai_khoan_id'],
          referencedTableName: 'tai_khoan',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
      await queryRunner.createForeignKey(
        'khuyen_nghi_ai',
        new TableForeignKey({
          name: 'fk_khuyen_nghi_ai_phien',
          columnNames: ['phien_tu_van_ai_id'],
          referencedTableName: 'phien_tu_van_ai',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
      await queryRunner.createForeignKey(
        'khuyen_nghi_ai',
        new TableForeignKey({
          name: 'fk_khuyen_nghi_ai_ke_hoach',
          columnNames: ['ke_hoach_an_da_ap_dung_id'],
          referencedTableName: 'ke_hoach_an',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('khuyen_nghi_ai', true);
    await queryRunner.dropTable('phien_tu_van_ai', true);
    await queryRunner.dropTable('tong_hop_dinh_duong_ngay', true);
    await queryRunner.dropTable('chi_tiet_nhat_ky_bua_an', true);
    await queryRunner.dropTable('nhat_ky_bua_an', true);
    await queryRunner.dropTable('chi_tiet_ke_hoach_an', true);
    await queryRunner.dropTable('ke_hoach_an', true);
  }
}
