import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const commissionDates = [
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

const chi_tiet_hoa_hongSeeder: TableSeeder = {
  table: 'chi_tiet_hoa_hong',
  rows: createRows(10, (i) => {
    const date = commissionDates[i - 1];
    const revenue = 250000 + i * 50000;

    return {
      id: i,
      ky_hoa_hong_id: i,
      lich_hen_id: i,
      thanh_toan_id: i,
      chuyen_gia_id: i,
      goi_dich_vu_id: i,
      doanh_thu_hop_le: revenue,
      ty_le_hoa_hong: 30,
      so_tien_hoa_hong: revenue * 0.3,
      trang_thai: i <= 6 ? 'da_chot' : 'nhap',
      tao_luc: `${date} 10:00:00`,
      cap_nhat_luc: `${date} 10:00:00`,
    };
  }),
};

export default chi_tiet_hoa_hongSeeder;
