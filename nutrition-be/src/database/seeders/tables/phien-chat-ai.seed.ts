import type { TableSeeder } from '../types';

const phien_chat_aiSeeder: TableSeeder = {
  table: 'phien_chat_ai',
  rows: [
    { id: 1,  tai_khoan_id: 11, tieu_de: 'Hỏi về chế độ giảm cân',           loai_context: 'dinh_duong',  context_snapshot: { goal: 'giam_can',          bmi: 24.9, can_nang: 62 },   trang_thai: 'da_luu_tru', tao_luc: '2026-01-15 09:00:00', cap_nhat_luc: '2026-01-15 09:30:00' },
    { id: 2,  tai_khoan_id: 12, tieu_de: 'Câu hỏi về tiểu đường type 2',     loai_context: 'suc_khoe',    context_snapshot: { goal: 'cai_thien_suc_khoe', bmi: 28.7, duong_huyet: 8.2 }, trang_thai: 'da_luu_tru', tao_luc: '2026-01-20 10:00:00', cap_nhat_luc: '2026-01-20 10:45:00' },
    { id: 3,  tai_khoan_id: 14, tieu_de: 'Kế hoạch tăng cơ',                 loai_context: 'tap_luyen',   context_snapshot: { goal: 'tang_can',           bmi: 22.9, can_nang: 70 },   trang_thai: 'da_luu_tru', tao_luc: '2026-01-10 07:00:00', cap_nhat_luc: '2026-01-10 07:40:00' },
    { id: 4,  tai_khoan_id: 15, tieu_de: 'Dinh dưỡng cho sinh viên ít tiền', loai_context: 'dinh_duong',  context_snapshot: { goal: 'cai_thien_suc_khoe', bmi: 20.3 },                trang_thai: 'da_luu_tru', tao_luc: '2026-02-10 20:00:00', cap_nhat_luc: '2026-02-10 20:25:00' },
    { id: 5,  tai_khoan_id: 16, tieu_de: 'Hỏi về huyết áp và chế độ ăn',    loai_context: 'suc_khoe',    context_snapshot: { goal: 'cai_thien_suc_khoe', huyet_ap: '145/92' },      trang_thai: 'da_luu_tru', tao_luc: '2026-01-25 11:00:00', cap_nhat_luc: '2026-01-25 11:35:00' },
    { id: 6,  tai_khoan_id: 17, tieu_de: 'Dinh dưỡng cho marathon',          loai_context: 'tap_luyen',   context_snapshot: { goal: 'cai_thien_suc_khoe', bmi: 20.2 },                trang_thai: 'da_luu_tru', tao_luc: '2026-02-05 07:00:00', cap_nhat_luc: '2026-02-05 07:30:00' },
    { id: 7,  tai_khoan_id: 19, tieu_de: 'Chế độ ăn phù hợp IBS',           loai_context: 'suc_khoe',    context_snapshot: { goal: 'cai_thien_suc_khoe', di_ung: ['gluten'] },      trang_thai: 'da_luu_tru', tao_luc: '2026-02-20 15:00:00', cap_nhat_luc: '2026-02-20 15:40:00' },
    { id: 8,  tai_khoan_id: 21, tieu_de: 'Dinh dưỡng ăn chay vegan',        loai_context: 'dinh_duong',  context_snapshot: { goal: 'giu_can',            bmi: 19.3 },                trang_thai: 'da_luu_tru', tao_luc: '2026-03-05 10:00:00', cap_nhat_luc: '2026-03-05 10:30:00' },
    // Phiên đang mở
    { id: 9,  tai_khoan_id: 11, tieu_de: 'Câu hỏi mới về giảm cân tháng 4', loai_context: 'dinh_duong',  context_snapshot: { goal: 'giam_can',          bmi: 23.6, can_nang: 59 },   trang_thai: 'dang_mo', tao_luc: '2026-05-07 08:00:00', cap_nhat_luc: '2026-05-07 08:15:00' },
    { id: 10, tai_khoan_id: 22, tieu_de: 'Hỏi về phục hồi sau thi đấu',     loai_context: 'tap_luyen',   context_snapshot: { goal: 'cai_thien_suc_khoe', bmi: 24.1 },                trang_thai: 'dang_mo', tao_luc: '2026-05-06 19:00:00', cap_nhat_luc: '2026-05-06 19:20:00' },
  ],
};

export default phien_chat_aiSeeder;
