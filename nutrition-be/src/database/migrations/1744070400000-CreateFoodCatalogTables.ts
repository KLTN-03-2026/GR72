import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateFoodCatalogTables1744070400000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasFoodGroupTable = await queryRunner.hasTable('nhom_thuc_pham');

    if (!hasFoodGroupTable) {
      await queryRunner.createTable(
        new Table({
          name: 'nhom_thuc_pham',
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
              name: 'ten',
              type: 'varchar',
              length: '150',
            },
            {
              name: 'slug',
              type: 'varchar',
              length: '180',
              isUnique: true,
            },
            {
              name: 'mo_ta',
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
    }

    const hasFoodTable = await queryRunner.hasTable('thuc_pham');

    if (!hasFoodTable) {
      await queryRunner.createTable(
        new Table({
          name: 'thuc_pham',
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
              name: 'nhom_thuc_pham_id',
              type: 'bigint',
              unsigned: true,
            },
            {
              name: 'ten',
              type: 'varchar',
              length: '180',
            },
            {
              name: 'slug',
              type: 'varchar',
              length: '191',
              isUnique: true,
            },
            {
              name: 'mo_ta',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'the_gan',
              type: 'json',
              isNullable: true,
            },
            {
              name: 'loai_nguon',
              type: 'varchar',
              length: '50',
              default: "'noi_bo'",
            },
            {
              name: 'ten_nguon',
              type: 'varchar',
              length: '180',
              isNullable: true,
            },
            {
              name: 'ma_nguon',
              type: 'varchar',
              length: '120',
              isNullable: true,
            },
            {
              name: 'khau_phan_tham_chieu',
              type: 'decimal',
              precision: 10,
              scale: 2,
              default: 100,
            },
            {
              name: 'don_vi_khau_phan',
              type: 'varchar',
              length: '50',
              default: "'g'",
            },
            {
              name: 'calories_100g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              default: 0,
            },
            {
              name: 'protein_100g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              default: 0,
            },
            {
              name: 'carb_100g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              default: 0,
            },
            {
              name: 'fat_100g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              default: 0,
            },
            {
              name: 'chat_xo_100g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              default: 0,
            },
            {
              name: 'duong_100g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              default: 0,
            },
            {
              name: 'natri_100g',
              type: 'decimal',
              precision: 10,
              scale: 2,
              default: 0,
            },
            {
              name: 'du_lieu_goc',
              type: 'json',
              isNullable: true,
            },
            {
              name: 'da_xac_minh',
              type: 'boolean',
              default: false,
            },
            {
              name: 'tao_boi',
              type: 'bigint',
              unsigned: true,
              isNullable: true,
            },
            {
              name: 'cap_nhat_boi',
              type: 'bigint',
              unsigned: true,
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
            {
              name: 'xoa_luc',
              type: 'datetime',
              isNullable: true,
            },
          ],
        }),
        true,
      );

      await queryRunner.createIndex(
        'thuc_pham',
        new TableIndex({
          name: 'idx_thuc_pham_nhom_thuc_pham_id',
          columnNames: ['nhom_thuc_pham_id'],
        }),
      );

      await queryRunner.createForeignKey(
        'thuc_pham',
        new TableForeignKey({
          name: 'fk_thuc_pham_nhom_thuc_pham',
          columnNames: ['nhom_thuc_pham_id'],
          referencedTableName: 'nhom_thuc_pham',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'thuc_pham',
        new TableForeignKey({
          name: 'fk_thuc_pham_tao_boi',
          columnNames: ['tao_boi'],
          referencedTableName: 'tai_khoan',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'thuc_pham',
        new TableForeignKey({
          name: 'fk_thuc_pham_cap_nhat_boi',
          columnNames: ['cap_nhat_boi'],
          referencedTableName: 'tai_khoan',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
    }

    await queryRunner.query(`
      INSERT INTO nhom_thuc_pham (ten, slug, mo_ta, tao_luc, cap_nhat_luc)
      SELECT 'Tinh bột', 'tinh-bot', 'Nguồn năng lượng chính như cơm, bánh mì, khoai.', NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM nhom_thuc_pham WHERE slug = 'tinh-bot')
    `);
    await queryRunner.query(`
      INSERT INTO nhom_thuc_pham (ten, slug, mo_ta, tao_luc, cap_nhat_luc)
      SELECT 'Đạm', 'dam', 'Thịt, cá, trứng, sữa và các nguồn protein khác.', NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM nhom_thuc_pham WHERE slug = 'dam')
    `);
    await queryRunner.query(`
      INSERT INTO nhom_thuc_pham (ten, slug, mo_ta, tao_luc, cap_nhat_luc)
      SELECT 'Rau củ', 'rau-cu', 'Nhóm rau xanh, củ quả giàu vi chất và chất xơ.', NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM nhom_thuc_pham WHERE slug = 'rau-cu')
    `);
    await queryRunner.query(`
      INSERT INTO nhom_thuc_pham (ten, slug, mo_ta, tao_luc, cap_nhat_luc)
      SELECT 'Trái cây', 'trai-cay', 'Nhóm hoa quả dùng trong bữa phụ và bữa chính.', NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM nhom_thuc_pham WHERE slug = 'trai-cay')
    `);
    await queryRunner.query(`
      INSERT INTO nhom_thuc_pham (ten, slug, mo_ta, tao_luc, cap_nhat_luc)
      SELECT 'Đồ uống', 'do-uong', 'Sữa, nước ép và các loại đồ uống có dinh dưỡng.', NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM nhom_thuc_pham WHERE slug = 'do-uong')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasFoodTable = await queryRunner.hasTable('thuc_pham');
    if (hasFoodTable) {
      await queryRunner.dropTable('thuc_pham', true);
    }

    const hasFoodGroupTable = await queryRunner.hasTable('nhom_thuc_pham');
    if (hasFoodGroupTable) {
      await queryRunner.dropTable('nhom_thuc_pham', true);
    }
  }
}
