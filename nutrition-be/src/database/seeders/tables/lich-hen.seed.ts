import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const bookingDates = [
  '2026-04-27',
  '2026-04-26',
  '2026-04-25',
  '2026-04-23',
  '2026-04-21',
  '2026-04-17',
  '2026-04-09',
  '2026-03-29',
  '2026-02-11',
  '2025-10-29',
];

const lich_henSeeder: TableSeeder = {
  table: 'lich_hen',
  rows: createRows(10, (i) => {
    const date = bookingDates[i - 1];

    return {
      id: i,
      ma_lich_hen: `BOOK_${String(i).padStart(4, '0')}`,
      tai_khoan_id: i + 12,
      chuyen_gia_id: i,
      goi_dich_vu_id: i,
      goi_da_mua_id: i,
      thanh_toan_id: i,
      muc_dich: `Tu van theo muc tieu ca nhan ${i}`,
      ghi_chu_customer: 'Can chuyen gia xem ho so suc khoe truoc buoi tu van.',
      ngay_hen: date,
      gio_bat_dau: '09:00:00',
      gio_ket_thuc: '09:45:00',
      bat_dau_luc: `${date} 09:00:00`,
      ket_thuc_luc: `${date} 09:45:00`,
      trang_thai: 'hoan_thanh',
      giu_cho_den_luc: null,
      ly_do_huy: null,
      huy_boi: null,
      huy_luc: null,
      hoan_thanh_luc: `${date} 09:45:00`,
      tao_luc: `${date} 08:00:00`,
      cap_nhat_luc: `${date} 09:45:00`,
    };
  }),
};

export default lich_henSeeder;
