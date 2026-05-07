import type { TableSeeder } from '../types';

const goi_da_muaSeeder: TableSeeder = {
  table: 'goi_da_mua',
  rows: [
    // Customer 1 (11) - gói 1 (3 buổi - 499k) - đang dùng còn 1 buổi
    { id: 1,  tai_khoan_id: 11, goi_dich_vu_id: 1,  ma_goi_da_mua: 'PURCH_001', trang_thai: 'dang_hieu_luc', gia_mua: 499000,  so_luot_tong: 3,  so_luot_da_dung: 2, so_luot_con_lai: 1, bat_dau_luc: '2026-01-16 10:05:00', het_han_luc: '2026-07-16 23:59:59', khoa_luc: null, ly_do_khoa: null, tao_luc: '2026-01-16 10:05:00', cap_nhat_luc: '2026-04-01 10:00:00' },
    // Customer 2 (12) - gói 6 (6 buổi - 1.49M) - đang dùng
    { id: 2,  tai_khoan_id: 12, goi_dich_vu_id: 6,  ma_goi_da_mua: 'PURCH_002', trang_thai: 'dang_hieu_luc', gia_mua: 1490000, so_luot_tong: 6,  so_luot_da_dung: 3, so_luot_con_lai: 3, bat_dau_luc: '2026-01-21 09:15:00', het_han_luc: '2026-07-21 23:59:59', khoa_luc: null, ly_do_khoa: null, tao_luc: '2026-01-21 09:15:00', cap_nhat_luc: '2026-04-15 10:00:00' },
    // Customer 3 (13) - gói 7 (3 buổi - 599k) - đã dùng hết
    { id: 3,  tai_khoan_id: 13, goi_dich_vu_id: 7,  ma_goi_da_mua: 'PURCH_003', trang_thai: 'het_luot', gia_mua: 599000,  so_luot_tong: 3,  so_luot_da_dung: 3, so_luot_con_lai: 0, bat_dau_luc: '2026-02-02 11:00:00', het_han_luc: '2026-08-02 23:59:59', khoa_luc: null, ly_do_khoa: null, tao_luc: '2026-02-02 11:00:00', cap_nhat_luc: '2026-04-15 09:00:00' },
    // Customer 4 (14) - gói 3 (6 buổi - 1.19M) - đang dùng
    { id: 4,  tai_khoan_id: 14, goi_dich_vu_id: 3,  ma_goi_da_mua: 'PURCH_004', trang_thai: 'dang_hieu_luc', gia_mua: 1190000, so_luot_tong: 6,  so_luot_da_dung: 2, so_luot_con_lai: 4, bat_dau_luc: '2026-01-11 14:30:00', het_han_luc: '2026-07-11 23:59:59', khoa_luc: null, ly_do_khoa: null, tao_luc: '2026-01-11 14:30:00', cap_nhat_luc: '2026-04-10 09:00:00' },
    // Customer 5 (15) - gói 2 (3 buổi - 649k) - đang dùng còn 2 buổi
    { id: 5,  tai_khoan_id: 15, goi_dich_vu_id: 2,  ma_goi_da_mua: 'PURCH_005', trang_thai: 'dang_hieu_luc', gia_mua: 649000,  so_luot_tong: 3,  so_luot_da_dung: 1, so_luot_con_lai: 2, bat_dau_luc: '2026-02-11 16:00:00', het_han_luc: '2026-08-11 23:59:59', khoa_luc: null, ly_do_khoa: null, tao_luc: '2026-02-11 16:00:00', cap_nhat_luc: '2026-04-05 10:00:00' },
    // Customer 6 (16) - gói 11 (12 buổi - 3.5M) - đang dùng
    { id: 6,  tai_khoan_id: 16, goi_dich_vu_id: 11, ma_goi_da_mua: 'PURCH_006', trang_thai: 'dang_hieu_luc', gia_mua: 3500000, so_luot_tong: 12, so_luot_da_dung: 4, so_luot_con_lai: 8, bat_dau_luc: '2026-01-26 09:30:00', het_han_luc: '2026-07-26 23:59:59', khoa_luc: null, ly_do_khoa: null, tao_luc: '2026-01-26 09:30:00', cap_nhat_luc: '2026-04-20 09:00:00' },
    // Customer 7 (17) - gói 9 (6 buổi - 890k) - đang dùng còn 4 buổi
    { id: 7,  tai_khoan_id: 17, goi_dich_vu_id: 9,  ma_goi_da_mua: 'PURCH_007', trang_thai: 'dang_hieu_luc', gia_mua: 890000,  so_luot_tong: 6,  so_luot_da_dung: 2, so_luot_con_lai: 4, bat_dau_luc: '2026-02-06 08:45:00', het_han_luc: '2026-08-06 23:59:59', khoa_luc: null, ly_do_khoa: null, tao_luc: '2026-02-06 08:45:00', cap_nhat_luc: '2026-04-10 10:00:00' },
    // Customer 8 (18) - gói 2 (3 buổi - 649k) - mới mua chưa dùng
    { id: 8,  tai_khoan_id: 18, goi_dich_vu_id: 2,  ma_goi_da_mua: 'PURCH_008', trang_thai: 'dang_hieu_luc', gia_mua: 649000,  so_luot_tong: 3,  so_luot_da_dung: 0, so_luot_con_lai: 3, bat_dau_luc: '2026-03-02 10:30:00', het_han_luc: '2026-09-02 23:59:59', khoa_luc: null, ly_do_khoa: null, tao_luc: '2026-03-02 10:30:00', cap_nhat_luc: '2026-03-02 10:30:00' },
    // Customer 9 (19) - gói 5 (1 buổi - 249k) - đã dùng xong
    { id: 9,  tai_khoan_id: 19, goi_dich_vu_id: 5,  ma_goi_da_mua: 'PURCH_009', trang_thai: 'het_luot', gia_mua: 249000,  so_luot_tong: 1,  so_luot_da_dung: 1, so_luot_con_lai: 0, bat_dau_luc: '2026-02-21 13:10:00', het_han_luc: '2026-08-21 23:59:59', khoa_luc: null, ly_do_khoa: null, tao_luc: '2026-02-21 13:10:00', cap_nhat_luc: '2026-03-05 09:45:00' },
    // Customer 10 (20) - gói 10 (6 buổi - 990k) - đang dùng còn 3 buổi
    { id: 10, tai_khoan_id: 20, goi_dich_vu_id: 10, ma_goi_da_mua: 'PURCH_010', trang_thai: 'dang_hieu_luc', gia_mua: 990000,  so_luot_tong: 6,  so_luot_da_dung: 3, so_luot_con_lai: 3, bat_dau_luc: '2026-01-19 11:00:00', het_han_luc: '2026-07-19 23:59:59', khoa_luc: null, ly_do_khoa: null, tao_luc: '2026-01-19 11:00:00', cap_nhat_luc: '2026-04-15 09:00:00' },
    // Customer 11 (21) - gói 5 (1 buổi - 249k) - đã dùng xong
    { id: 11, tai_khoan_id: 21, goi_dich_vu_id: 5,  ma_goi_da_mua: 'PURCH_011', trang_thai: 'het_luot', gia_mua: 249000,  so_luot_tong: 1,  so_luot_da_dung: 1, so_luot_con_lai: 0, bat_dau_luc: '2026-03-06 14:00:00', het_han_luc: '2026-09-06 23:59:59', khoa_luc: null, ly_do_khoa: null, tao_luc: '2026-03-06 14:00:00', cap_nhat_luc: '2026-03-20 10:00:00' },
    // Customer 12 (22) - gói 4 (12 buổi - 2.19M) - đang dùng còn 8 buổi
    { id: 12, tai_khoan_id: 22, goi_dich_vu_id: 4,  ma_goi_da_mua: 'PURCH_012', trang_thai: 'dang_hieu_luc', gia_mua: 2190000, so_luot_tong: 12, so_luot_da_dung: 4, so_luot_con_lai: 8, bat_dau_luc: '2026-02-16 09:30:00', het_han_luc: '2026-08-16 23:59:59', khoa_luc: null, ly_do_khoa: null, tao_luc: '2026-02-16 09:30:00', cap_nhat_luc: '2026-05-01 09:00:00' },
    // Customer 13 (23) - gói 2 (3 buổi - 649k) - đang dùng còn 2 buổi
    { id: 13, tai_khoan_id: 23, goi_dich_vu_id: 2,  ma_goi_da_mua: 'PURCH_013', trang_thai: 'dang_hieu_luc', gia_mua: 649000,  so_luot_tong: 3,  so_luot_da_dung: 1, so_luot_con_lai: 2, bat_dau_luc: '2026-03-11 10:30:00', het_han_luc: '2026-09-11 23:59:59', khoa_luc: null, ly_do_khoa: null, tao_luc: '2026-03-11 10:30:00', cap_nhat_luc: '2026-04-15 09:00:00' },
    // Customer 14 (24) - gói 3 (6 buổi - 1.19M) - đang dùng còn 5 buổi
    { id: 14, tai_khoan_id: 24, goi_dich_vu_id: 3,  ma_goi_da_mua: 'PURCH_014', trang_thai: 'dang_hieu_luc', gia_mua: 1190000, so_luot_tong: 6,  so_luot_da_dung: 1, so_luot_con_lai: 5, bat_dau_luc: '2026-03-16 15:00:00', het_han_luc: '2026-09-16 23:59:59', khoa_luc: null, ly_do_khoa: null, tao_luc: '2026-03-16 15:00:00', cap_nhat_luc: '2026-04-20 10:00:00' },
    // Customer 1 mua thêm gói 11 (12 buổi - 3.5M) - mới mua chưa dùng
    { id: 15, tai_khoan_id: 11, goi_dich_vu_id: 11, ma_goi_da_mua: 'PURCH_015', trang_thai: 'dang_hieu_luc', gia_mua: 3500000, so_luot_tong: 12, so_luot_da_dung: 0, so_luot_con_lai: 12, bat_dau_luc: '2026-04-01 09:00:00', het_han_luc: '2026-10-01 23:59:59', khoa_luc: null, ly_do_khoa: null, tao_luc: '2026-04-01 09:00:00', cap_nhat_luc: '2026-04-01 09:00:00' },
    // Customer 2 mua thêm gói 1 - sau đó bị refund
    { id: 16, tai_khoan_id: 12, goi_dich_vu_id: 1,  ma_goi_da_mua: 'PURCH_016', trang_thai: 'da_hoan_tien', gia_mua: 499000, so_luot_tong: 3, so_luot_da_dung: 0, so_luot_con_lai: 0, bat_dau_luc: '2026-04-10 10:00:00', het_han_luc: '2026-10-10 23:59:59', khoa_luc: '2026-04-12 09:00:00', ly_do_khoa: 'Hoàn tiền theo yêu cầu', tao_luc: '2026-04-10 10:00:00', cap_nhat_luc: '2026-04-12 09:00:00' },
  ],
};

export default goi_da_muaSeeder;
