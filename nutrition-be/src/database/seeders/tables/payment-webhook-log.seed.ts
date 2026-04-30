import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const payment_webhook_logSeeder: TableSeeder = {
  table: 'payment_webhook_log',
  rows: createRows(10, (i) => ({
    id: i,
    thanh_toan_id: i,
    txn_ref: `TXN_${String(i).padStart(4, '0')}`,
    loai_webhook: i % 2 === 0 ? 'ipn' : 'return',
    hop_le: true,
    payload: { vnp_ResponseCode: '00', txnRef: `TXN_${String(i).padStart(4, '0')}` },
    ket_qua_xu_ly: { processed: true },
    tao_luc: '2026-02-01 08:11:00',
  })),
};

export default payment_webhook_logSeeder;

