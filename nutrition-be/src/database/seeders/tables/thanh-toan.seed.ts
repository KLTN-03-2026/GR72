import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const paymentDates = [
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

const thanh_toanSeeder: TableSeeder = {
  table: 'thanh_toan',
  rows: createRows(10, (i) => {
    const date = paymentDates[i - 1];
    const amount = 250000 + i * 50000;

    return {
      id: i,
      tai_khoan_id: i + 12,
      loai_thanh_toan: 'mua_goi',
      doi_tuong_id: i,
      ma_giao_dich: `PAY_${String(i).padStart(4, '0')}`,
      cong_thanh_toan: i % 2 === 0 ? 'vnpay' : 'chuyen_khoan',
      so_tien: amount,
      tien_te: 'VND',
      trang_thai: 'thanh_cong',
      payment_url: `https://payment.local/pay/${i}`,
      txn_ref: `TXN_${String(i).padStart(4, '0')}`,
      gateway_transaction_no: `GATEWAY_${String(i).padStart(4, '0')}`,
      raw_request: { amount },
      raw_response: { code: '00', message: 'success' },
      thanh_toan_luc: `${date} 08:10:00`,
      het_han_luc: `${date} 08:30:00`,
      tao_luc: `${date} 08:00:00`,
      cap_nhat_luc: `${date} 08:10:00`,
    };
  }),
};

export default thanh_toanSeeder;
