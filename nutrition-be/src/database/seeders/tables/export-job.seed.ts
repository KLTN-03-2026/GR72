import type { TableSeeder } from '../types';

const export_jobSeeder: TableSeeder = {
  table: 'export_job',
  rows: [
    { id: 1, nguoi_tao_id: 1, loai_export: 'doanh_thu',  dinh_dang: 'xlsx', filter_json: { month: 1, year: 2026 }, trang_thai: 'hoan_thanh', file_url: '/uploads/exports/doanh_thu_01_2026.xlsx', loi: null, tao_luc: '2026-02-05 08:30:00', hoan_thanh_luc: '2026-02-05 08:32:00' },
    { id: 2, nguoi_tao_id: 1, loai_export: 'hoa_hong',   dinh_dang: 'xlsx', filter_json: { month: 1, year: 2026 }, trang_thai: 'hoan_thanh', file_url: '/uploads/exports/hoa_hong_01_2026.xlsx',  loi: null, tao_luc: '2026-02-05 08:35:00', hoan_thanh_luc: '2026-02-05 08:36:00' },
    { id: 3, nguoi_tao_id: 1, loai_export: 'thanh_toan', dinh_dang: 'csv',  filter_json: { month: 2, year: 2026 }, trang_thai: 'hoan_thanh', file_url: '/uploads/exports/thanh_toan_02_2026.csv',  loi: null, tao_luc: '2026-03-05 09:00:00', hoan_thanh_luc: '2026-03-05 09:01:00' },
    { id: 4, nguoi_tao_id: 1, loai_export: 'danh_gia',   dinh_dang: 'csv',  filter_json: { from: '2026-01-01', to: '2026-03-31' }, trang_thai: 'hoan_thanh', file_url: '/uploads/exports/danh_gia_q1_2026.csv', loi: null, tao_luc: '2026-04-01 09:00:00', hoan_thanh_luc: '2026-04-01 09:01:00' },
    { id: 5, nguoi_tao_id: 1, loai_export: 'khieu_nai',  dinh_dang: 'xlsx', filter_json: { from: '2026-01-01', to: '2026-04-30' }, trang_thai: 'hoan_thanh', file_url: '/uploads/exports/khieu_nai_4m_2026.xlsx', loi: null, tao_luc: '2026-05-01 09:00:00', hoan_thanh_luc: '2026-05-01 09:02:00' },
    { id: 6, nguoi_tao_id: 1, loai_export: 'doanh_thu',  dinh_dang: 'xlsx', filter_json: { month: 4, year: 2026 }, trang_thai: 'cho_xu_ly',  file_url: null, loi: null, tao_luc: '2026-05-07 10:00:00', hoan_thanh_luc: null },
    // Một job bị lỗi để test edge case
    { id: 7, nguoi_tao_id: 2, loai_export: 'hoa_hong',   dinh_dang: 'pdf',  filter_json: { month: 3, year: 2026 }, trang_thai: 'that_bai',   file_url: null, loi: 'Timeout khi tạo file PDF lớn', tao_luc: '2026-04-05 14:00:00', hoan_thanh_luc: null },
  ],
};

export default export_jobSeeder;
