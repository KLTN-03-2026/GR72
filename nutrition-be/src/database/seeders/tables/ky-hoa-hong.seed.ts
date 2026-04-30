import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const ky_hoa_hongSeeder: TableSeeder = {
  table: 'ky_hoa_hong',
  rows: createRows(10, (i) => ({
    id: i,
    ma_ky: `HH_2026_${String(i).padStart(2, '0')}`,
    thang: i,
    nam: 2026,
    tu_ngay: `2026-${String(i).padStart(2, '0')}-01`,
    den_ngay: `2026-${String(i).padStart(2, '0')}-28`,
    trang_thai: i <= 3 ? 'da_chi_tra' : i <= 6 ? 'da_chot' : 'nhap',
    tong_doanh_thu_hop_le: 250000 + i * 50000,
    tong_hoa_hong: (250000 + i * 50000) * 0.3,
    chot_boi: i <= 6 ? 1 : null,
    chot_luc: i <= 6 ? '2026-03-25 08:00:00' : null,
    chi_tra_boi: i <= 3 ? 1 : null,
    chi_tra_luc: i <= 3 ? '2026-03-26 08:00:00' : null,
    tao_luc: '2026-03-25 08:00:00',
    cap_nhat_luc: '2026-03-25 08:00:00',
  })),
};

export default ky_hoa_hongSeeder;

