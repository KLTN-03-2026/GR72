import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const refundSeeder: TableSeeder = {
  table: 'refund',
  rows: createRows(10, (i) => ({
    id: i,
    thanh_toan_id: i,
    so_tien: 50000,
    ly_do: `Yeu cau hoan tien mau ${i}`,
    trang_thai: ['yeu_cau', 'dang_xu_ly', 'thanh_cong', 'that_bai', 'tu_choi'][i % 5],
    xu_ly_boi: 1,
    xu_ly_luc: i % 2 === 0 ? '2026-02-02 09:00:00' : null,
    raw_response: { refundNo: `RF_${i}` },
    tao_luc: '2026-02-02 08:00:00',
    cap_nhat_luc: '2026-02-02 08:00:00',
  })),
};

export default refundSeeder;

