import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRegistrationPaymentFields1744320000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Thêm cột trạng thái thanh toán vào bảng chuyen_gia_dinh_duong
    await queryRunner.query(`
      ALTER TABLE chuyen_gia_dinh_duong
      ADD COLUMN trang_thai_thanh_toan
        ENUM('chua_thanh_toan', 'dang_cho_thanh_toan', 'thanh_cong', 'that_bai', 'da_hoan')
        DEFAULT 'chua_thanh_toan'
      AFTER trang_thai
    `);

    // 2. Thêm cột transaction ref cho VNPay
    await queryRunner.query(`
      ALTER TABLE chuyen_gia_dinh_duong
      ADD COLUMN vnp_txn_ref VARCHAR(100) NULL
      AFTER trang_thai_thanh_toan
    `);

    await queryRunner.query(`
      ALTER TABLE chuyen_gia_dinh_duong
      ADD COLUMN vnp_transaction_no VARCHAR(100) NULL
      AFTER vnp_txn_ref
    `);

    await queryRunner.query(`
      ALTER TABLE chuyen_gia_dinh_duong
      ADD COLUMN ngay_thanh_toan DATETIME NULL
      AFTER vnp_transaction_no
    `);

    // 3. Thêm cột phiên thanh toán để tránh duplicate
    await queryRunner.query(`
      ALTER TABLE chuyen_gia_dinh_duong
      ADD COLUMN lan_thanh_toan INT UNSIGNED DEFAULT 0
      AFTER ngay_thanh_toan
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE chuyen_gia_dinh_duong
      DROP COLUMN lan_thanh_toan
    `);
    await queryRunner.query(`
      ALTER TABLE chuyen_gia_dinh_duong
      DROP COLUMN ngay_thanh_toan
    `);
    await queryRunner.query(`
      ALTER TABLE chuyen_gia_dinh_duong
      DROP COLUMN vnp_transaction_no
    `);
    await queryRunner.query(`
      ALTER TABLE chuyen_gia_dinh_duong
      DROP COLUMN vnp_txn_ref
    `);
    await queryRunner.query(`
      ALTER TABLE chuyen_gia_dinh_duong
      DROP COLUMN trang_thai_thanh_toan
    `);
  }
}
