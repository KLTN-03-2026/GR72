import type { TableSeeder } from '../types';

const khieu_naiSeeder: TableSeeder = {
  table: 'khieu_nai',
  rows: [
    // Khiếu nại về booking (đang xử lý)
    {
      id: 1, ma_khieu_nai: 'KN_0001', nguoi_gui_id: 17, loai_khieu_nai: 'booking', doi_tuong_id: 25,
      tieu_de: 'Chuyên gia huỷ lịch đột ngột không báo trước',
      noi_dung: 'Tôi đã đặt lịch buổi 3 với PT Trần Văn Khải (BOOK_0025) nhưng chuyên gia huỷ vào tối hôm trước mà không thông báo trước. Tôi đã thu xếp công việc để tham dự.',
      muc_uu_tien: 'cao', trang_thai: 'dang_xu_ly', gan_cho_id: 1,
      ket_qua_xu_ly: 'Đã liên hệ chuyên gia, cấp 1 buổi tư vấn miễn phí.',
      dong_luc: null, tao_luc: '2026-04-16 09:00:00', cap_nhat_luc: '2026-04-17 10:00:00',
    },
    // Khiếu nại về chất lượng tư vấn (chờ phản hồi)
    {
      id: 2, ma_khieu_nai: 'KN_0002', nguoi_gui_id: 19, loai_khieu_nai: 'booking', doi_tuong_id: 8,
      tieu_de: 'Tư vấn không phù hợp với tình trạng bệnh',
      noi_dung: 'Tôi có IBS và đã nói rõ ngay đầu buổi, nhưng chuyên gia vẫn gợi ý một số thực phẩm chứa gluten. Tôi cảm thấy chưa được lắng nghe đúng mức.',
      muc_uu_tien: 'trung_binh', trang_thai: 'cho_phan_hoi', gan_cho_id: 1,
      ket_qua_xu_ly: null,
      dong_luc: null, tao_luc: '2026-03-07 10:00:00', cap_nhat_luc: '2026-03-07 10:00:00',
    },
    // Khiếu nại về thanh toán (đã giải quyết)
    {
      id: 3, ma_khieu_nai: 'KN_0003', nguoi_gui_id: 12, loai_khieu_nai: 'thanh_toan', doi_tuong_id: 16,
      tieu_de: 'Yêu cầu hoàn tiền gói chưa sử dụng',
      noi_dung: 'Tôi mua gói PURCH_016 nhưng bị bệnh không thể tham gia được, muốn hoàn tiền gói còn 3 buổi chưa dùng.',
      muc_uu_tien: 'trung_binh', trang_thai: 'da_giai_quyet', gan_cho_id: 1,
      ket_qua_xu_ly: 'Đã hoàn tiền 100% theo chính sách huỷ trong 3 ngày đầu.',
      dong_luc: null, tao_luc: '2026-04-12 09:00:00', cap_nhat_luc: '2026-04-12 14:00:00',
    },
    // Khiếu nại về đánh giá (đã đóng)
    {
      id: 4, ma_khieu_nai: 'KN_0004', nguoi_gui_id: 13, loai_khieu_nai: 'danh_gia', doi_tuong_id: 13,
      tieu_de: 'Đánh giá id 13 vi phạm nội dung',
      noi_dung: 'Đánh giá này chứa nội dung sai sự thật và bôi nhọ chuyên gia. Yêu cầu xem xét và ẩn đánh giá.',
      muc_uu_tien: 'cao', trang_thai: 'da_dong', gan_cho_id: 1,
      ket_qua_xu_ly: 'Đã xem xét và ẩn đánh giá vi phạm.',
      dong_luc: '2026-04-23 10:00:00', tao_luc: '2026-04-23 08:00:00', cap_nhat_luc: '2026-04-23 10:00:00',
    },
    // Khiếu nại mới (chưa xử lý)
    {
      id: 5, ma_khieu_nai: 'KN_0005', nguoi_gui_id: 20, loai_khieu_nai: 'khac', doi_tuong_id: null,
      tieu_de: 'Không nhận được thông báo nhắc lịch',
      noi_dung: 'Tôi đã bật thông báo nhưng không nhận được tin nhắc lịch hẹn trước 1 tiếng như hệ thống cam kết. Suýt bỏ lỡ buổi tư vấn.',
      muc_uu_tien: 'thap', trang_thai: 'moi', gan_cho_id: null,
      ket_qua_xu_ly: null,
      dong_luc: null, tao_luc: '2026-05-07 08:00:00', cap_nhat_luc: '2026-05-07 08:00:00',
    },
  ],
};

export default khieu_naiSeeder;
