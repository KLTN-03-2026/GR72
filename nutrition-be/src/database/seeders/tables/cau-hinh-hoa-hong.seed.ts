import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const cau_hinh_hoa_hongSeeder: TableSeeder = {
  table: 'cau_hinh_hoa_hong',
  rows: createRows(10, (i) => ({
    id: i,
    pham_vi: i === 1 ? 'he_thong' : i % 2 === 0 ? 'goi_dich_vu' : 'chuyen_gia',
    goi_dich_vu_id: i % 2 === 0 ? i : null,
    chuyen_gia_id: i % 2 !== 0 && i !== 1 ? i : null,
    ty_le_hoa_hong: 30 + (i % 3),
    hieu_luc_tu: '2026-01-01',
    hieu_luc_den: null,
    trang_thai: 'hoat_dong',
    tao_luc: '2026-01-01 08:00:00',
    cap_nhat_luc: '2026-01-01 08:00:00',
  })),
};

export default cau_hinh_hoa_hongSeeder;

