import type { TableSeeder } from '../types';

const refundSeeder: TableSeeder = {
  table: 'refund',
  rows: [
    // Refund thành công cho customer 12 (thanh toán 16 - gói bị huỷ PURCH_016)
    {
      id: 1, thanh_toan_id: 16,
      so_tien: 499000, ly_do: 'Khách hàng bị bệnh không thể sử dụng gói, yêu cầu hoàn tiền trong 3 ngày đầu',
      trang_thai: 'thanh_cong', xu_ly_boi: 1, xu_ly_luc: '2026-04-12 14:00:00',
      raw_response: { refundNo: 'RF_0001', responseCode: '00', message: 'Refund successful' },
      tao_luc: '2026-04-12 09:00:00', cap_nhat_luc: '2026-04-12 14:00:00',
    },
  ],
};

export default refundSeeder;
