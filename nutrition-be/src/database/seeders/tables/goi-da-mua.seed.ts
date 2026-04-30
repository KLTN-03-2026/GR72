import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const purchaseDates = [
  '2026-04-27',
  '2026-04-26',
  '2026-04-25',
  '2026-04-23',
  '2026-04-21',
  '2026-04-17',
  '2026-04-09',
  '2026-03-29',
  '2026-02-11',
  '2025-10-29',
];

const goi_da_muaSeeder: TableSeeder = {
  table: 'goi_da_mua',
  rows: createRows(10, (i) => {
    const date = purchaseDates[i - 1];

    return {
      id: i,
      tai_khoan_id: i + 12,
      goi_dich_vu_id: i,
      ma_goi_da_mua: `PURCHASED_${String(i).padStart(3, '0')}`,
      trang_thai: 'dang_hieu_luc',
      gia_mua: 250000 + i * 50000,
      so_luot_tong: 3,
      so_luot_da_dung: 1,
      so_luot_con_lai: 2,
      bat_dau_luc: `${date} 08:00:00`,
      het_han_luc: '2026-05-27 23:59:59',
      khoa_luc: null,
      ly_do_khoa: null,
      tao_luc: `${date} 08:00:00`,
      cap_nhat_luc: `${date} 08:00:00`,
    };
  }),
};

export default goi_da_muaSeeder;
