import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateDanhGiaTable1744203000000 implements MigrationInterface {
  name = 'CreateDanhGiaTable1744203000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('danh_gia');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'danh_gia',
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
              name: 'lich_hen_id',
              type: 'bigint',
              unsigned: true,
            },
            {
              name: 'tai_khoan_id',
              type: 'bigint',
              unsigned: true,
            },
            {
              name: 'chuyen_gia_dinh_duong_id',
              type: 'bigint',
              unsigned: true,
            },
            {
              name: 'diem',
              type: 'int',
              unsigned: true,
              comment: 'Diem 1-5 sao',
            },
            {
              name: 'noi_dung',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'tra_loi',
              type: 'text',
              isNullable: true,
              comment: 'Phan hoi tu Nutritionist',
            },
            {
              name: 'tra_loi_luc',
              type: 'datetime',
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
    }

    // Check & add unique index
    const indexes = await queryRunner.query(
      "SHOW INDEX FROM `danh_gia` WHERE Key_name = 'uq_danh_gia_lich_hen'",
    );
    if (indexes.length === 0) {
      await queryRunner.query(
        'CREATE UNIQUE INDEX `uq_danh_gia_lich_hen` ON `danh_gia` (`lich_hen_id`)',
      );
    }

    // Check & add FK lich_hen
    const fks1 = await queryRunner.query(
      "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'danh_gia' AND CONSTRAINT_NAME = 'fk_danh_gia_lich_hen'",
    );
    if (fks1.length === 0) {
      await queryRunner.createForeignKey(
        'danh_gia',
        new TableForeignKey({
          name: 'fk_danh_gia_lich_hen',
          columnNames: ['lich_hen_id'],
          referencedTableName: 'lich_hen',
          referencedColumnNames: ['id'],
        }),
      );
    }

    // Check & add FK tai_khoan
    const fks2 = await queryRunner.query(
      "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'danh_gia' AND CONSTRAINT_NAME = 'fk_danh_gia_tai_khoan'",
    );
    if (fks2.length === 0) {
      await queryRunner.createForeignKey(
        'danh_gia',
        new TableForeignKey({
          name: 'fk_danh_gia_tai_khoan',
          columnNames: ['tai_khoan_id'],
          referencedTableName: 'tai_khoan',
          referencedColumnNames: ['id'],
        }),
      );
    }

    // Check & add FK chuyen_gia
    const fks3 = await queryRunner.query(
      "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'danh_gia' AND CONSTRAINT_NAME = 'fk_danh_gia_chuyen_gia'",
    );
    if (fks3.length === 0) {
      await queryRunner.createForeignKey(
        'danh_gia',
        new TableForeignKey({
          name: 'fk_danh_gia_chuyen_gia',
          columnNames: ['chuyen_gia_dinh_duong_id'],
          referencedTableName: 'chuyen_gia_dinh_duong',
          referencedColumnNames: ['id'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('danh_gia', true);
  }
}
