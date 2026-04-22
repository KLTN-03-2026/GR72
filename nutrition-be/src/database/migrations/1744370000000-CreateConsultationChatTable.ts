import { Table, TableForeignKey, type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreateConsultationChatTable1744370000000
  implements MigrationInterface
{
  name = 'CreateConsultationChatTable1744370000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('tin_nhan'))) {
      await queryRunner.createTable(
        new Table({
          name: 'tin_nhan',
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
            { name: 'nguoi_gui_id', type: 'bigint', unsigned: true },
            {
              name: 'loai',
              type: 'enum',
              enum: ['text', 'file'],
              default: "'text'",
            },
            { name: 'noi_dung', type: 'text', isNullable: true },
            { name: 'tep_dinh_kem', type: 'json', isNullable: true },
            { name: 'tao_luc', type: 'datetime' },
            { name: 'cap_nhat_luc', type: 'datetime' },
          ],
          indices: [
            {
              name: 'idx_tin_nhan_lich_hen_tao_luc',
              columnNames: ['lich_hen_id', 'tao_luc'],
            },
          ],
        }),
      );

      await queryRunner.createForeignKey(
        'tin_nhan',
        new TableForeignKey({
          name: 'fk_tin_nhan_lich_hen',
          columnNames: ['lich_hen_id'],
          referencedTableName: 'lich_hen',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'tin_nhan',
        new TableForeignKey({
          name: 'fk_tin_nhan_nguoi_gui',
          columnNames: ['nguoi_gui_id'],
          referencedTableName: 'tai_khoan',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('tin_nhan'))) {
      return;
    }

    await queryRunner.dropForeignKey('tin_nhan', 'fk_tin_nhan_lich_hen');
    await queryRunner.dropForeignKey('tin_nhan', 'fk_tin_nhan_nguoi_gui');
    await queryRunner.dropTable('tin_nhan');
  }
}
