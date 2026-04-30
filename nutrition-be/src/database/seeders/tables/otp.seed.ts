import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const otpSeeder: TableSeeder = {
  table: 'otp',
  rows: createRows(10, (i) => ({
    id: i,
    email: `customer${i}@nutrition.test`,
    ma_otp: '$2b$10$P4HGyCQLiNNa3u3EHnRsPeEnpvecOcFT/xaA5grxiJJJ.EmlT7zPW',
    loai: i % 2 === 0 ? 'dat_lai_mat_khau' : 'xac_thuc',
    da_su_dung: i % 3 === 0,
    het_han_luc: `2026-12-${10 + i} 08:00:00`,
    tao_luc: '2026-02-02 08:00:00',
  })),
};

export default otpSeeder;

