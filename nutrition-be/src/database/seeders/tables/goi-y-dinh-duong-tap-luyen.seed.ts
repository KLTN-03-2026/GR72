import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const goi_y_dinh_duong_tap_luyenSeeder: TableSeeder = {
  table: 'goi_y_dinh_duong_tap_luyen',
  rows: createRows(10, (i) => ({
    id: i,
    tai_khoan_id: i + 12,
    phien_chat_ai_id: i,
    input_snapshot: { goal: 'giam_can', activity: 'van_dong_nhe' },
    muc_tieu_calories: 1800 + i * 20,
    muc_tieu_protein_g: 90 + i,
    muc_tieu_carb_g: 180 + i,
    muc_tieu_fat_g: 55 + i,
    goi_y_dinh_duong: { breakfast: 'Yen mach va sua chua', lunch: 'Com gao lut va uc ga' },
    goi_y_tap_luyen: { sessionsPerWeek: 3, focus: 'cardio nhe va suc manh' },
    canh_bao: [],
    ly_do: 'Can doi nang luong va muc tieu van dong.',
    trang_thai: 'moi_tao',
    ap_dung_luc: null,
    tao_luc: '2026-03-22 08:25:00',
    cap_nhat_luc: '2026-03-22 08:25:00',
  })),
};

export default goi_y_dinh_duong_tap_luyenSeeder;

