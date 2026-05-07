import type { TableSeeder } from '../types';

const khieu_nai_tin_nhanSeeder: TableSeeder = {
  table: 'khieu_nai_tin_nhan',
  rows: [
    // Khiếu nại 1 - customer gửi thêm bằng chứng
    { id: 1, khieu_nai_id: 1, nguoi_gui_id: 17, noi_dung: 'Tôi đính kèm ảnh chụp màn hình thông báo huỷ lịch nhận được lúc 20h tối, trong khi lịch hẹn là 9h sáng hôm sau.', tep_dinh_kem: ['screenshot_cancel.jpg'], tao_luc: '2026-04-16 09:30:00' },
    // Admin phản hồi khiếu nại 1
    { id: 2, khieu_nai_id: 1, nguoi_gui_id: 1, noi_dung: 'Chúng tôi đã xác nhận việc chuyên gia huỷ quá trễ. Chúng tôi sẽ liên hệ chuyên gia và hoàn 1 buổi tư vấn cho bạn trong vòng 24h.', tep_dinh_kem: [], tao_luc: '2026-04-17 10:00:00' },
    // Customer confirm nhận bù
    { id: 3, khieu_nai_id: 1, nguoi_gui_id: 17, noi_dung: 'Cảm ơn bạn đã xử lý nhanh chóng! Tôi đã nhận được buổi bù rồi.', tep_dinh_kem: [], tao_luc: '2026-04-18 08:00:00' },
    // Khiếu nại 2 - customer cung cấp chi tiết
    { id: 4, khieu_nai_id: 2, nguoi_gui_id: 19, noi_dung: 'Cụ thể, chuyên gia gợi ý tôi ăn bánh mì nguyên cám trong khi tôi đã nói tôi dị ứng gluten. Đây không phải thực phẩm phù hợp với IBS-gluten sensitivity.', tep_dinh_kem: [], tao_luc: '2026-03-07 11:00:00' },
    // Khiếu nại 3 - customer xác nhận đã nhận refund
    { id: 5, khieu_nai_id: 3, nguoi_gui_id: 12, noi_dung: 'Đã nhận được hoàn tiền. Cảm ơn đội ngũ hỗ trợ đã giải quyết nhanh chóng!', tep_dinh_kem: [], tao_luc: '2026-04-12 15:00:00' },
  ],
};

export default khieu_nai_tin_nhanSeeder;
