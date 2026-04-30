import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const tin_nhanSeeder: TableSeeder = {
  table: 'tin_nhan',
  rows: createRows(10, (i) => ({
    id: i,
    lich_hen_id: i,
    nguoi_gui_id: i % 2 === 0 ? i + 12 : i + 2,
    loai: 'text',
    noi_dung: `Tin nhan tu van trong booking ${i}.`,
    tep_dinh_kem: null,
    da_doc_luc: '2026-03-20 09:10:00',
    da_doc_boi_id: i % 2 === 0 ? i + 2 : i + 12,
    tao_luc: '2026-03-20 09:05:00',
    cap_nhat_luc: '2026-03-20 09:05:00',
  })),
};

export default tin_nhanSeeder;

