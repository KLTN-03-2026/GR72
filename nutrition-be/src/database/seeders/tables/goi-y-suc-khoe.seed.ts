import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const goi_y_suc_khoeSeeder: TableSeeder = {
  table: 'goi_y_suc_khoe',
  rows: createRows(10, (i) => ({
    id: i,
    tai_khoan_id: i + 12,
    phien_chat_ai_id: i,
    loai_goi_y: i % 3 === 0 ? 'canh_bao_suc_khoe' : 'ke_hoach_suc_khoe',
    input_snapshot: { weight: 55 + i, sleep: 6 + (i % 3) },
    noi_dung_goi_y: { steps: ['Ngu som truoc 23h', 'Uong du nuoc', 'Theo doi chi so moi tuan'] },
    muc_do_uu_tien: ['thap', 'trung_binh', 'cao'][i % 3],
    canh_bao: i % 3 === 0 ? ['theo_doi_huyet_ap'] : [],
    ly_do: 'Dua tren ho so suc khoe va chi so gan nhat.',
    trang_thai: 'moi_tao',
    ap_dung_luc: null,
    tao_luc: '2026-03-22 08:20:00',
    cap_nhat_luc: '2026-03-22 08:20:00',
  })),
};

export default goi_y_suc_khoeSeeder;

