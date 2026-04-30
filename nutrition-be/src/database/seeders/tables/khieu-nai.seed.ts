import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const khieu_naiSeeder: TableSeeder = {
  table: 'khieu_nai',
  rows: createRows(10, (i) => ({
    id: i,
    ma_khieu_nai: `KN_${String(i).padStart(4, '0')}`,
    nguoi_gui_id: i + 12,
    loai_khieu_nai: ['booking', 'thanh_toan', 'danh_gia', 'khac'][i % 4],
    doi_tuong_id: i,
    tieu_de: `Can ho tro van de ${i}`,
    noi_dung: 'Noi dung khieu nai mau phuc vu test quan tri.',
    muc_uu_tien: ['thap', 'trung_binh', 'cao'][i % 3],
    trang_thai: ['moi', 'dang_xu_ly', 'cho_phan_hoi', 'da_giai_quyet', 'da_dong'][i % 5],
    gan_cho_id: 1,
    ket_qua_xu_ly: i % 2 === 0 ? 'Da lien he va xu ly cho khach.' : null,
    dong_luc: i % 5 === 0 ? '2026-03-28 08:00:00' : null,
    tao_luc: '2026-03-27 08:00:00',
    cap_nhat_luc: '2026-03-27 08:00:00',
  })),
};

export default khieu_naiSeeder;

