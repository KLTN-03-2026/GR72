import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const tai_khoanSeeder: TableSeeder = {
  table: 'tai_khoan',
  rows: [
    ...createRows(2, (i) => ({
      id: i,
      email: `admin${i}@nutrition.test`,
      mat_khau_ma_hoa: '$2b$10$w3.4VpOnPjlDVrB864ZTZOeinq4erNtihmyOYK.hldMq7DZnYsGYK',
      vai_tro: 'admin',
      trang_thai: 'hoat_dong',
      ho_ten: `Quan tri vien ${i}`,
      so_dien_thoai: `09000000${i}`,
      ma_dat_lai_mat_khau: null,
      het_han_ma_dat_lai: null,
      dang_nhap_cuoi_luc: null,
      tao_luc: '2026-01-01 08:00:00',
      cap_nhat_luc: '2026-01-01 08:00:00',
      xoa_luc: null,
    })),
    ...createRows(10, (i) => ({
      id: i + 2,
      email: `expert${i}@nutrition.test`,
      mat_khau_ma_hoa: '$2b$10$w3.4VpOnPjlDVrB864ZTZOeinq4erNtihmyOYK.hldMq7DZnYsGYK',
      vai_tro: 'expert',
      trang_thai: 'hoat_dong',
      ho_ten: `Chuyen gia ${i}`,
      so_dien_thoai: `09100000${i}`,
      ma_dat_lai_mat_khau: null,
      het_han_ma_dat_lai: null,
      dang_nhap_cuoi_luc: null,
      tao_luc: '2026-01-02 08:00:00',
      cap_nhat_luc: '2026-01-02 08:00:00',
      xoa_luc: null,
    })),
    ...createRows(20, (i) => ({
      id: i + 12,
      email: `customer${i}@nutrition.test`,
      mat_khau_ma_hoa: '$2b$10$w3.4VpOnPjlDVrB864ZTZOeinq4erNtihmyOYK.hldMq7DZnYsGYK',
      vai_tro: 'customer',
      trang_thai: 'hoat_dong',
      ho_ten: `Khach hang ${i}`,
      so_dien_thoai: `09200000${i}`,
      ma_dat_lai_mat_khau: null,
      het_han_ma_dat_lai: null,
      dang_nhap_cuoi_luc: null,
      tao_luc: '2026-01-03 08:00:00',
      cap_nhat_luc: '2026-01-03 08:00:00',
      xoa_luc: null,
    })),
  ],
};

export default tai_khoanSeeder;

