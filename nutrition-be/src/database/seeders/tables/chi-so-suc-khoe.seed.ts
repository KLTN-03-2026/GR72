import type { TableSeeder } from '../types';

const chi_so_suc_khoeSeeder: TableSeeder = {
  table: 'chi_so_suc_khoe',
  rows: [
    // Customer 1 (Nguyễn Thị Mai - muốn giảm cân)
    { id: 1,  tai_khoan_id: 11, do_luc: '2026-01-15 07:30:00', can_nang_kg: 62.0, vong_eo_cm: 76, vong_mong_cm: 95, huyet_ap_tam_thu: 115, huyet_ap_tam_truong: 75, nhip_tim: 72, duong_huyet: 5.1, chat_luong_giac_ngu: 6, muc_nang_luong: 6, bmi: 24.9, canh_bao: [], ghi_chu: 'Đo lần đầu khi đăng ký', tao_luc: '2026-01-15 07:30:00', cap_nhat_luc: '2026-01-15 07:30:00', xoa_luc: null },
    { id: 2,  tai_khoan_id: 11, do_luc: '2026-02-15 07:30:00', can_nang_kg: 60.5, vong_eo_cm: 74, vong_mong_cm: 93, huyet_ap_tam_thu: 112, huyet_ap_tam_truong: 73, nhip_tim: 70, duong_huyet: 5.0, chat_luong_giac_ngu: 7, muc_nang_luong: 7, bmi: 24.3, canh_bao: [], ghi_chu: 'Sau 1 tháng tư vấn', tao_luc: '2026-02-15 07:30:00', cap_nhat_luc: '2026-02-15 07:30:00', xoa_luc: null },
    { id: 3,  tai_khoan_id: 11, do_luc: '2026-03-15 07:30:00', can_nang_kg: 59.0, vong_eo_cm: 72, vong_mong_cm: 92, huyet_ap_tam_thu: 110, huyet_ap_tam_truong: 72, nhip_tim: 68, duong_huyet: 4.9, chat_luong_giac_ngu: 7, muc_nang_luong: 8, bmi: 23.6, canh_bao: [], ghi_chu: 'Tiến triển tốt', tao_luc: '2026-03-15 07:30:00', cap_nhat_luc: '2026-03-15 07:30:00', xoa_luc: null },
    // Customer 2 (Trần Văn Bình - tiểu đường type 2)
    { id: 4,  tai_khoan_id: 12, do_luc: '2026-01-20 07:00:00', can_nang_kg: 85.0, vong_eo_cm: 96, vong_mong_cm: 105, huyet_ap_tam_thu: 138, huyet_ap_tam_truong: 88, nhip_tim: 80, duong_huyet: 8.2, chat_luong_giac_ngu: 5, muc_nang_luong: 5, bmi: 28.7, canh_bao: ['tieu_duong_cao', 'huyet_ap_cao'], ghi_chu: 'Cần theo dõi sát', tao_luc: '2026-01-20 07:00:00', cap_nhat_luc: '2026-01-20 07:00:00', xoa_luc: null },
    { id: 5,  tai_khoan_id: 12, do_luc: '2026-02-20 07:00:00', can_nang_kg: 83.5, vong_eo_cm: 94, vong_mong_cm: 103, huyet_ap_tam_thu: 132, huyet_ap_tam_truong: 85, nhip_tim: 78, duong_huyet: 7.5, chat_luong_giac_ngu: 6, muc_nang_luong: 6, bmi: 28.2, canh_bao: ['tieu_duong_cao'], ghi_chu: 'Đường huyết cải thiện', tao_luc: '2026-02-20 07:00:00', cap_nhat_luc: '2026-02-20 07:00:00', xoa_luc: null },
    // Customer 3 (Lê Thị Hoa - sau sinh)
    { id: 6,  tai_khoan_id: 13, do_luc: '2026-02-01 08:00:00', can_nang_kg: 68.0, vong_eo_cm: 82, vong_mong_cm: 98, huyet_ap_tam_thu: 110, huyet_ap_tam_truong: 70, nhip_tim: 75, duong_huyet: 4.8, chat_luong_giac_ngu: 5, muc_nang_luong: 5, bmi: 25.6, canh_bao: [], ghi_chu: 'Đo sau sinh 6 tháng', tao_luc: '2026-02-01 08:00:00', cap_nhat_luc: '2026-02-01 08:00:00', xoa_luc: null },
    // Customer 4 (Phạm Đức Anh - gym tăng cơ)
    { id: 7,  tai_khoan_id: 14, do_luc: '2026-01-10 06:30:00', can_nang_kg: 70.0, vong_eo_cm: 78, vong_mong_cm: 94, huyet_ap_tam_thu: 118, huyet_ap_tam_truong: 76, nhip_tim: 65, duong_huyet: 5.2, chat_luong_giac_ngu: 8, muc_nang_luong: 9, bmi: 22.9, canh_bao: [], ghi_chu: 'Thể trạng tốt', tao_luc: '2026-01-10 06:30:00', cap_nhat_luc: '2026-01-10 06:30:00', xoa_luc: null },
    { id: 8,  tai_khoan_id: 14, do_luc: '2026-02-10 06:30:00', can_nang_kg: 72.5, vong_eo_cm: 79, vong_mong_cm: 95, huyet_ap_tam_thu: 120, huyet_ap_tam_truong: 77, nhip_tim: 63, duong_huyet: 5.3, chat_luong_giac_ngu: 8, muc_nang_luong: 9, bmi: 23.7, canh_bao: [], ghi_chu: 'Tăng cân tốt', tao_luc: '2026-02-10 06:30:00', cap_nhat_luc: '2026-02-10 06:30:00', xoa_luc: null },
    // Customer 5 (Vũ Thị Lan - sinh viên)
    { id: 9,  tai_khoan_id: 15, do_luc: '2026-02-10 09:00:00', can_nang_kg: 52.0, vong_eo_cm: 66, vong_mong_cm: 88, huyet_ap_tam_thu: 105, huyet_ap_tam_truong: 68, nhip_tim: 76, duong_huyet: 4.6, chat_luong_giac_ngu: 5, muc_nang_luong: 4, bmi: 20.3, canh_bao: ['muc_nang_luong_thap'], ghi_chu: 'Có thể thiếu sắt', tao_luc: '2026-02-10 09:00:00', cap_nhat_luc: '2026-02-10 09:00:00', xoa_luc: null },
    // Customer 6 (Đỗ Minh Khoa - huyết áp cao mỡ máu)
    { id: 10, tai_khoan_id: 16, do_luc: '2026-01-25 07:00:00', can_nang_kg: 88.0, vong_eo_cm: 98, vong_mong_cm: 106, huyet_ap_tam_thu: 145, huyet_ap_tam_truong: 92, nhip_tim: 82, duong_huyet: 5.8, chat_luong_giac_ngu: 5, muc_nang_luong: 5, bmi: 31.2, canh_bao: ['huyet_ap_cao', 'beo_phi'], ghi_chu: 'Nguy cơ tim mạch cao', tao_luc: '2026-01-25 07:00:00', cap_nhat_luc: '2026-01-25 07:00:00', xoa_luc: null },
    { id: 11, tai_khoan_id: 16, do_luc: '2026-03-25 07:00:00', can_nang_kg: 85.5, vong_eo_cm: 95, vong_mong_cm: 104, huyet_ap_tam_thu: 135, huyet_ap_tam_truong: 87, nhip_tim: 79, duong_huyet: 5.5, chat_luong_giac_ngu: 6, muc_nang_luong: 6, bmi: 30.3, canh_bao: ['huyet_ap_cao'], ghi_chu: 'Cải thiện dần', tao_luc: '2026-03-25 07:00:00', cap_nhat_luc: '2026-03-25 07:00:00', xoa_luc: null },
    // Customer 7 (Ngô Thị Bích - chạy bộ)
    { id: 12, tai_khoan_id: 17, do_luc: '2026-02-05 06:00:00', can_nang_kg: 55.0, vong_eo_cm: 68, vong_mong_cm: 90, huyet_ap_tam_thu: 112, huyet_ap_tam_truong: 72, nhip_tim: 60, duong_huyet: 4.7, chat_luong_giac_ngu: 8, muc_nang_luong: 9, bmi: 20.2, canh_bao: [], ghi_chu: 'Thể lực tốt', tao_luc: '2026-02-05 06:00:00', cap_nhat_luc: '2026-02-05 06:00:00', xoa_luc: null },
    // Customer 8 (Hoàng Văn Đức - văn phòng)
    { id: 13, tai_khoan_id: 18, do_luc: '2026-03-01 08:30:00', can_nang_kg: 78.0, vong_eo_cm: 88, vong_mong_cm: 100, huyet_ap_tam_thu: 125, huyet_ap_tam_truong: 80, nhip_tim: 77, duong_huyet: 5.4, chat_luong_giac_ngu: 6, muc_nang_luong: 6, bmi: 27.0, canh_bao: [], ghi_chu: 'Thừa cân nhẹ', tao_luc: '2026-03-01 08:30:00', cap_nhat_luc: '2026-03-01 08:30:00', xoa_luc: null },
    // Customer 9 (Trịnh Thị Thu - IBS)
    { id: 14, tai_khoan_id: 19, do_luc: '2026-02-20 09:00:00', can_nang_kg: 55.0, vong_eo_cm: 70, vong_mong_cm: 91, huyet_ap_tam_thu: 108, huyet_ap_tam_truong: 69, nhip_tim: 73, duong_huyet: 4.8, chat_luong_giac_ngu: 6, muc_nang_luong: 6, bmi: 20.9, canh_bao: [], ghi_chu: 'IBS đang điều trị', tao_luc: '2026-02-20 09:00:00', cap_nhat_luc: '2026-02-20 09:00:00', xoa_luc: null },
    // Customer 10 (Lưu Văn Thành - 55 tuổi)
    { id: 15, tai_khoan_id: 20, do_luc: '2026-01-18 07:30:00', can_nang_kg: 72.0, vong_eo_cm: 84, vong_mong_cm: 100, huyet_ap_tam_thu: 128, huyet_ap_tam_truong: 82, nhip_tim: 74, duong_huyet: 5.6, chat_luong_giac_ngu: 6, muc_nang_luong: 6, bmi: 25.8, canh_bao: [], ghi_chu: 'Mật độ xương thấp', tao_luc: '2026-01-18 07:30:00', cap_nhat_luc: '2026-01-18 07:30:00', xoa_luc: null },
    // Customer 11 (Đinh Thị Phương - ăn chay)
    { id: 16, tai_khoan_id: 21, do_luc: '2026-03-05 09:00:00', can_nang_kg: 50.0, vong_eo_cm: 65, vong_mong_cm: 87, huyet_ap_tam_thu: 106, huyet_ap_tam_truong: 67, nhip_tim: 71, duong_huyet: 4.5, chat_luong_giac_ngu: 7, muc_nang_luong: 7, bmi: 19.3, canh_bao: ['can_nang_thap'], ghi_chu: 'BMI thấp, cần chú ý dinh dưỡng', tao_luc: '2026-03-05 09:00:00', cap_nhat_luc: '2026-03-05 09:00:00', xoa_luc: null },
    // Customer 12 (Bùi Quang Minh - bơi lội)
    { id: 17, tai_khoan_id: 22, do_luc: '2026-02-15 06:30:00', can_nang_kg: 78.0, vong_eo_cm: 82, vong_mong_cm: 96, huyet_ap_tam_thu: 119, huyet_ap_tam_truong: 75, nhip_tim: 58, duong_huyet: 5.0, chat_luong_giac_ngu: 8, muc_nang_luong: 9, bmi: 24.1, canh_bao: [], ghi_chu: 'Nhịp tim thấp tốt do tập thể thao', tao_luc: '2026-02-15 06:30:00', cap_nhat_luc: '2026-02-15 06:30:00', xoa_luc: null },
    // Customer 13 (Cao Thị Dung - tiền mãn kinh)
    { id: 18, tai_khoan_id: 23, do_luc: '2026-03-10 08:00:00', can_nang_kg: 65.0, vong_eo_cm: 80, vong_mong_cm: 96, huyet_ap_tam_thu: 122, huyet_ap_tam_truong: 78, nhip_tim: 76, duong_huyet: 5.3, chat_luong_giac_ngu: 5, muc_nang_luong: 5, bmi: 26.7, canh_bao: [], ghi_chu: 'Tăng cân sau 1 năm', tao_luc: '2026-03-10 08:00:00', cap_nhat_luc: '2026-03-10 08:00:00', xoa_luc: null },
    // Customer 14 (Nguyễn Hùng Cường - tăng cân gym)
    { id: 19, tai_khoan_id: 24, do_luc: '2026-03-15 06:30:00', can_nang_kg: 68.0, vong_eo_cm: 77, vong_mong_cm: 93, huyet_ap_tam_thu: 116, huyet_ap_tam_truong: 74, nhip_tim: 66, duong_huyet: 5.1, chat_luong_giac_ngu: 8, muc_nang_luong: 8, bmi: 22.7, canh_bao: [], ghi_chu: 'Mục tiêu tăng 8kg cơ', tao_luc: '2026-03-15 06:30:00', cap_nhat_luc: '2026-03-15 06:30:00', xoa_luc: null },
  ],
};

export default chi_so_suc_khoeSeeder;
