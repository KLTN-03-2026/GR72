import { MigrationInterface, QueryRunner } from 'typeorm';

export class SyncRegistrationPaymentStatusEnum1744330000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('chuyen_gia_dinh_duong');
    if (!hasTable) {
      return;
    }

    const hasColumn = await queryRunner.hasColumn(
      'chuyen_gia_dinh_duong',
      'trang_thai_thanh_toan',
    );

    if (!hasColumn) {
      await queryRunner.query(`
        ALTER TABLE chuyen_gia_dinh_duong
        ADD COLUMN trang_thai_thanh_toan
          ENUM('chua_thanh_toan', 'dang_cho_thanh_toan', 'thanh_cong', 'that_bai', 'da_hoan')
          NOT NULL DEFAULT 'chua_thanh_toan'
        AFTER trang_thai
      `);
      return;
    }

    // Chuẩn hóa các giá trị cũ để không bị lỗi khi đổi enum.
    await queryRunner.query(`
      UPDATE chuyen_gia_dinh_duong
      SET trang_thai_thanh_toan = 'dang_cho_thanh_toan'
      WHERE trang_thai_thanh_toan = 'cho_thanh_toan'
    `);

    await queryRunner.query(`
      UPDATE chuyen_gia_dinh_duong
      SET trang_thai_thanh_toan = 'da_hoan'
      WHERE trang_thai_thanh_toan = 'da_hoan_tien'
    `);

    await queryRunner.query(`
      UPDATE chuyen_gia_dinh_duong
      SET trang_thai_thanh_toan = 'chua_thanh_toan'
      WHERE trang_thai_thanh_toan IS NULL OR trang_thai_thanh_toan = ''
    `);

    await queryRunner.query(`
      ALTER TABLE chuyen_gia_dinh_duong
      MODIFY COLUMN trang_thai_thanh_toan
        ENUM('chua_thanh_toan', 'dang_cho_thanh_toan', 'thanh_cong', 'that_bai', 'da_hoan')
        NOT NULL DEFAULT 'chua_thanh_toan'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('chuyen_gia_dinh_duong');
    if (!hasTable) {
      return;
    }

    const hasColumn = await queryRunner.hasColumn(
      'chuyen_gia_dinh_duong',
      'trang_thai_thanh_toan',
    );

    if (!hasColumn) {
      return;
    }

    await queryRunner.query(`
      UPDATE chuyen_gia_dinh_duong
      SET trang_thai_thanh_toan = 'cho_thanh_toan'
      WHERE trang_thai_thanh_toan = 'dang_cho_thanh_toan'
    `);

    await queryRunner.query(`
      UPDATE chuyen_gia_dinh_duong
      SET trang_thai_thanh_toan = 'da_hoan_tien'
      WHERE trang_thai_thanh_toan = 'da_hoan'
    `);

    await queryRunner.query(`
      ALTER TABLE chuyen_gia_dinh_duong
      MODIFY COLUMN trang_thai_thanh_toan
        ENUM('chua_thanh_toan', 'cho_thanh_toan', 'thanh_cong', 'that_bai', 'da_hoan_tien')
        NOT NULL DEFAULT 'chua_thanh_toan'
    `);
  }
}
