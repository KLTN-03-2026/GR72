import type { TableSeeder } from '../types';

const thong_baoSeeder: TableSeeder = {
  table: 'thong_bao',
  rows: [
    // Customer 11 nhận thông báo lịch hẹn xác nhận
    { id: 1,  tai_khoan_id: 11, nguoi_gui_id: 3,  loai: 'booking',     tieu_de: 'Lịch hẹn đã được xác nhận', noi_dung: 'Chuyên gia ThS Lê Minh Phương đã xác nhận lịch tư vấn ngày 22/01/2026 lúc 09:00.', trang_thai: 'da_doc', duong_dan_hanh_dong: '/user/bookings/1', entity_type: 'lich_hen', entity_id: 1,  tao_luc: '2026-01-20 11:30:00', doc_luc: '2026-01-20 12:00:00', cap_nhat_luc: '2026-01-20 12:00:00' },
    { id: 2,  tai_khoan_id: 11, nguoi_gui_id: null, loai: 'reminder',   tieu_de: 'Nhắc lịch tư vấn ngày mai', noi_dung: 'Bạn có lịch tư vấn với ThS Lê Minh Phương vào ngày mai 22/01/2026 lúc 09:00. Hãy chuẩn bị sẵn câu hỏi nhé!', trang_thai: 'da_doc', duong_dan_hanh_dong: '/user/bookings/1', entity_type: 'lich_hen', entity_id: 1,  tao_luc: '2026-01-21 09:00:00', doc_luc: '2026-01-21 09:30:00', cap_nhat_luc: '2026-01-21 09:30:00' },
    { id: 3,  tai_khoan_id: 11, nguoi_gui_id: null, loai: 'booking',    tieu_de: 'Buổi tư vấn hoàn thành', noi_dung: 'Buổi tư vấn với ThS Lê Minh Phương ngày 22/01 đã hoàn thành. Đừng quên đánh giá để giúp cộng đồng nhé!', trang_thai: 'da_doc', duong_dan_hanh_dong: '/user/bookings/1/review', entity_type: 'lich_hen', entity_id: 1, tao_luc: '2026-01-22 09:50:00', doc_luc: '2026-01-22 10:30:00', cap_nhat_luc: '2026-01-22 10:30:00' },
    // Customer 12 - thông báo thanh toán thành công
    { id: 4,  tai_khoan_id: 12, nguoi_gui_id: null, loai: 'thanh_toan', tieu_de: 'Thanh toán thành công', noi_dung: 'Bạn đã mua thành công gói "Kiểm soát Đường huyết & Tim mạch - 6 buổi" trị giá 1,490,000 VNĐ.', trang_thai: 'da_doc', duong_dan_hanh_dong: '/user/packages/2', entity_type: 'goi_da_mua', entity_id: 2, tao_luc: '2026-01-21 09:15:00', doc_luc: '2026-01-21 09:20:00', cap_nhat_luc: '2026-01-21 09:20:00' },
    // Expert 1 - thông báo booking mới
    { id: 5,  tai_khoan_id: 3,  nguoi_gui_id: 11, loai: 'booking',     tieu_de: 'Yêu cầu đặt lịch mới', noi_dung: 'Khách hàng Nguyễn Thị Mai muốn đặt lịch tư vấn ngày 22/01/2026 lúc 09:00. Vui lòng xác nhận trong 24h.', trang_thai: 'da_doc', duong_dan_hanh_dong: '/nutritionist/bookings/1', entity_type: 'lich_hen', entity_id: 1, tao_luc: '2026-01-20 10:00:00', doc_luc: '2026-01-20 11:00:00', cap_nhat_luc: '2026-01-20 11:00:00' },
    // Customer 17 - thông báo lịch bị huỷ
    { id: 6,  tai_khoan_id: 17, nguoi_gui_id: 3,  loai: 'booking',     tieu_de: 'Lịch hẹn bị huỷ', noi_dung: 'Rất tiếc, buổi tư vấn ngày 16/04/2026 lúc 16:00 với PT Trần Văn Khải đã bị huỷ. Lượt tư vấn đã được hoàn lại vào gói của bạn.', trang_thai: 'da_doc', duong_dan_hanh_dong: '/user/bookings/25', entity_type: 'lich_hen', entity_id: 25, tao_luc: '2026-04-15 20:05:00', doc_luc: '2026-04-16 07:00:00', cap_nhat_luc: '2026-04-16 07:00:00' },
    // Admin - thông báo khiếu nại mới
    { id: 7,  tai_khoan_id: 1,  nguoi_gui_id: 17, loai: 'khieu_nai',   tieu_de: 'Khiếu nại mới cần xử lý', noi_dung: 'Khách hàng Ngô Thị Bích (KN_0001) đã gửi khiếu nại về việc chuyên gia huỷ lịch đột ngột. Mức ưu tiên: Cao.', trang_thai: 'chua_doc', duong_dan_hanh_dong: '/admin/complaints/1', entity_type: 'khieu_nai', entity_id: 1, tao_luc: '2026-04-16 09:05:00', doc_luc: null, cap_nhat_luc: '2026-04-16 09:05:00' },
    // Customer 12 - thông báo refund
    { id: 8,  tai_khoan_id: 12, nguoi_gui_id: null, loai: 'thanh_toan', tieu_de: 'Hoàn tiền thành công', noi_dung: 'Yêu cầu hoàn tiền gói PURCH_016 đã được xử lý thành công. 499,000 VNĐ sẽ được hoàn về tài khoản trong 3-5 ngày làm việc.', trang_thai: 'da_doc', duong_dan_hanh_dong: '/user/payments', entity_type: 'refund', entity_id: 1, tao_luc: '2026-04-12 14:05:00', doc_luc: '2026-04-12 14:30:00', cap_nhat_luc: '2026-04-12 14:30:00' },
    // Customer 19 - thông báo đặt lịch xác nhận (booking 22 chờ xác nhận)
    { id: 9,  tai_khoan_id: 12, nguoi_gui_id: null, loai: 'booking',    tieu_de: 'Đặt lịch đang chờ xác nhận', noi_dung: 'Yêu cầu đặt lịch ngày 15/05/2026 lúc 08:00 với TS Vũ Thị Mai Anh đã được gửi. Chờ chuyên gia xác nhận (trong 24h).', trang_thai: 'chua_doc', duong_dan_hanh_dong: '/user/bookings/22', entity_type: 'lich_hen', entity_id: 22, tao_luc: '2026-05-07 09:01:00', doc_luc: null, cap_nhat_luc: '2026-05-07 09:01:00' },
    // Expert 5 - thông báo booking chờ xác nhận
    { id: 10, tai_khoan_id: 7,  nguoi_gui_id: 12, loai: 'booking',     tieu_de: 'Yêu cầu đặt lịch mới', noi_dung: 'Khách hàng Trần Văn Bình muốn đặt lịch buổi 4 ngày 15/05/2026 lúc 08:00. Vui lòng xác nhận.', trang_thai: 'chua_doc', duong_dan_hanh_dong: '/nutritionist/bookings/22', entity_type: 'lich_hen', entity_id: 22, tao_luc: '2026-05-07 09:01:00', doc_luc: null, cap_nhat_luc: '2026-05-07 09:01:00' },
    // Customer 20 - thông báo khiếu nại (vấn đề thông báo)
    { id: 11, tai_khoan_id: 20, nguoi_gui_id: null, loai: 'he_thong',  tieu_de: 'Khiếu nại đã được tiếp nhận', noi_dung: 'Khiếu nại KN_0005 của bạn về vấn đề thông báo đã được tiếp nhận và sẽ được xử lý trong 3 ngày làm việc.', trang_thai: 'chua_doc', duong_dan_hanh_dong: '/user/complaints/5', entity_type: 'khieu_nai', entity_id: 5, tao_luc: '2026-05-07 08:05:00', doc_luc: null, cap_nhat_luc: '2026-05-07 08:05:00' },
  ],
};

export default thong_baoSeeder;
