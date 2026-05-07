import type { TableSeeder } from '../types';

// Password: Nutrition@123 (bcrypt hash)
const HASH = '$2b$10$sz8c4k6en.5PpVQpsASjFO0MWWQXvfksD89UwUuFXspbhd5P6I.Aq';

const tai_khoanSeeder: TableSeeder = {
  table: 'tai_khoan',
  rows: [
    // ── Admins (id 1-2) ──────────────────────────────────
    {
      id: 1, email: 'admin@nutrition.vn', mat_khau_ma_hoa: HASH, vai_tro: 'admin',
      trang_thai: 'hoat_dong', ho_ten: 'Nguyễn Quản Trị', so_dien_thoai: '0900000001',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: '2026-05-06 08:00:00',
      tao_luc: '2026-01-01 08:00:00', cap_nhat_luc: '2026-01-01 08:00:00', xoa_luc: null,
    },
    {
      id: 2, email: 'admin2@nutrition.vn', mat_khau_ma_hoa: HASH, vai_tro: 'admin',
      trang_thai: 'hoat_dong', ho_ten: 'Trần Hệ Thống', so_dien_thoai: '0900000002',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: '2026-05-05 10:00:00',
      tao_luc: '2026-01-01 08:00:00', cap_nhat_luc: '2026-01-01 08:00:00', xoa_luc: null,
    },

    // ── Chuyên gia (id 3-10) ─────────────────────────────
    {
      id: 3, email: 'expert1@nutrition.vn', mat_khau_ma_hoa: HASH, vai_tro: 'expert',
      trang_thai: 'hoat_dong', ho_ten: 'ThS. Lê Minh Phương', so_dien_thoai: '0911000001',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: '2026-05-07 07:30:00',
      tao_luc: '2026-01-02 08:00:00', cap_nhat_luc: '2026-01-02 08:00:00', xoa_luc: null,
    },
    {
      id: 4, email: 'expert2@nutrition.vn', mat_khau_ma_hoa: HASH, vai_tro: 'expert',
      trang_thai: 'hoat_dong', ho_ten: 'BS. Nguyễn Thu Hà', so_dien_thoai: '0911000002',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: '2026-05-06 09:00:00',
      tao_luc: '2026-01-02 08:00:00', cap_nhat_luc: '2026-01-02 08:00:00', xoa_luc: null,
    },
    {
      id: 5, email: 'expert3@nutrition.vn', mat_khau_ma_hoa: HASH, vai_tro: 'expert',
      trang_thai: 'hoat_dong', ho_ten: 'PT. Trần Văn Khải', so_dien_thoai: '0911000003',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: '2026-05-05 08:00:00',
      tao_luc: '2026-01-02 08:00:00', cap_nhat_luc: '2026-01-02 08:00:00', xoa_luc: null,
    },
    {
      id: 6, email: 'expert4@nutrition.vn', mat_khau_ma_hoa: HASH, vai_tro: 'expert',
      trang_thai: 'hoat_dong', ho_ten: 'ThS. Phạm Ngọc Linh', so_dien_thoai: '0911000004',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: '2026-05-04 14:00:00',
      tao_luc: '2026-01-03 08:00:00', cap_nhat_luc: '2026-01-03 08:00:00', xoa_luc: null,
    },
    {
      id: 7, email: 'expert5@nutrition.vn', mat_khau_ma_hoa: HASH, vai_tro: 'expert',
      trang_thai: 'hoat_dong', ho_ten: 'TS. Vũ Thị Mai Anh', so_dien_thoai: '0911000005',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: '2026-05-06 16:00:00',
      tao_luc: '2026-01-03 08:00:00', cap_nhat_luc: '2026-01-03 08:00:00', xoa_luc: null,
    },
    {
      id: 8, email: 'expert6@nutrition.vn', mat_khau_ma_hoa: HASH, vai_tro: 'expert',
      trang_thai: 'hoat_dong', ho_ten: 'BS. Đỗ Thanh Bình', so_dien_thoai: '0911000006',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: '2026-05-03 10:00:00',
      tao_luc: '2026-01-04 08:00:00', cap_nhat_luc: '2026-01-04 08:00:00', xoa_luc: null,
    },
    {
      id: 9, email: 'expert7@nutrition.vn', mat_khau_ma_hoa: HASH, vai_tro: 'expert',
      trang_thai: 'khong_hoat_dong', ho_ten: 'CN. Hoàng Bảo Trâm', so_dien_thoai: '0911000007',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: null,
      tao_luc: '2026-04-20 08:00:00', cap_nhat_luc: '2026-04-20 08:00:00', xoa_luc: null,
    },
    {
      id: 10, email: 'expert8@nutrition.vn', mat_khau_ma_hoa: HASH, vai_tro: 'expert',
      trang_thai: 'hoat_dong', ho_ten: 'ThS. Lý Quốc Bảo', so_dien_thoai: '0911000008',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: '2026-05-01 09:00:00',
      tao_luc: '2026-01-05 08:00:00', cap_nhat_luc: '2026-01-05 08:00:00', xoa_luc: null,
    },

    // ── Khách hàng (id 11-25) ────────────────────────────
    {
      id: 11, email: 'customer1@gmail.com', mat_khau_ma_hoa: HASH, vai_tro: 'customer',
      trang_thai: 'hoat_dong', ho_ten: 'Nguyễn Thị Lan', so_dien_thoai: '0921000001',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: '2026-05-06 20:00:00',
      tao_luc: '2026-02-01 08:00:00', cap_nhat_luc: '2026-02-01 08:00:00', xoa_luc: null,
    },
    {
      id: 12, email: 'customer2@gmail.com', mat_khau_ma_hoa: HASH, vai_tro: 'customer',
      trang_thai: 'hoat_dong', ho_ten: 'Trần Minh Tuấn', so_dien_thoai: '0921000002',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: '2026-05-05 19:00:00',
      tao_luc: '2026-02-02 08:00:00', cap_nhat_luc: '2026-02-02 08:00:00', xoa_luc: null,
    },
    {
      id: 13, email: 'customer3@gmail.com', mat_khau_ma_hoa: HASH, vai_tro: 'customer',
      trang_thai: 'hoat_dong', ho_ten: 'Lê Thị Hoa', so_dien_thoai: '0921000003',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: '2026-05-07 08:00:00',
      tao_luc: '2026-02-05 08:00:00', cap_nhat_luc: '2026-02-05 08:00:00', xoa_luc: null,
    },
    {
      id: 14, email: 'customer4@gmail.com', mat_khau_ma_hoa: HASH, vai_tro: 'customer',
      trang_thai: 'hoat_dong', ho_ten: 'Phạm Văn Hùng', so_dien_thoai: '0921000004',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: '2026-05-04 10:00:00',
      tao_luc: '2026-02-08 08:00:00', cap_nhat_luc: '2026-02-08 08:00:00', xoa_luc: null,
    },
    {
      id: 15, email: 'customer5@gmail.com', mat_khau_ma_hoa: HASH, vai_tro: 'customer',
      trang_thai: 'hoat_dong', ho_ten: 'Hoàng Thị Thu', so_dien_thoai: '0921000005',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: '2026-05-06 11:00:00',
      tao_luc: '2026-02-10 08:00:00', cap_nhat_luc: '2026-02-10 08:00:00', xoa_luc: null,
    },
    {
      id: 16, email: 'customer6@gmail.com', mat_khau_ma_hoa: HASH, vai_tro: 'customer',
      trang_thai: 'hoat_dong', ho_ten: 'Vũ Đình Nam', so_dien_thoai: '0921000006',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: '2026-05-03 18:00:00',
      tao_luc: '2026-02-15 08:00:00', cap_nhat_luc: '2026-02-15 08:00:00', xoa_luc: null,
    },
    {
      id: 17, email: 'customer7@gmail.com', mat_khau_ma_hoa: HASH, vai_tro: 'customer',
      trang_thai: 'hoat_dong', ho_ten: 'Đặng Thị Bích Ngọc', so_dien_thoai: '0921000007',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: '2026-05-05 21:00:00',
      tao_luc: '2026-02-20 08:00:00', cap_nhat_luc: '2026-02-20 08:00:00', xoa_luc: null,
    },
    {
      id: 18, email: 'customer8@gmail.com', mat_khau_ma_hoa: HASH, vai_tro: 'customer',
      trang_thai: 'hoat_dong', ho_ten: 'Bùi Quang Hải', so_dien_thoai: '0921000008',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: '2026-05-02 09:00:00',
      tao_luc: '2026-03-01 08:00:00', cap_nhat_luc: '2026-03-01 08:00:00', xoa_luc: null,
    },
    {
      id: 19, email: 'customer9@gmail.com', mat_khau_ma_hoa: HASH, vai_tro: 'customer',
      trang_thai: 'hoat_dong', ho_ten: 'Đinh Thị Phương Thảo', so_dien_thoai: '0921000009',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: '2026-05-06 15:00:00',
      tao_luc: '2026-03-05 08:00:00', cap_nhat_luc: '2026-03-05 08:00:00', xoa_luc: null,
    },
    {
      id: 20, email: 'customer10@gmail.com', mat_khau_ma_hoa: HASH, vai_tro: 'customer',
      trang_thai: 'hoat_dong', ho_ten: 'Ngô Thanh Tùng', so_dien_thoai: '0921000010',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: '2026-05-01 20:00:00',
      tao_luc: '2026-03-10 08:00:00', cap_nhat_luc: '2026-03-10 08:00:00', xoa_luc: null,
    },
    {
      id: 21, email: 'customer11@gmail.com', mat_khau_ma_hoa: HASH, vai_tro: 'customer',
      trang_thai: 'hoat_dong', ho_ten: 'Phan Thị Khánh Linh', so_dien_thoai: '0921000011',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: '2026-04-28 10:00:00',
      tao_luc: '2026-03-15 08:00:00', cap_nhat_luc: '2026-03-15 08:00:00', xoa_luc: null,
    },
    {
      id: 22, email: 'customer12@gmail.com', mat_khau_ma_hoa: HASH, vai_tro: 'customer',
      trang_thai: 'hoat_dong', ho_ten: 'Lưu Minh Đức', so_dien_thoai: '0921000012',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: '2026-04-25 08:00:00',
      tao_luc: '2026-03-20 08:00:00', cap_nhat_luc: '2026-03-20 08:00:00', xoa_luc: null,
    },
    {
      id: 23, email: 'customer13@gmail.com', mat_khau_ma_hoa: HASH, vai_tro: 'customer',
      trang_thai: 'hoat_dong', ho_ten: 'Cao Thị Thanh Mai', so_dien_thoai: '0921000013',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: '2026-05-06 17:00:00',
      tao_luc: '2026-04-01 08:00:00', cap_nhat_luc: '2026-04-01 08:00:00', xoa_luc: null,
    },
    {
      id: 24, email: 'customer14@gmail.com', mat_khau_ma_hoa: HASH, vai_tro: 'customer',
      trang_thai: 'hoat_dong', ho_ten: 'Tống Quốc Việt', so_dien_thoai: '0921000014',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: '2026-05-05 12:00:00',
      tao_luc: '2026-04-05 08:00:00', cap_nhat_luc: '2026-04-05 08:00:00', xoa_luc: null,
    },
    {
      id: 25, email: 'customer15@gmail.com', mat_khau_ma_hoa: HASH, vai_tro: 'customer',
      trang_thai: 'bi_khoa', ho_ten: 'Trương Thị Ngân', so_dien_thoai: '0921000015',
      ma_dat_lai_mat_khau: null, het_han_ma_dat_lai: null, dang_nhap_cuoi_luc: '2026-03-01 08:00:00',
      tao_luc: '2026-02-01 08:00:00', cap_nhat_luc: '2026-04-01 08:00:00', xoa_luc: null,
    },
  ],
};

export default tai_khoanSeeder;
