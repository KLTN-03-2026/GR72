import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const lich_ban_chuyen_giaSeeder: TableSeeder = {
  table: 'lich_ban_chuyen_gia',
  rows: createRows(10, (i) => ({
    id: i,
    chuyen_gia_id: i,
    bat_dau_luc: `2026-03-${String(i).padStart(2, '0')} 12:00:00`,
    ket_thuc_luc: `2026-03-${String(i).padStart(2, '0')} 13:00:00`,
    ly_do: 'Nghi trua hoac lich ca nhan',
    tao_luc: '2026-01-09 08:00:00',
    cap_nhat_luc: '2026-01-09 08:00:00',
  })),
};

export default lich_ban_chuyen_giaSeeder;

