import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const ho_so_customerSeeder: TableSeeder = {
  table: 'ho_so_customer',
  rows: createRows(10, (i) => ({
    id: i,
    tai_khoan_id: i + 12,
    gioi_tinh: i % 3 === 0 ? 'khac' : i % 2 === 0 ? 'nu' : 'nam',
    ngay_sinh: `199${i % 10}-0${(i % 9) + 1}-15`,
    anh_dai_dien_url: `/uploads/avatars/customer-${i}.jpg`,
    ghi_chu_suc_khoe: `Khach hang ${i} muon cai thien suc khoe tong quat.`,
    tao_luc: '2026-01-04 08:00:00',
    cap_nhat_luc: '2026-01-04 08:00:00',
  })),
};

export default ho_so_customerSeeder;

