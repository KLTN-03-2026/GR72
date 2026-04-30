import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const ho_so_suc_khoeSeeder: TableSeeder = {
  table: 'ho_so_suc_khoe',
  rows: createRows(10, (i) => ({
    id: i,
    tai_khoan_id: i + 12,
    gioi_tinh: i % 3 === 0 ? 'khac' : i % 2 === 0 ? 'nu' : 'nam',
    ngay_sinh: `199${i % 10}-0${(i % 9) + 1}-20`,
    chieu_cao_cm: 160 + i,
    can_nang_hien_tai_kg: 55 + i,
    muc_do_van_dong: ['it_van_dong', 'van_dong_nhe', 'van_dong_vua', 'nang_dong', 'rat_nang_dong'][i % 5],
    muc_tieu_suc_khoe: ['giam_can', 'tang_can', 'giu_can', 'cai_thien_suc_khoe'][i % 4],
    tinh_trang_suc_khoe: { benhNen: i % 2 === 0 ? ['dau_da_day'] : [] },
    di_ung: i % 2 === 0 ? ['hai_san'] : [],
    che_do_an_uu_tien: ['it_duong', 'giau_dam'],
    thuc_pham_khong_dung: i % 2 === 0 ? ['sua_bo'] : [],
    ghi_chu_cho_chuyen_gia: `Muc tieu theo doi suc khoe ${i}`,
    da_hoan_thanh: true,
    tao_luc: '2026-01-05 08:00:00',
    cap_nhat_luc: '2026-01-05 08:00:00',
  })),
};

export default ho_so_suc_khoeSeeder;

