import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const booking_timelineSeeder: TableSeeder = {
  table: 'booking_timeline',
  rows: createRows(10, (i) => ({
    id: i,
    lich_hen_id: i,
    actor_id: i + 12,
    su_kien: 'hoan_thanh_booking',
    trang_thai_truoc: 'dang_tu_van',
    trang_thai_sau: 'hoan_thanh',
    ghi_chu: `Booking ${i} da hoan thanh.`,
    metadata: { source: 'seed' },
    tao_luc: '2026-03-20 08:00:00',
  })),
};

export default booking_timelineSeeder;

