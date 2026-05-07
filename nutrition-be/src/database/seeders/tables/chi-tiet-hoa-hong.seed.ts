import type { TableSeeder } from '../types';

// Revenue per session = package_price / total_sessions
const chi_tiet_hoa_hongSeeder: TableSeeder = {
  table: 'chi_tiet_hoa_hong',
  rows: [
    // === Kỳ 1/2026 ===
    // Booking 1: customer 11, expert 1, package 1 (499k/3 buổi = 166,333/buổi), rate 35%
    { id: 1,  ky_hoa_hong_id: 1, lich_hen_id: 1,  thanh_toan_id: 1,  chuyen_gia_id: 1, goi_dich_vu_id: 1,  doanh_thu_hop_le: 166333, ty_le_hoa_hong: 35, so_tien_hoa_hong: 58217, trang_thai: 'da_chot', tao_luc: '2026-02-05 08:00:00', cap_nhat_luc: '2026-02-05 08:00:00' },
    // Booking 2: customer 12, expert 5, package 6 (1490k/6 = 248,333/buổi), rate 40%
    { id: 2,  ky_hoa_hong_id: 1, lich_hen_id: 2,  thanh_toan_id: 2,  chuyen_gia_id: 5, goi_dich_vu_id: 6,  doanh_thu_hop_le: 248333, ty_le_hoa_hong: 40, so_tien_hoa_hong: 99333, trang_thai: 'da_chot', tao_luc: '2026-02-05 08:00:00', cap_nhat_luc: '2026-02-05 08:00:00' },
    // Booking 3: customer 14, expert 3, package 3 (1190k/6 = 198,333/buổi), rate 35%
    { id: 3,  ky_hoa_hong_id: 1, lich_hen_id: 3,  thanh_toan_id: 4,  chuyen_gia_id: 3, goi_dich_vu_id: 3,  doanh_thu_hop_le: 198333, ty_le_hoa_hong: 35, so_tien_hoa_hong: 69417, trang_thai: 'da_chot', tao_luc: '2026-02-05 08:00:00', cap_nhat_luc: '2026-02-05 08:00:00' },
    // === Kỳ 2/2026 ===
    // Booking 4: customer 16, expert 5, package 11 (3500k/12 = 291,667/buổi), rate 40%
    { id: 4,  ky_hoa_hong_id: 2, lich_hen_id: 4,  thanh_toan_id: 6,  chuyen_gia_id: 5, goi_dich_vu_id: 11, doanh_thu_hop_le: 291667, ty_le_hoa_hong: 40, so_tien_hoa_hong: 116667, trang_thai: 'da_chot', tao_luc: '2026-03-05 08:00:00', cap_nhat_luc: '2026-03-05 08:00:00' },
    // Booking 5: customer 13, expert 2, package 7 (599k/3 = 199,667/buổi), rate 30%
    { id: 5,  ky_hoa_hong_id: 2, lich_hen_id: 5,  thanh_toan_id: 3,  chuyen_gia_id: 2, goi_dich_vu_id: 7,  doanh_thu_hop_le: 199667, ty_le_hoa_hong: 30, so_tien_hoa_hong: 59900, trang_thai: 'da_chot', tao_luc: '2026-03-05 08:00:00', cap_nhat_luc: '2026-03-05 08:00:00' },
    // Booking 6: customer 17, expert 3, package 9 (890k/6 = 148,333/buổi), rate 35%
    { id: 6,  ky_hoa_hong_id: 2, lich_hen_id: 6,  thanh_toan_id: 7,  chuyen_gia_id: 3, goi_dich_vu_id: 9,  doanh_thu_hop_le: 148333, ty_le_hoa_hong: 35, so_tien_hoa_hong: 51917, trang_thai: 'da_chot', tao_luc: '2026-03-05 08:00:00', cap_nhat_luc: '2026-03-05 08:00:00' },
    // Booking 7: customer 20, expert 8, package 10 (990k/6 = 165,000/buổi), rate 30%
    { id: 7,  ky_hoa_hong_id: 2, lich_hen_id: 7,  thanh_toan_id: 10, chuyen_gia_id: 8, goi_dich_vu_id: 10, doanh_thu_hop_le: 165000, ty_le_hoa_hong: 30, so_tien_hoa_hong: 49500, trang_thai: 'da_chot', tao_luc: '2026-03-05 08:00:00', cap_nhat_luc: '2026-03-05 08:00:00' },
    // === Kỳ 3/2026 ===
    // Booking 8: customer 19, expert 1, package 5 (249k/1 = 249k), rate 35%
    { id: 8,  ky_hoa_hong_id: 3, lich_hen_id: 8,  thanh_toan_id: 9,  chuyen_gia_id: 1, goi_dich_vu_id: 5,  doanh_thu_hop_le: 249000, ty_le_hoa_hong: 35, so_tien_hoa_hong: 87150, trang_thai: 'da_chot', tao_luc: '2026-04-05 08:00:00', cap_nhat_luc: '2026-04-05 08:00:00' },
    // Booking 9: customer 21, expert 1, package 5 (249k/1 = 249k), rate 35%
    { id: 9,  ky_hoa_hong_id: 3, lich_hen_id: 9,  thanh_toan_id: 11, chuyen_gia_id: 1, goi_dich_vu_id: 5,  doanh_thu_hop_le: 249000, ty_le_hoa_hong: 35, so_tien_hoa_hong: 87150, trang_thai: 'da_chot', tao_luc: '2026-04-05 08:00:00', cap_nhat_luc: '2026-04-05 08:00:00' },
    // Booking 10: customer 16, expert 5, package 11 (3500k/12 = 291,667), rate 40%
    { id: 10, ky_hoa_hong_id: 3, lich_hen_id: 10, thanh_toan_id: 6,  chuyen_gia_id: 5, goi_dich_vu_id: 11, doanh_thu_hop_le: 291667, ty_le_hoa_hong: 40, so_tien_hoa_hong: 116667, trang_thai: 'da_chot', tao_luc: '2026-04-05 08:00:00', cap_nhat_luc: '2026-04-05 08:00:00' },
    // Booking 11: customer 12, expert 5, package 6 (1490k/6 = 248,333), rate 40%
    { id: 11, ky_hoa_hong_id: 3, lich_hen_id: 11, thanh_toan_id: 2,  chuyen_gia_id: 5, goi_dich_vu_id: 6,  doanh_thu_hop_le: 248333, ty_le_hoa_hong: 40, so_tien_hoa_hong: 99333, trang_thai: 'da_chot', tao_luc: '2026-04-05 08:00:00', cap_nhat_luc: '2026-04-05 08:00:00' },
    // Booking 12: customer 22, expert 3, package 4 (2190k/12 = 182,500), rate 35%
    { id: 12, ky_hoa_hong_id: 3, lich_hen_id: 12, thanh_toan_id: 12, chuyen_gia_id: 3, goi_dich_vu_id: 4,  doanh_thu_hop_le: 182500, ty_le_hoa_hong: 35, so_tien_hoa_hong: 63875, trang_thai: 'da_chot', tao_luc: '2026-04-05 08:00:00', cap_nhat_luc: '2026-04-05 08:00:00' },
    // === Kỳ 4/2026 - nhập (cần Tính hoa hồng) ===
    // Booking 13: customer 14, expert 3, package 3 (1190k/6 = 198,333), rate 35%
    { id: 13, ky_hoa_hong_id: 4, lich_hen_id: 13, thanh_toan_id: 4,  chuyen_gia_id: 3, goi_dich_vu_id: 3,  doanh_thu_hop_le: 198333, ty_le_hoa_hong: 35, so_tien_hoa_hong: 69417, trang_thai: 'nhap', tao_luc: '2026-05-01 08:00:00', cap_nhat_luc: '2026-05-01 08:00:00' },
    // Booking 14: customer 15, expert 4, package 2 (649k/3 = 216,333), rate 30%
    { id: 14, ky_hoa_hong_id: 4, lich_hen_id: 14, thanh_toan_id: 5,  chuyen_gia_id: 4, goi_dich_vu_id: 2,  doanh_thu_hop_le: 216333, ty_le_hoa_hong: 30, so_tien_hoa_hong: 64900, trang_thai: 'nhap', tao_luc: '2026-05-01 08:00:00', cap_nhat_luc: '2026-05-01 08:00:00' },
    // Booking 15: customer 20, expert 8, package 10 (990k/6 = 165,000), rate 30%
    { id: 15, ky_hoa_hong_id: 4, lich_hen_id: 15, thanh_toan_id: 10, chuyen_gia_id: 8, goi_dich_vu_id: 10, doanh_thu_hop_le: 165000, ty_le_hoa_hong: 30, so_tien_hoa_hong: 49500, trang_thai: 'nhap', tao_luc: '2026-05-01 08:00:00', cap_nhat_luc: '2026-05-01 08:00:00' },
    // Booking 16: customer 13, expert 2, package 7 (599k/3 = 199,667), rate 30%
    { id: 16, ky_hoa_hong_id: 4, lich_hen_id: 16, thanh_toan_id: 3,  chuyen_gia_id: 2, goi_dich_vu_id: 7,  doanh_thu_hop_le: 199667, ty_le_hoa_hong: 30, so_tien_hoa_hong: 59900, trang_thai: 'nhap', tao_luc: '2026-05-01 08:00:00', cap_nhat_luc: '2026-05-01 08:00:00' },
    // Booking 17: customer 23, expert 4, package 2 (649k/3 = 216,333), rate 30%
    { id: 17, ky_hoa_hong_id: 4, lich_hen_id: 17, thanh_toan_id: 13, chuyen_gia_id: 4, goi_dich_vu_id: 2,  doanh_thu_hop_le: 216333, ty_le_hoa_hong: 30, so_tien_hoa_hong: 64900, trang_thai: 'nhap', tao_luc: '2026-05-01 08:00:00', cap_nhat_luc: '2026-05-01 08:00:00' },
    // Booking 18: customer 22, expert 3, package 4 (2190k/12 = 182,500), rate 35%
    { id: 18, ky_hoa_hong_id: 4, lich_hen_id: 18, thanh_toan_id: 12, chuyen_gia_id: 3, goi_dich_vu_id: 4,  doanh_thu_hop_le: 182500, ty_le_hoa_hong: 35, so_tien_hoa_hong: 63875, trang_thai: 'nhap', tao_luc: '2026-05-01 08:00:00', cap_nhat_luc: '2026-05-01 08:00:00' },
  ],
};

export default chi_tiet_hoa_hongSeeder;
