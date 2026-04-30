import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const khieu_nai_tin_nhanSeeder: TableSeeder = {
  table: 'khieu_nai_tin_nhan',
  rows: createRows(10, (i) => ({
    id: i,
    khieu_nai_id: i,
    nguoi_gui_id: i + 12,
    noi_dung: `Tin nhan bo sung cho khieu nai ${i}.`,
    tep_dinh_kem: [],
    tao_luc: '2026-03-27 08:30:00',
  })),
};

export default khieu_nai_tin_nhanSeeder;

