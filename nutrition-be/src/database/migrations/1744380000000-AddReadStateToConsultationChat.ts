import {
  TableColumn,
  TableForeignKey,
  TableIndex,
  type MigrationInterface,
  type QueryRunner,
} from 'typeorm';

export class AddReadStateToConsultationChat1744380000000
  implements MigrationInterface
{
  name = 'AddReadStateToConsultationChat1744380000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('tin_nhan'))) {
      return;
    }

    const table = await queryRunner.getTable('tin_nhan');

    if (table && !table.findColumnByName('da_doc_luc')) {
      await queryRunner.addColumn(
        'tin_nhan',
        new TableColumn({
          name: 'da_doc_luc',
          type: 'datetime',
          isNullable: true,
        }),
      );
    }

    if (table && !table.findColumnByName('da_doc_boi_id')) {
      await queryRunner.addColumn(
        'tin_nhan',
        new TableColumn({
          name: 'da_doc_boi_id',
          type: 'bigint',
          unsigned: true,
          isNullable: true,
        }),
      );
    }

    if (table && !table.indices.some((index) => index.name === 'idx_tin_nhan_lich_hen_doc')) {
      await queryRunner.createIndex(
        'tin_nhan',
        new TableIndex({
          name: 'idx_tin_nhan_lich_hen_doc',
          columnNames: ['lich_hen_id', 'da_doc_luc'],
        }),
      );
    }

    const refreshedTable = await queryRunner.getTable('tin_nhan');
    const hasDaDocBoiFk = refreshedTable?.foreignKeys.some(
      (foreignKey) => foreignKey.name === 'fk_tin_nhan_da_doc_boi',
    );

    if (!hasDaDocBoiFk) {
      await queryRunner.createForeignKey(
        'tin_nhan',
        new TableForeignKey({
          name: 'fk_tin_nhan_da_doc_boi',
          columnNames: ['da_doc_boi_id'],
          referencedTableName: 'tai_khoan',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('tin_nhan'))) {
      return;
    }

    const table = await queryRunner.getTable('tin_nhan');
    const hasDaDocBoiFk = table?.foreignKeys.some(
      (foreignKey) => foreignKey.name === 'fk_tin_nhan_da_doc_boi',
    );

    if (hasDaDocBoiFk) {
      await queryRunner.dropForeignKey('tin_nhan', 'fk_tin_nhan_da_doc_boi');
    }

    const hasIndex = table?.indices.some(
      (index) => index.name === 'idx_tin_nhan_lich_hen_doc',
    );

    if (hasIndex) {
      await queryRunner.dropIndex('tin_nhan', 'idx_tin_nhan_lich_hen_doc');
    }

    if (table?.findColumnByName('da_doc_boi_id')) {
      await queryRunner.dropColumn('tin_nhan', 'da_doc_boi_id');
    }

    if (table?.findColumnByName('da_doc_luc')) {
      await queryRunner.dropColumn('tin_nhan', 'da_doc_luc');
    }
  }
}
