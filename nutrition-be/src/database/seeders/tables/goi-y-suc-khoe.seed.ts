import type { TableSeeder } from '../types';

const goi_y_suc_khoeSeeder: TableSeeder = {
  table: 'goi_y_suc_khoe',
  rows: [
    {
      id: 1, tai_khoan_id: 12, phien_chat_ai_id: 2,
      loai_goi_y: 'canh_bao_suc_khoe',
      input_snapshot: { bmi: 28.7, duong_huyet: 8.2, huyet_ap: '138/88' },
      noi_dung_goi_y: { canh_bao: 'Đường huyết và huyết áp cao bất thường', hanh_dong: ['Liên hệ bác sĩ ngay', 'Theo dõi đường huyết hàng ngày', 'Hạn chế tinh bột trắng và đồ ngọt'] },
      muc_do_uu_tien: 'cao', canh_bao: ['duong_huyet_cao', 'huyet_ap_cao'],
      ly_do: 'Đường huyết 8.2 mmol/L vượt ngưỡng an toàn, huyết áp 138/88 cần theo dõi.',
      trang_thai: 'luu_tru', ap_dung_luc: '2026-01-21 10:00:00',
      tao_luc: '2026-01-20 10:05:00', cap_nhat_luc: '2026-01-21 10:00:00',
    },
    {
      id: 2, tai_khoan_id: 16, phien_chat_ai_id: 5,
      loai_goi_y: 'canh_bao_suc_khoe',
      input_snapshot: { bmi: 31.2, huyet_ap: '145/92' },
      noi_dung_goi_y: { canh_bao: 'Huyết áp cao + BMI vượt ngưỡng béo phì', hanh_dong: ['Giảm muối xuống dưới 2g/ngày', 'Tập thể dục nhẹ 30 phút/ngày', 'Khám chuyên khoa tim mạch định kỳ'] },
      muc_do_uu_tien: 'cao', canh_bao: ['huyet_ap_cao', 'beo_phi'],
      ly_do: 'Huyết áp 145/92 và BMI 31.2 cần can thiệp sớm để phòng biến chứng tim mạch.',
      trang_thai: 'da_ap_dung', ap_dung_luc: '2026-01-26 10:00:00',
      tao_luc: '2026-01-25 11:10:00', cap_nhat_luc: '2026-01-26 10:00:00',
    },
    {
      id: 3, tai_khoan_id: 15, phien_chat_ai_id: 4,
      loai_goi_y: 'ke_hoach_suc_khoe',
      input_snapshot: { bmi: 20.3, muc_nang_luong: 4, chat_luong_giac_ngu: 5 },
      noi_dung_goi_y: { ke_hoach: ['Không bỏ bữa sáng - ăn trước 9h', 'Ngủ trước 23h, tối thiểu 7 tiếng', 'Hạn chế thiết bị điện tử 1h trước ngủ', 'Bổ sung viên sắt 30mg/ngày trong 3 tháng'] },
      muc_do_uu_tien: 'trung_binh', canh_bao: ['muc_nang_luong_thap'],
      ly_do: 'Hay bỏ bữa và mức năng lượng thấp có thể do thiếu sắt và thói quen ngủ không tốt.',
      trang_thai: 'luu_tru', ap_dung_luc: null,
      tao_luc: '2026-02-10 20:10:00', cap_nhat_luc: '2026-02-10 20:30:00',
    },
    {
      id: 4, tai_khoan_id: 11, phien_chat_ai_id: 1,
      loai_goi_y: 'ke_hoach_suc_khoe',
      input_snapshot: { bmi: 24.9, can_nang: 62, muc_tieu: 'giam_can' },
      noi_dung_goi_y: { ke_hoach: ['Thực đơn 1500kcal/ngày theo kế hoạch', 'Đi bộ 30-45 phút 5 ngày/tuần', 'Cân nặng và đo vòng eo mỗi 2 tuần', 'Ghi nhật ký ăn uống hàng ngày'] },
      muc_do_uu_tien: 'trung_binh', canh_bao: [],
      ly_do: 'BMI gần ngưỡng thừa cân, mục tiêu giảm 5kg trong 3 tháng là phù hợp và khả thi.',
      trang_thai: 'da_ap_dung', ap_dung_luc: '2026-01-16 10:00:00',
      tao_luc: '2026-01-15 09:10:00', cap_nhat_luc: '2026-01-16 10:00:00',
    },
    {
      id: 5, tai_khoan_id: 21, phien_chat_ai_id: 8,
      loai_goi_y: 'canh_bao_suc_khoe',
      input_snapshot: { bmi: 19.3, can_nang: 50 },
      noi_dung_goi_y: { canh_bao: 'BMI hơi thấp với người ăn chay', hanh_dong: ['Tăng calo từ các nguồn thực vật lành mạnh', 'Đảm bảo đủ protein từ đậu lăng, đậu phụ, tempeh', 'Xét nghiệm B12 và ferritin sớm'] },
      muc_do_uu_tien: 'trung_binh', canh_bao: ['can_nang_thap'],
      ly_do: 'BMI 19.3 thấp hơn mức lý tưởng, cần chú ý đảm bảo đủ vi chất khi ăn chay.',
      trang_thai: 'moi_tao', ap_dung_luc: null,
      tao_luc: '2026-03-05 10:10:00', cap_nhat_luc: '2026-03-05 10:10:00',
    },
  ],
};

export default goi_y_suc_khoeSeeder;
