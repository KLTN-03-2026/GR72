import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const goi_dich_vu_chuyen_giaSeeder: TableSeeder = {
  table: 'goi_dich_vu_chuyen_gia',
  rows: createRows(10, (i) => ({
    id: i,
    goi_dich_vu_id: i,
    chuyen_gia_id: i,
    trang_thai: 'hoat_dong',
    ty_le_hoa_hong_override: i % 3 === 0 ? 35 : null,
    gan_boi: 1,
    gan_luc: '2026-01-08 08:00:00',
    cap_nhat_luc: '2026-01-08 08:00:00',
  })),
};

export default goi_dich_vu_chuyen_giaSeeder;

