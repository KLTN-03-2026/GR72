import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableForeignKey } from 'typeorm';

export class CreateAdminTables1744200000000 implements MigrationInterface {
  name = 'CreateAdminTables1744200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // === chuyen_gia_dinh_duong ===
    if (!(await queryRunner.hasTable('chuyen_gia_dinh_duong'))) {
      await queryRunner.createTable(
        new Table({
          name: 'chuyen_gia_dinh_duong',
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
            { name: 'chuyen_mon', type: 'text', isNullable: true },
            { name: 'mo_ta', type: 'text', isNullable: true },
            { name: 'kinh_nghiem', type: 'text', isNullable: true },
            { name: 'hoc_vi', type: 'varchar', length: '100', isNullable: true },
            {
              name: 'chung_chi',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'gio_lam_viec',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'anh_dai_dien_url',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'trang_thai',
              type: 'enum',
              enum: ['cho_duyet', 'hoat_dong', 'khong_hoat_dong', 'bi_khoa'],
              default: "'cho_duyet'",
            },
            {
              name: 'diem_danh_gia_trung_binh',
              type: 'decimal',
              precision: 3,
              scale: 2,
              isNullable: true,
              default: 0,
            },
            {
              name: 'so_luot_danh_gia',
              type: 'int',
              unsigned: true,
              default: 0,
            },
            {
              name: 'ly_do_tu_choi',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'ly_do_bi_khoa',
              type: 'text',
              isNullable: true,
            },
            { name: 'ngay_duyet', type: 'datetime', isNullable: true },
            { name: 'ngay_bi_khoa', type: 'datetime', isNullable: true },
            {
              name: 'ngay_kich_hoat_lai',
              type: 'datetime',
              isNullable: true,
            },
            { name: 'tao_luc', type: 'datetime' },
            { name: 'cap_nhat_luc', type: 'datetime' },
          ],
        }),
        true,
      );
      await queryRunner.createForeignKey(
        'chuyen_gia_dinh_duong',
        new TableForeignKey({
          name: 'fk_cgdd_tai_khoan',
          columnNames: ['tai_khoan_id'],
          referencedTableName: 'tai_khoan',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
    }

    // === goi_tu_van ===
    if (!(await queryRunner.hasTable('goi_tu_van'))) {
      await queryRunner.createTable(
        new Table({
          name: 'goi_tu_van',
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
              name: 'chuyen_gia_dinh_duong_id',
              type: 'bigint',
              unsigned: true,
            },
            { name: 'ten', type: 'varchar', length: '191' },
            { name: 'mo_ta', type: 'text', isNullable: true },
            { name: 'gia', type: 'decimal', precision: 12, scale: 2, default: 0 },
            {
              name: 'thoi_luong_phut',
              type: 'int',
              unsigned: true,
              default: 30,
            },
            {
              name: 'so_lan_dung_mien_phi',
              type: 'int',
              unsigned: true,
              default: 0,
            },
            {
              name: 'trang_thai',
              type: 'enum',
              enum: ['ban_nhap', 'dang_ban', 'ngung_ban'],
              default: "'ban_nhap'",
            },
            { name: 'tao_luc', type: 'datetime' },
            { name: 'cap_nhat_luc', type: 'datetime' },
            { name: 'xoa_luc', type: 'datetime', isNullable: true },
          ],
        }),
        true,
      );
      await queryRunner.createForeignKey(
        'goi_tu_van',
        new TableForeignKey({
          name: 'fk_gtv_chuyen_gia',
          columnNames: ['chuyen_gia_dinh_duong_id'],
          referencedTableName: 'chuyen_gia_dinh_duong',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
    }

    // === lich_hen ===
    if (!(await queryRunner.hasTable('lich_hen'))) {
      await queryRunner.createTable(
        new Table({
          name: 'lich_hen',
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
              name: 'chuyen_gia_dinh_duong_id',
              type: 'bigint',
              unsigned: true,
            },
            { name: 'tai_khoan_id', type: 'bigint', unsigned: true },
            { name: 'goi_tu_van_id', type: 'bigint', unsigned: true },
            { name: 'ma_lich_hen', type: 'varchar', length: '50', isUnique: true },
            { name: 'muc_dich', type: 'text', isNullable: true },
            { name: 'ngay_hen', type: 'date' },
            { name: 'gio_bat_dau', type: 'time' },
            { name: 'gio_ket_thuc', type: 'time' },
            { name: 'dia_diem', type: 'varchar', length: '255', isNullable: true },
            {
              name: 'trang_thai',
              type: 'enum',
              enum: [
                'cho_thanh_toan',
                'da_xac_nhan',
                'da_checkin',
                'dang_tu_van',
                'hoan_thanh',
                'da_huy',
                'vo_hieu_hoa',
              ],
              default: "'cho_thanh_toan'",
            },
            { name: 'ly_do_huy', type: 'text', isNullable: true },
            { name: 'huy_boi', type: 'bigint', unsigned: true, isNullable: true },
            { name: 'huy_luc', type: 'datetime', isNullable: true },
            {
              name: 'ghi_chu_nutritionist',
              type: 'text',
              isNullable: true,
            },
            { name: 'tao_luc', type: 'datetime' },
            { name: 'cap_nhat_luc', type: 'datetime' },
          ],
        }),
        true,
      );
      await queryRunner.createForeignKey(
        'lich_hen',
        new TableForeignKey({
          name: 'fk_lh_chuyen_gia',
          columnNames: ['chuyen_gia_dinh_duong_id'],
          referencedTableName: 'chuyen_gia_dinh_duong',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
      await queryRunner.createForeignKey(
        'lich_hen',
        new TableForeignKey({
          name: 'fk_lh_tai_khoan',
          columnNames: ['tai_khoan_id'],
          referencedTableName: 'tai_khoan',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
      await queryRunner.createForeignKey(
        'lich_hen',
        new TableForeignKey({
          name: 'fk_lh_goi_tu_van',
          columnNames: ['goi_tu_van_id'],
          referencedTableName: 'goi_tu_van',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
    }

    // === thanh_toan_tu_van ===
    if (!(await queryRunner.hasTable('thanh_toan_tu_van'))) {
      await queryRunner.createTable(
        new Table({
          name: 'thanh_toan_tu_van',
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
            { name: 'tai_khoan_id', type: 'bigint', unsigned: true },
            {
              name: 'ma_giao_dich',
              type: 'varchar',
              length: '150',
              isUnique: true,
            },
            {
              name: 'phuong_thuc',
              type: 'enum',
              enum: ['vnpay', 'chuyen_khoan', 'vi_dien_tu', 'thu_cong', 'mien_phi'],
              default: "'vnpay'",
            },
            { name: 'so_tien', type: 'decimal', precision: 12, scale: 2 },
            {
              name: 'trang_thai',
              type: 'enum',
              enum: ['cho_thanh_toan', 'dang_xu_ly', 'thanh_cong', 'that_bai', 'da_hoan_tien'],
              default: "'cho_thanh_toan'",
            },
            {
              name: 'thanh_toan_luc',
              type: 'datetime',
              isNullable: true,
            },
            {
              name: 'du_lieu_thanh_toan',
              type: 'json',
              isNullable: true,
            },
            {
              name: 'xac_nhan_boi',
              type: 'bigint',
              unsigned: true,
              isNullable: true,
            },
            {
              name: 'xac_nhan_luc',
              type: 'datetime',
              isNullable: true,
            },
            { name: 'tao_luc', type: 'datetime' },
            { name: 'cap_nhat_luc', type: 'datetime' },
          ],
        }),
        true,
      );
      await queryRunner.createForeignKey(
        'thanh_toan_tu_van',
        new TableForeignKey({
          name: 'fk_ttv_lich_hen',
          columnNames: ['lich_hen_id'],
          referencedTableName: 'lich_hen',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
      await queryRunner.createForeignKey(
        'thanh_toan_tu_van',
        new TableForeignKey({
          name: 'fk_ttv_tai_khoan',
          columnNames: ['tai_khoan_id'],
          referencedTableName: 'tai_khoan',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('thanh_toan_tu_van', true);
    await queryRunner.dropTable('lich_hen', true);
    await queryRunner.dropTable('goi_tu_van', true);
    await queryRunner.dropTable('chuyen_gia_dinh_duong', true);
  }
}
