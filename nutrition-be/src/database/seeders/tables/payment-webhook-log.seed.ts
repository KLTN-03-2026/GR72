import type { TableSeeder } from '../types';

const payment_webhook_logSeeder: TableSeeder = {
  table: 'payment_webhook_log',
  rows: [
    { id: 1,  thanh_toan_id: 1,  txn_ref: 'TXN_0001', loai_webhook: 'ipn',    hop_le: true,  payload: { vnp_ResponseCode: '00', vnp_TxnRef: 'TXN_0001', vnp_Amount: '49900000' },   ket_qua_xu_ly: { processed: true, payment_updated: true },  tao_luc: '2026-01-16 10:04:00' },
    { id: 2,  thanh_toan_id: 1,  txn_ref: 'TXN_0001', loai_webhook: 'return', hop_le: true,  payload: { vnp_ResponseCode: '00', vnp_TxnRef: 'TXN_0001' },                           ket_qua_xu_ly: { processed: true, redirected: true },        tao_luc: '2026-01-16 10:05:00' },
    { id: 3,  thanh_toan_id: 2,  txn_ref: 'TXN_0002', loai_webhook: 'ipn',    hop_le: true,  payload: { vnp_ResponseCode: '00', vnp_TxnRef: 'TXN_0002', vnp_Amount: '149000000' },  ket_qua_xu_ly: { processed: true, payment_updated: true },  tao_luc: '2026-01-21 09:14:00' },
    { id: 4,  thanh_toan_id: 4,  txn_ref: 'TXN_0004', loai_webhook: 'ipn',    hop_le: true,  payload: { vnp_ResponseCode: '00', vnp_TxnRef: 'TXN_0004', vnp_Amount: '119000000' },  ket_qua_xu_ly: { processed: true, payment_updated: true },  tao_luc: '2026-01-11 14:29:00' },
    { id: 5,  thanh_toan_id: 5,  txn_ref: 'TXN_0005', loai_webhook: 'ipn',    hop_le: true,  payload: { vnp_ResponseCode: '00', vnp_TxnRef: 'TXN_0005', vnp_Amount: '64900000' },   ket_qua_xu_ly: { processed: true, payment_updated: true },  tao_luc: '2026-02-11 15:59:00' },
    { id: 6,  thanh_toan_id: 6,  txn_ref: 'TXN_0006', loai_webhook: 'ipn',    hop_le: true,  payload: { vnp_ResponseCode: '00', vnp_TxnRef: 'TXN_0006', vnp_Amount: '350000000' },  ket_qua_xu_ly: { processed: true, payment_updated: true },  tao_luc: '2026-01-26 09:29:00' },
    { id: 7,  thanh_toan_id: 8,  txn_ref: 'TXN_0008', loai_webhook: 'ipn',    hop_le: true,  payload: { vnp_ResponseCode: '00', vnp_TxnRef: 'TXN_0008', vnp_Amount: '64900000' },   ket_qua_xu_ly: { processed: true, payment_updated: true },  tao_luc: '2026-03-02 10:29:00' },
    { id: 8,  thanh_toan_id: 9,  txn_ref: 'TXN_0009', loai_webhook: 'ipn',    hop_le: true,  payload: { vnp_ResponseCode: '00', vnp_TxnRef: 'TXN_0009', vnp_Amount: '24900000' },   ket_qua_xu_ly: { processed: true, payment_updated: true },  tao_luc: '2026-02-21 13:09:00' },
    { id: 9,  thanh_toan_id: 11, txn_ref: 'TXN_0011', loai_webhook: 'ipn',    hop_le: true,  payload: { vnp_ResponseCode: '00', vnp_TxnRef: 'TXN_0011', vnp_Amount: '24900000' },   ket_qua_xu_ly: { processed: true, payment_updated: true },  tao_luc: '2026-03-06 13:59:00' },
    { id: 10, thanh_toan_id: 12, txn_ref: 'TXN_0012', loai_webhook: 'ipn',    hop_le: true,  payload: { vnp_ResponseCode: '00', vnp_TxnRef: 'TXN_0012', vnp_Amount: '219000000' },  ket_qua_xu_ly: { processed: true, payment_updated: true },  tao_luc: '2026-02-16 09:29:00' },
    { id: 11, thanh_toan_id: 14, txn_ref: 'TXN_0014', loai_webhook: 'ipn',    hop_le: true,  payload: { vnp_ResponseCode: '00', vnp_TxnRef: 'TXN_0014', vnp_Amount: '119000000' },  ket_qua_xu_ly: { processed: true, payment_updated: true },  tao_luc: '2026-03-16 14:59:00' },
    { id: 12, thanh_toan_id: 15, txn_ref: 'TXN_0015', loai_webhook: 'ipn',    hop_le: true,  payload: { vnp_ResponseCode: '00', vnp_TxnRef: 'TXN_0015', vnp_Amount: '350000000' },  ket_qua_xu_ly: { processed: true, payment_updated: true },  tao_luc: '2026-04-01 08:59:00' },
    { id: 13, thanh_toan_id: 16, txn_ref: 'TXN_0016', loai_webhook: 'ipn',    hop_le: true,  payload: { vnp_ResponseCode: '00', vnp_TxnRef: 'TXN_0016', vnp_Amount: '49900000' },   ket_qua_xu_ly: { processed: true, payment_updated: true },  tao_luc: '2026-04-10 09:59:00' },
    // Webhook thất bại (payload sai chữ ký)
    { id: 14, thanh_toan_id: null, txn_ref: 'TXN_INVALID_001', loai_webhook: 'ipn', hop_le: false, payload: { vnp_ResponseCode: '00', vnp_TxnRef: 'TXN_INVALID_001', vnp_SecureHash: 'invalid' }, ket_qua_xu_ly: { processed: false, error: 'Invalid signature' }, tao_luc: '2026-03-15 10:00:00' },
  ],
};

export default payment_webhook_logSeeder;
