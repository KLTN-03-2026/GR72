import type { TableSeeder } from '../types';

const chi_tra_hoa_hongSeeder: TableSeeder = {
  table: 'chi_tra_hoa_hong',
  rows: [
    // === Kỳ 1/2026 - đã chi trả ===
    // Expert 1 (ThS Lê Minh Phương) - 1 booking
    {
      id: 1, ky_hoa_hong_id: 1, chuyen_gia_id: 1,
      so_booking: 1, tong_doanh_thu_hop_le: 166333, tong_hoa_hong: 58217,
      trang_thai: 'da_chi_tra', phuong_thuc_chi_tra: 'chuyen_khoan',
      ma_chi_tra: 'PAYOUT_001', ghi_chu: 'Chi trả hoa hồng kỳ 1/2026',
      chi_tra_luc: '2026-02-10 09:00:00', tao_luc: '2026-02-10 09:00:00', cap_nhat_luc: '2026-02-10 09:00:00',
    },
    // Expert 3 (PT Trần Văn Khải) - 1 booking
    {
      id: 2, ky_hoa_hong_id: 1, chuyen_gia_id: 3,
      so_booking: 1, tong_doanh_thu_hop_le: 198333, tong_hoa_hong: 69417,
      trang_thai: 'da_chi_tra', phuong_thuc_chi_tra: 'chuyen_khoan',
      ma_chi_tra: 'PAYOUT_002', ghi_chu: 'Chi trả hoa hồng kỳ 1/2026',
      chi_tra_luc: '2026-02-10 09:00:00', tao_luc: '2026-02-10 09:00:00', cap_nhat_luc: '2026-02-10 09:00:00',
    },
    // Expert 5 (TS Vũ Thị Mai Anh) - 1 booking
    {
      id: 3, ky_hoa_hong_id: 1, chuyen_gia_id: 5,
      so_booking: 1, tong_doanh_thu_hop_le: 248333, tong_hoa_hong: 99333,
      trang_thai: 'da_chi_tra', phuong_thuc_chi_tra: 'chuyen_khoan',
      ma_chi_tra: 'PAYOUT_003', ghi_chu: 'Chi trả hoa hồng kỳ 1/2026',
      chi_tra_luc: '2026-02-10 09:00:00', tao_luc: '2026-02-10 09:00:00', cap_nhat_luc: '2026-02-10 09:00:00',
    },
    // === Kỳ 2/2026 - đã chi trả ===
    // Expert 2 (BS Nguyễn Thu Hà) - 1 booking
    {
      id: 4, ky_hoa_hong_id: 2, chuyen_gia_id: 2,
      so_booking: 1, tong_doanh_thu_hop_le: 199667, tong_hoa_hong: 59900,
      trang_thai: 'da_chi_tra', phuong_thuc_chi_tra: 'chuyen_khoan',
      ma_chi_tra: 'PAYOUT_004', ghi_chu: 'Chi trả hoa hồng kỳ 2/2026',
      chi_tra_luc: '2026-03-10 09:00:00', tao_luc: '2026-03-10 09:00:00', cap_nhat_luc: '2026-03-10 09:00:00',
    },
    // Expert 3 (PT Trần Văn Khải) - 1 booking
    {
      id: 5, ky_hoa_hong_id: 2, chuyen_gia_id: 3,
      so_booking: 1, tong_doanh_thu_hop_le: 148333, tong_hoa_hong: 51917,
      trang_thai: 'da_chi_tra', phuong_thuc_chi_tra: 'chuyen_khoan',
      ma_chi_tra: 'PAYOUT_005', ghi_chu: 'Chi trả hoa hồng kỳ 2/2026',
      chi_tra_luc: '2026-03-10 09:00:00', tao_luc: '2026-03-10 09:00:00', cap_nhat_luc: '2026-03-10 09:00:00',
    },
    // Expert 5 (TS Vũ Thị Mai Anh) - 1 booking
    {
      id: 6, ky_hoa_hong_id: 2, chuyen_gia_id: 5,
      so_booking: 1, tong_doanh_thu_hop_le: 291667, tong_hoa_hong: 116667,
      trang_thai: 'da_chi_tra', phuong_thuc_chi_tra: 'chuyen_khoan',
      ma_chi_tra: 'PAYOUT_006', ghi_chu: 'Chi trả hoa hồng kỳ 2/2026',
      chi_tra_luc: '2026-03-10 09:00:00', tao_luc: '2026-03-10 09:00:00', cap_nhat_luc: '2026-03-10 09:00:00',
    },
    // Expert 8 (ThS Lý Quốc Bảo) - 1 booking
    {
      id: 7, ky_hoa_hong_id: 2, chuyen_gia_id: 8,
      so_booking: 1, tong_doanh_thu_hop_le: 165000, tong_hoa_hong: 49500,
      trang_thai: 'da_chi_tra', phuong_thuc_chi_tra: 'chuyen_khoan',
      ma_chi_tra: 'PAYOUT_007', ghi_chu: 'Chi trả hoa hồng kỳ 2/2026',
      chi_tra_luc: '2026-03-10 09:00:00', tao_luc: '2026-03-10 09:00:00', cap_nhat_luc: '2026-03-10 09:00:00',
    },
    // === Kỳ 3/2026 - đã chốt, chờ chi trả ===
    // Expert 1 (ThS Lê Minh Phương) - 2 bookings
    {
      id: 8, ky_hoa_hong_id: 3, chuyen_gia_id: 1,
      so_booking: 2, tong_doanh_thu_hop_le: 498000, tong_hoa_hong: 174300,
      trang_thai: 'cho_chi_tra', phuong_thuc_chi_tra: 'chuyen_khoan',
      ma_chi_tra: null, ghi_chu: 'Kỳ 3/2026 chờ chi trả',
      chi_tra_luc: null, tao_luc: '2026-04-05 08:00:00', cap_nhat_luc: '2026-04-05 08:00:00',
    },
    // Expert 3 (PT Trần Văn Khải) - 1 booking
    {
      id: 9, ky_hoa_hong_id: 3, chuyen_gia_id: 3,
      so_booking: 1, tong_doanh_thu_hop_le: 182500, tong_hoa_hong: 63875,
      trang_thai: 'cho_chi_tra', phuong_thuc_chi_tra: 'chuyen_khoan',
      ma_chi_tra: null, ghi_chu: 'Kỳ 3/2026 chờ chi trả',
      chi_tra_luc: null, tao_luc: '2026-04-05 08:00:00', cap_nhat_luc: '2026-04-05 08:00:00',
    },
    // Expert 5 (TS Vũ Thị Mai Anh) - 2 bookings
    {
      id: 10, ky_hoa_hong_id: 3, chuyen_gia_id: 5,
      so_booking: 2, tong_doanh_thu_hop_le: 540000, tong_hoa_hong: 216000,
      trang_thai: 'cho_chi_tra', phuong_thuc_chi_tra: 'chuyen_khoan',
      ma_chi_tra: null, ghi_chu: 'Kỳ 3/2026 chờ chi trả',
      chi_tra_luc: null, tao_luc: '2026-04-05 08:00:00', cap_nhat_luc: '2026-04-05 08:00:00',
    },
  ],
};

export default chi_tra_hoa_hongSeeder;
