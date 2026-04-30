import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const phien_chat_aiSeeder: TableSeeder = {
  table: 'phien_chat_ai',
  rows: createRows(10, (i) => ({
    id: i,
    tai_khoan_id: i + 12,
    tieu_de: `Hoi dap suc khoe ${i}`,
    loai_context: ['suc_khoe', 'dinh_duong', 'tap_luyen', 'tu_van_chung'][i % 4],
    context_snapshot: { goal: 'cai_thien_suc_khoe', customerId: i + 12 },
    trang_thai: 'dang_mo',
    tao_luc: '2026-03-22 08:00:00',
    cap_nhat_luc: '2026-03-22 08:15:00',
  })),
};

export default phien_chat_aiSeeder;

