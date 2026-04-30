import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const lich_su_su_dung_goiSeeder: TableSeeder = {
  table: 'lich_su_su_dung_goi',
  rows: createRows(10, (i) => ({
    id: i,
    goi_da_mua_id: i,
    lich_hen_id: i,
    loai_su_kien: 'tru_luot',
    so_luot_thay_doi: -1,
    so_luot_con_lai_sau: 2,
    ghi_chu: `Tru luot sau booking ${i}`,
    tao_luc: '2026-03-20 08:00:00',
  })),
};

export default lich_su_su_dung_goiSeeder;

