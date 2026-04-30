import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const phan_hoi_danh_giaSeeder: TableSeeder = {
  table: 'phan_hoi_danh_gia',
  rows: createRows(10, (i) => ({
    id: i,
    danh_gia_id: i,
    chuyen_gia_id: i,
    noi_dung: 'Cam on ban da danh gia. Toi se tiep tuc dong hanh trong cac buoi tiep theo.',
    tao_luc: '2026-03-21 09:00:00',
    cap_nhat_luc: '2026-03-21 09:00:00',
  })),
};

export default phan_hoi_danh_giaSeeder;

