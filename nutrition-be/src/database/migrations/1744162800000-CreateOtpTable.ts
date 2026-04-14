import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOtpTable1744162800000 implements MigrationInterface {
  name = 'CreateOtpTable1744162800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE otp (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        email VARCHAR(191) NOT NULL,
        ma_otp VARCHAR(10) NOT NULL,
        loai ENUM('xac_thuc', 'dat_lai_mat_khau') NOT NULL,
        da_su_dung TINYINT NOT NULL DEFAULT 0,
        het_han_luc DATETIME NOT NULL,
        tao_luc DATETIME NOT NULL,
        INDEX idx_otp_email (email),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE otp`);
  }
}
