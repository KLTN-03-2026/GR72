import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTuChoiToChuyenGiaStatus1744310000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE chuyen_gia_dinh_duong
      MODIFY COLUMN trang_thai
        ENUM('cho_duyet', 'tu_choi', 'hoat_dong', 'khong_hoat_dong', 'bi_khoa')
        NOT NULL DEFAULT 'cho_duyet'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE chuyen_gia_dinh_duong
      MODIFY COLUMN trang_thai
        ENUM('cho_duyet', 'hoat_dong', 'khong_hoat_dong', 'bi_khoa')
        NOT NULL DEFAULT 'cho_duyet'
    `);
  }
}
