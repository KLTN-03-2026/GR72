import type { TableSeeder } from '../types';

const goi_y_dinh_duong_tap_luyenSeeder: TableSeeder = {
  table: 'goi_y_dinh_duong_tap_luyen',
  rows: [
    // Customer 11 - giảm cân
    {
      id: 1, tai_khoan_id: 11, phien_chat_ai_id: 1,
      input_snapshot: { goal: 'giam_can', activity: 'nhe_nhang', weight: 62, height: 158 },
      muc_tieu_calories: 1500, muc_tieu_protein_g: 90, muc_tieu_carb_g: 150, muc_tieu_fat_g: 50,
      goi_y_dinh_duong: { sang: '2 trứng luộc + 1 lát bánh mì đen + sữa chua', trua: '150g ức gà + cơm gạo lứt + rau xanh', toi: '150g cá hấp + salad + khoai lang', snack: 'táo hoặc 30g óc chó' },
      goi_y_tap_luyen: { sessionsPerWeek: 5, duration: '30-45 phút', loai: 'đi bộ nhanh hoặc aerobic nhẹ' },
      canh_bao: [], ly_do: 'Tạo thâm hụt calo 300-400kcal/ngày để giảm 0.4kg/tuần, tăng protein để giữ cơ.',
      trang_thai: 'da_ap_dung', ap_dung_luc: '2026-01-16 10:00:00',
      tao_luc: '2026-01-15 09:15:00', cap_nhat_luc: '2026-01-16 10:00:00',
    },
    // Customer 14 - tăng cơ bulking
    {
      id: 2, tai_khoan_id: 14, phien_chat_ai_id: 3,
      input_snapshot: { goal: 'tang_can', activity: 'rat_tich_cuc', weight: 70, height: 175 },
      muc_tieu_calories: 2800, muc_tieu_protein_g: 160, muc_tieu_carb_g: 310, muc_tieu_fat_g: 75,
      goi_y_dinh_duong: { sang: 'Yến mạch 80g + 3 trứng + chuối', trua: '200g ức gà + 2 chén cơm + rau', toi: '200g thịt bò + 1.5 chén cơm + rau', pre_workout: 'cơm + ức gà 1.5h trước', post_workout: 'whey protein 30g + chuối' },
      goi_y_tap_luyen: { sessionsPerWeek: 4, loai: 'Gym - kháng lực', focus: 'progressive overload, compound movements' },
      canh_bao: [], ly_do: 'Bulking lean: tăng calo 300-400kcal trên TDEE, protein 2.3g/kg để tối ưu tổng hợp cơ.',
      trang_thai: 'da_ap_dung', ap_dung_luc: '2026-01-11 10:00:00',
      tao_luc: '2026-01-10 07:15:00', cap_nhat_luc: '2026-01-11 10:00:00',
    },
    // Customer 17 - marathon
    {
      id: 3, tai_khoan_id: 17, phien_chat_ai_id: 6,
      input_snapshot: { goal: 'cai_thien_suc_khoe', activity: 'rat_tich_cuc', weight: 55, height: 165 },
      muc_tieu_calories: 2200, muc_tieu_protein_g: 110, muc_tieu_carb_g: 280, muc_tieu_fat_g: 60,
      goi_y_dinh_duong: { sang: 'Cháo yến mạch + chuối + mật ong', trua: '180g cá hồi/ức gà + 2 chén cơm + rau', toi: '150g protein + 1.5 chén cơm + salad', pre_run: 'chuối + bánh gạo 45 phút trước chạy dài', during_long_run: 'gel carb mỗi 45 phút khi chạy >90 phút' },
      goi_y_tap_luyen: { sessionsPerWeek: 5, loai: 'Chạy bộ kết hợp core training', schedule: 'T2/T4 easy run, T5 tempo, CN long run' },
      canh_bao: [], ly_do: 'Cung cấp đủ glycogen cho long run, tăng khả năng fat-burning và dự trữ carb trước race.',
      trang_thai: 'da_ap_dung', ap_dung_luc: '2026-02-06 09:00:00',
      tao_luc: '2026-02-05 07:20:00', cap_nhat_luc: '2026-02-06 09:00:00',
    },
    // Customer 22 - bơi lội thi đấu
    {
      id: 4, tai_khoan_id: 22, phien_chat_ai_id: 10,
      input_snapshot: { goal: 'cai_thien_suc_khoe', activity: 'rat_tich_cuc', weight: 78, height: 180 },
      muc_tieu_calories: 3000, muc_tieu_protein_g: 150, muc_tieu_carb_g: 350, muc_tieu_fat_g: 80,
      goi_y_dinh_duong: { sang: '3 trứng + yến mạch + sữa', trua: '250g cá/gà + 2.5 chén cơm + rau', toi: '200g protein + 2 chén cơm', pre_race: 'carb-loading 3 ngày trước: tăng cơm 50%', race_day: 'ăn nhẹ 2h trước: bánh mì + mật ong' },
      goi_y_tap_luyen: { sessionsPerWeek: 5, loai: 'Bơi lội + gym nhẹ', focus: 'technique + endurance', taper: '10 ngày trước race giảm 40% volume' },
      canh_bao: [], ly_do: 'Tối ưu glycogen cho bơi thi đấu, carb-loading đúng thời điểm để đạt hiệu suất tối đa.',
      trang_thai: 'moi_tao', ap_dung_luc: null,
      tao_luc: '2026-05-06 19:10:00', cap_nhat_luc: '2026-05-06 19:10:00',
    },
  ],
};

export default goi_y_dinh_duong_tap_luyenSeeder;
