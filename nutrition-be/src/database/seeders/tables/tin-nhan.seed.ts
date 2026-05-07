import type { TableSeeder } from '../types';

const tin_nhanSeeder: TableSeeder = {
  table: 'tin_nhan',
  rows: [
    // Booking 1: customer 11 (tai_khoan 11) ↔ expert 1 (tai_khoan 3)
    { id: 1,  lich_hen_id: 1, nguoi_gui_id: 11, loai: 'text', noi_dung: 'Chào chuyên gia, tôi muốn giảm cân an toàn mà không cần nhịn ăn. Mong được tư vấn.', tep_dinh_kem: null, da_doc_luc: '2026-01-22 09:05:00', da_doc_boi_id: 3,  tao_luc: '2026-01-22 09:02:00', cap_nhat_luc: '2026-01-22 09:02:00' },
    { id: 2,  lich_hen_id: 1, nguoi_gui_id: 3,  loai: 'text', noi_dung: 'Chào bạn! Tôi đã xem hồ sơ sức khỏe của bạn. BMI 24.9 là ổn nhưng mục tiêu giảm 5kg trong 3 tháng là khả thi. Hãy bắt đầu với thực đơn 1500kcal/ngày nhé.', tep_dinh_kem: null, da_doc_luc: '2026-01-22 09:10:00', da_doc_boi_id: 11, tao_luc: '2026-01-22 09:06:00', cap_nhat_luc: '2026-01-22 09:06:00' },
    { id: 3,  lich_hen_id: 1, nguoi_gui_id: 11, loai: 'text', noi_dung: 'Cảm ơn chuyên gia! Vậy bữa sáng tôi nên ăn gì để no lâu và đủ năng lượng?', tep_dinh_kem: null, da_doc_luc: '2026-01-22 09:15:00', da_doc_boi_id: 3,  tao_luc: '2026-01-22 09:12:00', cap_nhat_luc: '2026-01-22 09:12:00' },
    { id: 4,  lich_hen_id: 1, nguoi_gui_id: 3,  loai: 'text', noi_dung: 'Bữa sáng lý tưởng: 2 trứng luộc + 1 lát bánh mì đen + 1 hũ sữa chua không đường. Protein sẽ giúp bạn no lâu đến tận bữa trưa.', tep_dinh_kem: null, da_doc_luc: '2026-01-22 09:20:00', da_doc_boi_id: 11, tao_luc: '2026-01-22 09:18:00', cap_nhat_luc: '2026-01-22 09:18:00' },
    // Booking 2: customer 12 (tai_khoan 12) ↔ expert 5 (tai_khoan 7)
    { id: 5,  lich_hen_id: 2, nguoi_gui_id: 12, loai: 'text', noi_dung: 'Bác sĩ ơi, đường huyết tôi sau cơm chiều thường lên 9-10 mmol/L, rất lo lắng. Cơm tối tôi nên ăn gì?', tep_dinh_kem: null, da_doc_luc: '2026-01-27 08:05:00', da_doc_boi_id: 7,  tao_luc: '2026-01-27 08:03:00', cap_nhat_luc: '2026-01-27 08:03:00' },
    { id: 6,  lich_hen_id: 2, nguoi_gui_id: 7,  loai: 'text', noi_dung: 'Bữa tối nên là rau luộc (chiếm 50%) + cá hấp hoặc ức gà (25%) + gạo lứt lượng nhỏ (25%). Tuyệt đối không ăn cơm trắng và thức uống có đường.', tep_dinh_kem: null, da_doc_luc: '2026-01-27 08:10:00', da_doc_boi_id: 12, tao_luc: '2026-01-27 08:08:00', cap_nhat_luc: '2026-01-27 08:08:00' },
    { id: 7,  lich_hen_id: 2, nguoi_gui_id: 12, loai: 'text', noi_dung: 'Tôi thích ăn trái cây, vậy có ăn được không?', tep_dinh_kem: null, da_doc_luc: '2026-01-27 08:15:00', da_doc_boi_id: 7,  tao_luc: '2026-01-27 08:13:00', cap_nhat_luc: '2026-01-27 08:13:00' },
    { id: 8,  lich_hen_id: 2, nguoi_gui_id: 7,  loai: 'text', noi_dung: 'Có thể ăn trái cây GI thấp: bưởi, táo xanh, dâu tây. Ăn sau bữa chính 2 tiếng, không ăn lúc đói. Tránh dưa hấu, chuối chín, xoài.', tep_dinh_kem: null, da_doc_luc: '2026-01-27 08:20:00', da_doc_boi_id: 12, tao_luc: '2026-01-27 08:18:00', cap_nhat_luc: '2026-01-27 08:18:00' },
    // Booking 5: customer 13 (tai_khoan 13) ↔ expert 2 (tai_khoan 4)
    { id: 9,  lich_hen_id: 5, nguoi_gui_id: 13, loai: 'text', noi_dung: 'Bác sĩ cho tôi hỏi, tôi dị ứng hải sản thì bổ sung omega-3 bằng cách nào được ạ?', tep_dinh_kem: null, da_doc_luc: '2026-02-10 09:15:00', da_doc_boi_id: 4,  tao_luc: '2026-02-10 09:10:00', cap_nhat_luc: '2026-02-10 09:10:00' },
    { id: 10, lich_hen_id: 5, nguoi_gui_id: 4,  loai: 'text', noi_dung: 'Bạn có thể lấy omega-3 từ hạt chia, hạt lanh xay, óc chó. Đây là nguồn ALA tốt. Nếu cần DHA/EPA thì dùng viên bổ sung dầu tảo (algae oil) an toàn cho người dị ứng hải sản.', tep_dinh_kem: null, da_doc_luc: '2026-02-10 09:20:00', da_doc_boi_id: 13, tao_luc: '2026-02-10 09:17:00', cap_nhat_luc: '2026-02-10 09:17:00' },
    // Booking 14: customer 15 (tai_khoan 15) ↔ expert 4 (tai_khoan 6)
    { id: 11, lich_hen_id: 14, nguoi_gui_id: 15, loai: 'text', noi_dung: 'Em hay ăn mì tôm tối vì ký túc xá không có bếp. Có cách nào ổn hơn không ạ?', tep_dinh_kem: null, da_doc_luc: '2026-04-14 09:10:00', da_doc_boi_id: 6,  tao_luc: '2026-04-14 09:05:00', cap_nhat_luc: '2026-04-14 09:05:00' },
    { id: 12, lich_hen_id: 14, nguoi_gui_id: 6,  loai: 'text', noi_dung: 'Bạn có thể dùng salad trái cây + sữa chua không đường + bánh gạo lứt như bữa tối nhanh, lành mạnh. Hoặc mua cơm hộp nhưng gạt bớt cơm và thêm rau.', tep_dinh_kem: null, da_doc_luc: '2026-04-14 09:18:00', da_doc_boi_id: 15, tao_luc: '2026-04-14 09:15:00', cap_nhat_luc: '2026-04-14 09:15:00' },
    // Booking 26: đang tư vấn (booking dang_tu_van)
    { id: 13, lich_hen_id: 26, nguoi_gui_id: 22, loai: 'text', noi_dung: 'Anh ơi, em vừa thi xong giải bơi tháng 5, đạt được mục tiêu rồi! Giờ em muốn chuyển sang chuẩn bị mùa thi tiếp theo.', tep_dinh_kem: null, da_doc_luc: '2026-05-07 16:05:00', da_doc_boi_id: 5,  tao_luc: '2026-05-07 16:03:00', cap_nhat_luc: '2026-05-07 16:03:00' },
    { id: 14, lich_hen_id: 26, nguoi_gui_id: 5,  loai: 'text', noi_dung: 'Tuyệt vời! Chúc mừng bạn đạt mục tiêu! Chúng ta sẽ xây dựng kế hoạch maintenance 2-3 tháng tới, sau đó chuyển sang chu kỳ tập luyện mới. Bạn có thi giải nào tiếp theo chưa?', tep_dinh_kem: null, da_doc_luc: null, da_doc_boi_id: null, tao_luc: '2026-05-07 16:06:00', cap_nhat_luc: '2026-05-07 16:06:00' },
  ],
};

export default tin_nhanSeeder;
