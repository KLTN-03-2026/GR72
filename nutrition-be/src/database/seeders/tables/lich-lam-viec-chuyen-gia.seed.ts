import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const lich_lam_viec_chuyen_giaSeeder: TableSeeder = {
  table: 'lich_lam_viec_chuyen_gia',
  rows: createRows(10, (i) => ({
    id: i,
    chuyen_gia_id: i,
    thu_trong_tuan: (i % 7) + 1,
    gio_bat_dau: '08:00:00',
    gio_ket_thuc: '17:00:00',
    thoi_luong_slot_phut: 45,
    trang_thai: 'hoat_dong',
    tao_luc: '2026-01-09 08:00:00',
    cap_nhat_luc: '2026-01-09 08:00:00',
  })),
};

export default lich_lam_viec_chuyen_giaSeeder;

