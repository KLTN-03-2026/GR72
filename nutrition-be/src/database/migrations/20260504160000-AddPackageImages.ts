import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPackageImages20260504160000 implements MigrationInterface {
  name = 'AddPackageImages20260504160000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE goi_dich_vu ADD COLUMN thumbnail_url VARCHAR(500) NULL AFTER mo_ta");
    await queryRunner.query("ALTER TABLE goi_dich_vu ADD COLUMN banner_url VARCHAR(500) NULL AFTER thumbnail_url");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE goi_dich_vu DROP COLUMN banner_url');
    await queryRunner.query('ALTER TABLE goi_dich_vu DROP COLUMN thumbnail_url');
  }
}

