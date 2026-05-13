import type { TableSeeder } from '../types';

// thu_trong_tuan: 1=CN, 2=T2, 3=T3, 4=T4, 5=T5, 6=T6, 7=T7
const T = '2026-01-06 09:00:00';
const lich_lam_viec_chuyen_giaSeeder: TableSeeder = {
  table: 'lich_lam_viec_chuyen_gia',
  rows: [
    // ─── Expert 1 (ThS Lê Minh Phương) — full-time, đa khung giờ T2/T4/T6 + tối T5 ───
    { id: 1,  chuyen_gia_id: 1, thu_trong_tuan: 2, gio_bat_dau: '07:00:00', gio_ket_thuc: '11:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: T, cap_nhat_luc: T },
    { id: 2,  chuyen_gia_id: 1, thu_trong_tuan: 2, gio_bat_dau: '13:30:00', gio_ket_thuc: '17:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: T, cap_nhat_luc: T },
    { id: 3,  chuyen_gia_id: 1, thu_trong_tuan: 4, gio_bat_dau: '07:00:00', gio_ket_thuc: '11:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: T, cap_nhat_luc: T },
    { id: 4,  chuyen_gia_id: 1, thu_trong_tuan: 4, gio_bat_dau: '13:30:00', gio_ket_thuc: '17:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: T, cap_nhat_luc: T },
    { id: 5,  chuyen_gia_id: 1, thu_trong_tuan: 5, gio_bat_dau: '18:00:00', gio_ket_thuc: '21:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: T, cap_nhat_luc: T }, // Tối T5
    { id: 6,  chuyen_gia_id: 1, thu_trong_tuan: 6, gio_bat_dau: '07:00:00', gio_ket_thuc: '11:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: T, cap_nhat_luc: T },

    // ─── Expert 2 (BS Nguyễn Thu Hà) — sáng + tối T3/T5, full cuối tuần ───
    { id: 7,  chuyen_gia_id: 2, thu_trong_tuan: 3, gio_bat_dau: '06:30:00', gio_ket_thuc: '10:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: T, cap_nhat_luc: T }, // Sáng sớm
    { id: 8,  chuyen_gia_id: 2, thu_trong_tuan: 3, gio_bat_dau: '19:00:00', gio_ket_thuc: '21:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: T, cap_nhat_luc: T }, // Tối
    { id: 9,  chuyen_gia_id: 2, thu_trong_tuan: 5, gio_bat_dau: '06:30:00', gio_ket_thuc: '10:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: T, cap_nhat_luc: T },
    { id: 10, chuyen_gia_id: 2, thu_trong_tuan: 5, gio_bat_dau: '19:00:00', gio_ket_thuc: '21:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: T, cap_nhat_luc: T },
    { id: 11, chuyen_gia_id: 2, thu_trong_tuan: 7, gio_bat_dau: '08:00:00', gio_ket_thuc: '11:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: T, cap_nhat_luc: T }, // T7 sáng
    { id: 12, chuyen_gia_id: 2, thu_trong_tuan: 7, gio_bat_dau: '14:00:00', gio_ket_thuc: '17:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: T, cap_nhat_luc: T },
    { id: 13, chuyen_gia_id: 2, thu_trong_tuan: 1, gio_bat_dau: '08:00:00', gio_ket_thuc: '11:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: T, cap_nhat_luc: T }, // CN

    // ─── Expert 3 (PT Trần Văn Khải) — sau giờ làm, cuối tuần (gym đối tượng) ───
    { id: 14, chuyen_gia_id: 3, thu_trong_tuan: 2, gio_bat_dau: '17:30:00', gio_ket_thuc: '21:30:00', thoi_luong_slot_phut: 60, trang_thai: 'hoat_dong', tao_luc: '2026-01-07 09:00:00', cap_nhat_luc: '2026-01-07 09:00:00' },
    { id: 15, chuyen_gia_id: 3, thu_trong_tuan: 4, gio_bat_dau: '17:30:00', gio_ket_thuc: '21:30:00', thoi_luong_slot_phut: 60, trang_thai: 'hoat_dong', tao_luc: '2026-01-07 09:00:00', cap_nhat_luc: '2026-01-07 09:00:00' },
    { id: 16, chuyen_gia_id: 3, thu_trong_tuan: 6, gio_bat_dau: '17:30:00', gio_ket_thuc: '21:30:00', thoi_luong_slot_phut: 60, trang_thai: 'hoat_dong', tao_luc: '2026-01-07 09:00:00', cap_nhat_luc: '2026-01-07 09:00:00' },
    { id: 17, chuyen_gia_id: 3, thu_trong_tuan: 7, gio_bat_dau: '07:00:00', gio_ket_thuc: '11:00:00', thoi_luong_slot_phut: 60, trang_thai: 'hoat_dong', tao_luc: '2026-01-07 09:00:00', cap_nhat_luc: '2026-01-07 09:00:00' }, // T7 sáng sớm
    { id: 18, chuyen_gia_id: 3, thu_trong_tuan: 7, gio_bat_dau: '15:00:00', gio_ket_thuc: '19:00:00', thoi_luong_slot_phut: 60, trang_thai: 'hoat_dong', tao_luc: '2026-01-07 09:00:00', cap_nhat_luc: '2026-01-07 09:00:00' },
    { id: 19, chuyen_gia_id: 3, thu_trong_tuan: 1, gio_bat_dau: '07:00:00', gio_ket_thuc: '11:00:00', thoi_luong_slot_phut: 60, trang_thai: 'hoat_dong', tao_luc: '2026-01-07 09:00:00', cap_nhat_luc: '2026-01-07 09:00:00' }, // CN sáng

    // ─── Expert 4 (ThS Phạm Ngọc Linh) — đa dạng cả ngày, tối T2 ───
    { id: 20, chuyen_gia_id: 4, thu_trong_tuan: 2, gio_bat_dau: '09:00:00', gio_ket_thuc: '12:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-08 09:00:00', cap_nhat_luc: '2026-01-08 09:00:00' },
    { id: 21, chuyen_gia_id: 4, thu_trong_tuan: 2, gio_bat_dau: '19:30:00', gio_ket_thuc: '21:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-08 09:00:00', cap_nhat_luc: '2026-01-08 09:00:00' }, // Tối
    { id: 22, chuyen_gia_id: 4, thu_trong_tuan: 3, gio_bat_dau: '09:00:00', gio_ket_thuc: '12:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-08 09:00:00', cap_nhat_luc: '2026-01-08 09:00:00' },
    { id: 23, chuyen_gia_id: 4, thu_trong_tuan: 3, gio_bat_dau: '14:00:00', gio_ket_thuc: '17:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-08 09:00:00', cap_nhat_luc: '2026-01-08 09:00:00' },
    { id: 24, chuyen_gia_id: 4, thu_trong_tuan: 5, gio_bat_dau: '09:00:00', gio_ket_thuc: '12:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-08 09:00:00', cap_nhat_luc: '2026-01-08 09:00:00' },
    { id: 25, chuyen_gia_id: 4, thu_trong_tuan: 5, gio_bat_dau: '14:00:00', gio_ket_thuc: '17:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-08 09:00:00', cap_nhat_luc: '2026-01-08 09:00:00' },
    { id: 26, chuyen_gia_id: 4, thu_trong_tuan: 7, gio_bat_dau: '09:00:00', gio_ket_thuc: '12:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-08 09:00:00', cap_nhat_luc: '2026-01-08 09:00:00' }, // T7

    // ─── Expert 5 (TS Vũ Thị Mai Anh) — chuyên gia hàng đầu, đa khung ───
    { id: 27, chuyen_gia_id: 5, thu_trong_tuan: 2, gio_bat_dau: '08:00:00', gio_ket_thuc: '11:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: T, cap_nhat_luc: T },
    { id: 28, chuyen_gia_id: 5, thu_trong_tuan: 2, gio_bat_dau: '14:00:00', gio_ket_thuc: '17:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: T, cap_nhat_luc: T },
    { id: 29, chuyen_gia_id: 5, thu_trong_tuan: 3, gio_bat_dau: '08:00:00', gio_ket_thuc: '11:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: T, cap_nhat_luc: T },
    { id: 30, chuyen_gia_id: 5, thu_trong_tuan: 4, gio_bat_dau: '08:00:00', gio_ket_thuc: '11:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: T, cap_nhat_luc: T },
    { id: 31, chuyen_gia_id: 5, thu_trong_tuan: 4, gio_bat_dau: '20:00:00', gio_ket_thuc: '22:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: T, cap_nhat_luc: T }, // Tối muộn T4
    { id: 32, chuyen_gia_id: 5, thu_trong_tuan: 5, gio_bat_dau: '08:00:00', gio_ket_thuc: '11:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: T, cap_nhat_luc: T },
    { id: 33, chuyen_gia_id: 5, thu_trong_tuan: 6, gio_bat_dau: '08:00:00', gio_ket_thuc: '11:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: T, cap_nhat_luc: T },
    { id: 34, chuyen_gia_id: 5, thu_trong_tuan: 6, gio_bat_dau: '14:00:00', gio_ket_thuc: '17:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: T, cap_nhat_luc: T },

    // ─── Expert 6 (BS Đỗ Thanh Bình) — văn phòng, hơi rộng ───
    { id: 35, chuyen_gia_id: 6, thu_trong_tuan: 3, gio_bat_dau: '09:00:00', gio_ket_thuc: '17:00:00', thoi_luong_slot_phut: 60, trang_thai: 'hoat_dong', tao_luc: '2026-01-09 09:00:00', cap_nhat_luc: '2026-01-09 09:00:00' },
    { id: 36, chuyen_gia_id: 6, thu_trong_tuan: 5, gio_bat_dau: '09:00:00', gio_ket_thuc: '17:00:00', thoi_luong_slot_phut: 60, trang_thai: 'hoat_dong', tao_luc: '2026-01-09 09:00:00', cap_nhat_luc: '2026-01-09 09:00:00' },

    // ─── Expert 8 (ThS Lý Quốc Bảo) — sáng + cuối tuần ───
    { id: 37, chuyen_gia_id: 8, thu_trong_tuan: 2, gio_bat_dau: '09:00:00', gio_ket_thuc: '12:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-10 09:00:00', cap_nhat_luc: '2026-01-10 09:00:00' },
    { id: 38, chuyen_gia_id: 8, thu_trong_tuan: 4, gio_bat_dau: '09:00:00', gio_ket_thuc: '12:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-10 09:00:00', cap_nhat_luc: '2026-01-10 09:00:00' },
    { id: 39, chuyen_gia_id: 8, thu_trong_tuan: 6, gio_bat_dau: '20:00:00', gio_ket_thuc: '21:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-10 09:00:00', cap_nhat_luc: '2026-01-10 09:00:00' }, // Tối T6
    { id: 40, chuyen_gia_id: 8, thu_trong_tuan: 7, gio_bat_dau: '08:00:00', gio_ket_thuc: '11:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-10 09:00:00', cap_nhat_luc: '2026-01-10 09:00:00' },
    { id: 41, chuyen_gia_id: 8, thu_trong_tuan: 7, gio_bat_dau: '14:00:00', gio_ket_thuc: '17:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-10 09:00:00', cap_nhat_luc: '2026-01-10 09:00:00' },
    { id: 42, chuyen_gia_id: 8, thu_trong_tuan: 1, gio_bat_dau: '14:00:00', gio_ket_thuc: '17:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-10 09:00:00', cap_nhat_luc: '2026-01-10 09:00:00' }, // CN
  ],
};

export default lich_lam_viec_chuyen_giaSeeder;
