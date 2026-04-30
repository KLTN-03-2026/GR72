import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const goi_dich_vuSeeder: TableSeeder = {
  table: 'goi_dich_vu',
  rows: createRows(10, (i) => ({
    id: i,
    ma_goi: `GOI_${String(i).padStart(2, '0')}`,
    ten_goi: ['Tu van suc khoe', 'Tu van dinh duong', 'Tu van tap luyen'][i % 3] + ` ${i}`,
    slug: `goi-tu-van-${i}`,
    loai_goi: ['suc_khoe', 'dinh_duong', 'tap_luyen'][i % 3],
    mo_ta: `Goi dich vu mau ${i} cho luong khach hang mua goi roi book chuyen gia.`,
    quyen_loi: ['1 buoi tu van', 'Theo doi tien trinh', 'Goi y ca nhan hoa'],
    gia: 250000 + i * 50000,
    gia_khuyen_mai: i % 2 === 0 ? 220000 + i * 50000 : null,
    thoi_han_ngay: 30,
    so_luot_tu_van: 1 + (i % 3),
    thoi_luong_tu_van_phut: i % 2 === 0 ? 45 : 30,
    trang_thai: 'dang_ban',
    goi_noi_bat: i <= 3,
    thu_tu_hien_thi: i,
    tao_luc: '2026-01-07 08:00:00',
    cap_nhat_luc: '2026-01-07 08:00:00',
    xoa_luc: null,
  })),
};

export default goi_dich_vuSeeder;

