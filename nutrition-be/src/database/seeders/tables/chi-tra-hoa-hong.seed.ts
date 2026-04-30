import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const chi_tra_hoa_hongSeeder: TableSeeder = {
  table: 'chi_tra_hoa_hong',
  rows: createRows(10, (i) => ({
    id: i,
    ky_hoa_hong_id: i,
    chuyen_gia_id: i,
    so_booking: 1,
    tong_doanh_thu_hop_le: 250000 + i * 50000,
    tong_hoa_hong: (250000 + i * 50000) * 0.3,
    trang_thai: i <= 3 ? 'da_chi_tra' : 'cho_chi_tra',
    phuong_thuc_chi_tra: 'chuyen_khoan',
    ma_chi_tra: `PAYOUT_${String(i).padStart(4, '0')}`,
    ghi_chu: 'Chi tra hoa hong theo thang.',
    chi_tra_luc: i <= 3 ? '2026-03-26 08:00:00' : null,
    tao_luc: '2026-03-26 08:00:00',
    cap_nhat_luc: '2026-03-26 08:00:00',
  })),
};

export default chi_tra_hoa_hongSeeder;

