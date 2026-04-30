import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const cuoc_goi_tu_vanSeeder: TableSeeder = {
  table: 'cuoc_goi_tu_van',
  rows: createRows(10, (i) => ({
    id: i,
    lich_hen_id: i,
    provider: 'livekit',
    room_name: `consultation-room-${i}`,
    trang_thai: 'ket_thuc',
    bat_dau_luc: '2026-03-20 09:00:00',
    ket_thuc_luc: '2026-03-20 09:45:00',
    thoi_luong_giay: 2700,
    tao_luc: '2026-03-20 08:50:00',
    cap_nhat_luc: '2026-03-20 09:45:00',
  })),
};

export default cuoc_goi_tu_vanSeeder;

