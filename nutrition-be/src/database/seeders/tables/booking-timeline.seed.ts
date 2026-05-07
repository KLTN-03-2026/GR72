import type { TableSeeder } from '../types';

const booking_timelineSeeder: TableSeeder = {
  table: 'booking_timeline',
  rows: [
    // Booking 1 - BOOK_0001 (customer 11, expert 1) - hoàn thành
    { id: 1,  lich_hen_id: 1, actor_id: 11, su_kien: 'tao_lich_hen',     trang_thai_truoc: null,          trang_thai_sau: 'cho_xac_nhan',  ghi_chu: 'Khách hàng đặt lịch',         metadata: { source: 'customer_booking' },  tao_luc: '2026-01-20 10:00:00' },
    { id: 2,  lich_hen_id: 1, actor_id: 3,  su_kien: 'xac_nhan_lich',    trang_thai_truoc: 'cho_xac_nhan', trang_thai_sau: 'da_xac_nhan',   ghi_chu: 'Chuyên gia xác nhận',         metadata: { source: 'expert_confirm' },    tao_luc: '2026-01-20 11:30:00' },
    { id: 3,  lich_hen_id: 1, actor_id: 3,  su_kien: 'bat_dau_tu_van',   trang_thai_truoc: 'da_xac_nhan',  trang_thai_sau: 'dang_tu_van',   ghi_chu: 'Bắt đầu phiên tư vấn',       metadata: { roomName: 'consultation-1' }, tao_luc: '2026-01-22 09:00:00' },
    { id: 4,  lich_hen_id: 1, actor_id: 3,  su_kien: 'hoan_thanh_booking', trang_thai_truoc: 'dang_tu_van', trang_thai_sau: 'hoan_thanh',   ghi_chu: 'Hoàn thành tư vấn',           metadata: { duration: 2700 },             tao_luc: '2026-01-22 09:45:00' },
    // Booking 2 - BOOK_0002 (customer 12, expert 5)
    { id: 5,  lich_hen_id: 2, actor_id: 12, su_kien: 'tao_lich_hen',     trang_thai_truoc: null,          trang_thai_sau: 'cho_xac_nhan',  ghi_chu: 'Khách hàng đặt lịch',         metadata: { source: 'customer_booking' },  tao_luc: '2026-01-25 09:00:00' },
    { id: 6,  lich_hen_id: 2, actor_id: 7,  su_kien: 'xac_nhan_lich',    trang_thai_truoc: 'cho_xac_nhan', trang_thai_sau: 'da_xac_nhan',   ghi_chu: 'Chuyên gia xác nhận',         metadata: { source: 'expert_confirm' },    tao_luc: '2026-01-25 10:00:00' },
    { id: 7,  lich_hen_id: 2, actor_id: 7,  su_kien: 'bat_dau_tu_van',   trang_thai_truoc: 'da_xac_nhan',  trang_thai_sau: 'dang_tu_van',   ghi_chu: 'Bắt đầu phiên tư vấn',       metadata: { roomName: 'consultation-2' }, tao_luc: '2026-01-27 08:00:00' },
    { id: 8,  lich_hen_id: 2, actor_id: 7,  su_kien: 'hoan_thanh_booking', trang_thai_truoc: 'dang_tu_van', trang_thai_sau: 'hoan_thanh',   ghi_chu: 'Hoàn thành tư vấn',           metadata: { duration: 2700 },             tao_luc: '2026-01-27 08:45:00' },
    // Booking 14 - BOOK_0014 (customer 15, expert 4) - hoàn thành
    { id: 9,  lich_hen_id: 14, actor_id: 15, su_kien: 'tao_lich_hen',    trang_thai_truoc: null,          trang_thai_sau: 'cho_xac_nhan',  ghi_chu: 'Khách hàng đặt lịch',         metadata: { source: 'customer_booking' }, tao_luc: '2026-04-10 11:00:00' },
    { id: 10, lich_hen_id: 14, actor_id: 6,  su_kien: 'xac_nhan_lich',   trang_thai_truoc: 'cho_xac_nhan', trang_thai_sau: 'da_xac_nhan',   ghi_chu: 'Chuyên gia xác nhận',         metadata: { source: 'expert_confirm' },   tao_luc: '2026-04-10 14:00:00' },
    { id: 11, lich_hen_id: 14, actor_id: 6,  su_kien: 'bat_dau_tu_van',  trang_thai_truoc: 'da_xac_nhan',  trang_thai_sau: 'dang_tu_van',   ghi_chu: 'Bắt đầu phiên tư vấn',       metadata: { roomName: 'consultation-14' }, tao_luc: '2026-04-14 09:00:00' },
    { id: 12, lich_hen_id: 14, actor_id: 6,  su_kien: 'hoan_thanh_booking', trang_thai_truoc: 'dang_tu_van', trang_thai_sau: 'hoan_thanh',  ghi_chu: 'Hoàn thành tư vấn',           metadata: { duration: 2700 },             tao_luc: '2026-04-14 09:45:00' },
    // Booking 24 - BOOK_0024 bị huỷ
    { id: 13, lich_hen_id: 24, actor_id: 15, su_kien: 'tao_lich_hen',    trang_thai_truoc: null,          trang_thai_sau: 'cho_xac_nhan',  ghi_chu: 'Khách hàng đặt lịch',         metadata: { source: 'customer_booking' }, tao_luc: '2026-04-03 10:00:00' },
    { id: 14, lich_hen_id: 24, actor_id: 6,  su_kien: 'xac_nhan_lich',   trang_thai_truoc: 'cho_xac_nhan', trang_thai_sau: 'da_xac_nhan',   ghi_chu: 'Chuyên gia xác nhận',         metadata: { source: 'expert_confirm' },   tao_luc: '2026-04-03 14:00:00' },
    { id: 15, lich_hen_id: 24, actor_id: 15, su_kien: 'huy_lich',        trang_thai_truoc: 'da_xac_nhan',  trang_thai_sau: 'da_huy',        ghi_chu: 'Khách hàng huỷ vì bận đột xuất', metadata: { reason: 'customer_cancel' }, tao_luc: '2026-04-06 19:00:00' },
    // Booking 22 - BOOK_0022 chờ xác nhận
    { id: 16, lich_hen_id: 22, actor_id: 12, su_kien: 'tao_lich_hen',    trang_thai_truoc: null,          trang_thai_sau: 'cho_xac_nhan',  ghi_chu: 'Khách hàng đặt lịch',         metadata: { source: 'customer_booking' }, tao_luc: '2026-05-07 09:00:00' },
    // Booking 26 - BOOK_0026 đang tư vấn
    { id: 17, lich_hen_id: 26, actor_id: 22, su_kien: 'tao_lich_hen',    trang_thai_truoc: null,          trang_thai_sau: 'cho_xac_nhan',  ghi_chu: 'Khách hàng đặt lịch',         metadata: { source: 'customer_booking' }, tao_luc: '2026-05-04 10:00:00' },
    { id: 18, lich_hen_id: 26, actor_id: 5,  su_kien: 'xac_nhan_lich',   trang_thai_truoc: 'cho_xac_nhan', trang_thai_sau: 'da_xac_nhan',   ghi_chu: 'Chuyên gia xác nhận',         metadata: { source: 'expert_confirm' },   tao_luc: '2026-05-04 14:00:00' },
    { id: 19, lich_hen_id: 26, actor_id: 5,  su_kien: 'bat_dau_tu_van',  trang_thai_truoc: 'da_xac_nhan',  trang_thai_sau: 'dang_tu_van',   ghi_chu: 'Bắt đầu phiên tư vấn',       metadata: { roomName: 'consultation-26' }, tao_luc: '2026-05-07 16:00:00' },
  ],
};

export default booking_timelineSeeder;
