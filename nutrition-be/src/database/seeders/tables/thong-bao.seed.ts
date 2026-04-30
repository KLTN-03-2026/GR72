import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const thong_baoSeeder: TableSeeder = {
  table: 'thong_bao',
  rows: createRows(10, (i) => ({
    id: i,
    tai_khoan_id: i + 12,
    nguoi_gui_id: 1,
    loai: 'booking',
    tieu_de: `Thong bao lich tu van ${i}`,
    noi_dung: 'Ban co cap nhat moi ve lich tu van.',
    trang_thai: i % 2 === 0 ? 'da_doc' : 'chua_doc',
    duong_dan_hanh_dong: `/dashboard/bookings/${i}`,
    entity_type: 'lich_hen',
    entity_id: i,
    tao_luc: '2026-03-28 08:00:00',
    doc_luc: i % 2 === 0 ? '2026-03-28 09:00:00' : null,
    cap_nhat_luc: '2026-03-28 08:00:00',
  })),
};

export default thong_baoSeeder;

