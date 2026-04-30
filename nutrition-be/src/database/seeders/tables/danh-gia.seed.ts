import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const danh_giaSeeder: TableSeeder = {
  table: 'danh_gia',
  rows: createRows(10, (i) => ({
    id: i,
    lich_hen_id: i,
    tai_khoan_id: i + 12,
    chuyen_gia_id: i,
    diem: 4 + (i % 2),
    noi_dung: `Chuyen gia tu van ro rang va de ap dung ${i}.`,
    tags: ['dung_gio', 'de_hieu'],
    trang_thai: 'hien_thi',
    an_boi: null,
    an_luc: null,
    ly_do_an: null,
    tao_luc: '2026-03-21 08:00:00',
    cap_nhat_luc: '2026-03-21 08:00:00',
  })),
};

export default danh_giaSeeder;

