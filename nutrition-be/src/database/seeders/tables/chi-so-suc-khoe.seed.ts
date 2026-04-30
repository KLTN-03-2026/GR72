import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const chi_so_suc_khoeSeeder: TableSeeder = {
  table: 'chi_so_suc_khoe',
  rows: createRows(10, (i) => ({
    id: i,
    tai_khoan_id: i + 12,
    do_luc: `2026-02-${String(i).padStart(2, '0')} 07:30:00`,
    can_nang_kg: 55 + i,
    vong_eo_cm: 70 + i,
    vong_mong_cm: 90 + i,
    huyet_ap_tam_thu: 110 + i,
    huyet_ap_tam_truong: 70 + i,
    nhip_tim: 68 + i,
    duong_huyet: 5 + i / 10,
    chat_luong_giac_ngu: 6 + (i % 4),
    muc_nang_luong: 6 + (i % 5),
    bmi: 21 + i / 10,
    canh_bao: i % 4 === 0 ? ['can_theo_doi_huyet_ap'] : [],
    ghi_chu: `Chi so suc khoe mau ${i}`,
    tao_luc: '2026-02-01 08:00:00',
    cap_nhat_luc: '2026-02-01 08:00:00',
    xoa_luc: null,
  })),
};

export default chi_so_suc_khoeSeeder;

