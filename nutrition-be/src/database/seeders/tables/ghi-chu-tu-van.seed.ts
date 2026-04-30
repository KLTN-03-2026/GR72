import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const ghi_chu_tu_vanSeeder: TableSeeder = {
  table: 'ghi_chu_tu_van',
  rows: createRows(10, (i) => ({
    id: i,
    lich_hen_id: i,
    chuyen_gia_id: i,
    tom_tat_cho_customer: `Tom tat tu van cho khach hang ${i}.`,
    ghi_chu_noi_bo: 'Can theo doi sau 2 tuan.',
    khuyen_nghi_sau_tu_van: 'Duy tri nhat ky an uong va van dong moi ngay.',
    tags: ['dinh_duong', 'theo_doi'],
    tao_luc: '2026-03-20 09:00:00',
    cap_nhat_luc: '2026-03-20 09:00:00',
  })),
};

export default ghi_chu_tu_vanSeeder;

