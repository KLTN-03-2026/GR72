import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const export_jobSeeder: TableSeeder = {
  table: 'export_job',
  rows: createRows(10, (i) => ({
    id: i,
    nguoi_tao_id: 1,
    loai_export: ['doanh_thu', 'thanh_toan', 'hoa_hong', 'danh_gia', 'khieu_nai'][i % 5],
    dinh_dang: ['csv', 'xlsx', 'pdf'][i % 3],
    filter_json: { month: i, year: 2026 },
    trang_thai: ['cho_xu_ly', 'dang_xu_ly', 'hoan_thanh', 'that_bai'][i % 4],
    file_url: i % 4 === 2 ? `/uploads/exports/export-${i}.csv` : null,
    loi: i % 4 === 3 ? 'Loi tao file mau' : null,
    tao_luc: '2026-03-30 08:00:00',
    hoan_thanh_luc: i % 4 === 2 ? '2026-03-30 08:05:00' : null,
  })),
};

export default export_jobSeeder;

