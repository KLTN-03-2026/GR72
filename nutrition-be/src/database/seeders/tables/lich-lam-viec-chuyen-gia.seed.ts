import type { TableSeeder } from '../types';

// thu_trong_tuan ISO: 1=T2(Mon), 2=T3, 3=T4, 4=T5, 5=T6, 6=T7(Sat), 7=CN(Sun)
const T = '2026-01-06 09:00:00';

type Slot = {
  chuyen_gia_id: number;
  thu_trong_tuan: number;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  thoi_luong_slot_phut: number;
};

// 6 khung chuẩn cho mỗi ngày: 6:30, 9, 12, 14, 17, 20 — đảm bảo full-time
const STANDARD_FRAMES: Array<[string, string]> = [
  ['06:30:00', '09:00:00'],   // Sáng sớm
  ['09:00:00', '12:00:00'],   // Sáng
  ['13:30:00', '17:00:00'],   // Chiều
  ['17:30:00', '20:30:00'],   // Tối
];

// Frame gọn hơn cho cuối tuần (CN, T7)
const WEEKEND_FRAMES: Array<[string, string]> = [
  ['07:00:00', '11:00:00'],
  ['14:00:00', '17:30:00'],
];

// Build helper: mỗi expert được gán: T2-T6 đầy đủ 4 frames + T7/CN 2 frames
function buildExpertSchedule(
  expertId: number,
  slotMinutes: number,
): Slot[] {
  const slots: Slot[] = [];
  // T2 → T6
  for (let day = 2; day <= 6; day++) {
    for (const [start, end] of STANDARD_FRAMES) {
      slots.push({ chuyen_gia_id: expertId, thu_trong_tuan: day, gio_bat_dau: start, gio_ket_thuc: end, thoi_luong_slot_phut: slotMinutes });
    }
  }
  // T7
  for (const [start, end] of WEEKEND_FRAMES) {
    slots.push({ chuyen_gia_id: expertId, thu_trong_tuan: 7, gio_bat_dau: start, gio_ket_thuc: end, thoi_luong_slot_phut: slotMinutes });
  }
  // CN
  for (const [start, end] of WEEKEND_FRAMES) {
    slots.push({ chuyen_gia_id: expertId, thu_trong_tuan: 1, gio_bat_dau: start, gio_ket_thuc: end, thoi_luong_slot_phut: slotMinutes });
  }
  return slots;
}

// 7 chuyên gia active (1, 2, 3, 4, 5, 6, 8) — Expert 7 đang `cho_duyet` nên không có lịch
const EXPERT_CONFIG: Array<{ id: number; slotMinutes: number }> = [
  { id: 1, slotMinutes: 45 },
  { id: 2, slotMinutes: 45 },
  { id: 3, slotMinutes: 60 }, // PT, slot dài hơn
  { id: 4, slotMinutes: 45 },
  { id: 5, slotMinutes: 45 },
  { id: 6, slotMinutes: 60 },
  { id: 8, slotMinutes: 45 },
];

const allSlots: Slot[] = [];
for (const cfg of EXPERT_CONFIG) {
  allSlots.push(...buildExpertSchedule(cfg.id, cfg.slotMinutes));
}

const lich_lam_viec_chuyen_giaSeeder: TableSeeder = {
  table: 'lich_lam_viec_chuyen_gia',
  rows: allSlots.map((s, idx) => ({
    id: idx + 1,
    chuyen_gia_id: s.chuyen_gia_id,
    thu_trong_tuan: s.thu_trong_tuan,
    gio_bat_dau: s.gio_bat_dau,
    gio_ket_thuc: s.gio_ket_thuc,
    thoi_luong_slot_phut: s.thoi_luong_slot_phut,
    trang_thai: 'hoat_dong',
    tao_luc: T,
    cap_nhat_luc: T,
  })),
};

export default lich_lam_viec_chuyen_giaSeeder;
