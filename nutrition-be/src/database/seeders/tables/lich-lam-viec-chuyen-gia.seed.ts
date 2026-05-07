import type { TableSeeder } from '../types';

// thu_trong_tuan: 1=CN, 2=T2, 3=T3, 4=T4, 5=T5, 6=T6, 7=T7
const lich_lam_viec_chuyen_giaSeeder: TableSeeder = {
  table: 'lich_lam_viec_chuyen_gia',
  rows: [
    // Expert 1 (ThS Lê Minh Phương) - T2,T3,T4,T5 sáng + chiều
    { id: 1,  chuyen_gia_id: 1, thu_trong_tuan: 2, gio_bat_dau: '08:00:00', gio_ket_thuc: '12:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-06 09:00:00', cap_nhat_luc: '2026-01-06 09:00:00' },
    { id: 2,  chuyen_gia_id: 1, thu_trong_tuan: 2, gio_bat_dau: '14:00:00', gio_ket_thuc: '18:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-06 09:00:00', cap_nhat_luc: '2026-01-06 09:00:00' },
    { id: 3,  chuyen_gia_id: 1, thu_trong_tuan: 4, gio_bat_dau: '08:00:00', gio_ket_thuc: '12:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-06 09:00:00', cap_nhat_luc: '2026-01-06 09:00:00' },
    { id: 4,  chuyen_gia_id: 1, thu_trong_tuan: 4, gio_bat_dau: '14:00:00', gio_ket_thuc: '18:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-06 09:00:00', cap_nhat_luc: '2026-01-06 09:00:00' },
    { id: 5,  chuyen_gia_id: 1, thu_trong_tuan: 6, gio_bat_dau: '08:00:00', gio_ket_thuc: '12:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-06 09:00:00', cap_nhat_luc: '2026-01-06 09:00:00' },
    // Expert 2 (BS Nguyễn Thu Hà) - T3,T5,T7 sáng
    { id: 6,  chuyen_gia_id: 2, thu_trong_tuan: 3, gio_bat_dau: '08:30:00', gio_ket_thuc: '12:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-06 09:00:00', cap_nhat_luc: '2026-01-06 09:00:00' },
    { id: 7,  chuyen_gia_id: 2, thu_trong_tuan: 3, gio_bat_dau: '14:00:00', gio_ket_thuc: '17:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-06 09:00:00', cap_nhat_luc: '2026-01-06 09:00:00' },
    { id: 8,  chuyen_gia_id: 2, thu_trong_tuan: 5, gio_bat_dau: '08:30:00', gio_ket_thuc: '12:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-06 09:00:00', cap_nhat_luc: '2026-01-06 09:00:00' },
    { id: 9,  chuyen_gia_id: 2, thu_trong_tuan: 5, gio_bat_dau: '14:00:00', gio_ket_thuc: '17:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-06 09:00:00', cap_nhat_luc: '2026-01-06 09:00:00' },
    { id: 10, chuyen_gia_id: 2, thu_trong_tuan: 7, gio_bat_dau: '08:00:00', gio_ket_thuc: '12:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-06 09:00:00', cap_nhat_luc: '2026-01-06 09:00:00' },
    // Expert 3 (PT Trần Văn Khải) - T2,T4,T6,T7 buổi chiều/tối
    { id: 11, chuyen_gia_id: 3, thu_trong_tuan: 2, gio_bat_dau: '16:00:00', gio_ket_thuc: '20:00:00', thoi_luong_slot_phut: 60, trang_thai: 'hoat_dong', tao_luc: '2026-01-07 09:00:00', cap_nhat_luc: '2026-01-07 09:00:00' },
    { id: 12, chuyen_gia_id: 3, thu_trong_tuan: 4, gio_bat_dau: '16:00:00', gio_ket_thuc: '20:00:00', thoi_luong_slot_phut: 60, trang_thai: 'hoat_dong', tao_luc: '2026-01-07 09:00:00', cap_nhat_luc: '2026-01-07 09:00:00' },
    { id: 13, chuyen_gia_id: 3, thu_trong_tuan: 6, gio_bat_dau: '16:00:00', gio_ket_thuc: '20:00:00', thoi_luong_slot_phut: 60, trang_thai: 'hoat_dong', tao_luc: '2026-01-07 09:00:00', cap_nhat_luc: '2026-01-07 09:00:00' },
    { id: 14, chuyen_gia_id: 3, thu_trong_tuan: 7, gio_bat_dau: '08:00:00', gio_ket_thuc: '12:00:00', thoi_luong_slot_phut: 60, trang_thai: 'hoat_dong', tao_luc: '2026-01-07 09:00:00', cap_nhat_luc: '2026-01-07 09:00:00' },
    // Expert 4 (ThS Phạm Ngọc Linh) - T2,T3,T5 cả ngày
    { id: 15, chuyen_gia_id: 4, thu_trong_tuan: 2, gio_bat_dau: '09:00:00', gio_ket_thuc: '12:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-08 09:00:00', cap_nhat_luc: '2026-01-08 09:00:00' },
    { id: 16, chuyen_gia_id: 4, thu_trong_tuan: 2, gio_bat_dau: '14:00:00', gio_ket_thuc: '18:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-08 09:00:00', cap_nhat_luc: '2026-01-08 09:00:00' },
    { id: 17, chuyen_gia_id: 4, thu_trong_tuan: 3, gio_bat_dau: '09:00:00', gio_ket_thuc: '12:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-08 09:00:00', cap_nhat_luc: '2026-01-08 09:00:00' },
    { id: 18, chuyen_gia_id: 4, thu_trong_tuan: 5, gio_bat_dau: '09:00:00', gio_ket_thuc: '12:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-08 09:00:00', cap_nhat_luc: '2026-01-08 09:00:00' },
    { id: 19, chuyen_gia_id: 4, thu_trong_tuan: 5, gio_bat_dau: '14:00:00', gio_ket_thuc: '18:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-08 09:00:00', cap_nhat_luc: '2026-01-08 09:00:00' },
    // Expert 5 (TS Vũ Thị Mai Anh) - T2-T6 sáng (chuyên gia hàng đầu, nhiều giờ)
    { id: 20, chuyen_gia_id: 5, thu_trong_tuan: 2, gio_bat_dau: '08:00:00', gio_ket_thuc: '11:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-06 09:00:00', cap_nhat_luc: '2026-01-06 09:00:00' },
    { id: 21, chuyen_gia_id: 5, thu_trong_tuan: 3, gio_bat_dau: '08:00:00', gio_ket_thuc: '11:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-06 09:00:00', cap_nhat_luc: '2026-01-06 09:00:00' },
    { id: 22, chuyen_gia_id: 5, thu_trong_tuan: 4, gio_bat_dau: '08:00:00', gio_ket_thuc: '11:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-06 09:00:00', cap_nhat_luc: '2026-01-06 09:00:00' },
    { id: 23, chuyen_gia_id: 5, thu_trong_tuan: 5, gio_bat_dau: '08:00:00', gio_ket_thuc: '11:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-06 09:00:00', cap_nhat_luc: '2026-01-06 09:00:00' },
    { id: 24, chuyen_gia_id: 5, thu_trong_tuan: 6, gio_bat_dau: '08:00:00', gio_ket_thuc: '11:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-06 09:00:00', cap_nhat_luc: '2026-01-06 09:00:00' },
    // Expert 6 (BS Đỗ Thanh Bình) - T3,T5 (nhan_booking=false, lịch vẫn có)
    { id: 25, chuyen_gia_id: 6, thu_trong_tuan: 3, gio_bat_dau: '09:00:00', gio_ket_thuc: '17:00:00', thoi_luong_slot_phut: 60, trang_thai: 'hoat_dong', tao_luc: '2026-01-09 09:00:00', cap_nhat_luc: '2026-01-09 09:00:00' },
    { id: 26, chuyen_gia_id: 6, thu_trong_tuan: 5, gio_bat_dau: '09:00:00', gio_ket_thuc: '17:00:00', thoi_luong_slot_phut: 60, trang_thai: 'hoat_dong', tao_luc: '2026-01-09 09:00:00', cap_nhat_luc: '2026-01-09 09:00:00' },
    // Expert 8 (ThS Lý Quốc Bảo) - T2,T4,T7 sáng
    { id: 27, chuyen_gia_id: 8, thu_trong_tuan: 2, gio_bat_dau: '09:00:00', gio_ket_thuc: '12:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-10 09:00:00', cap_nhat_luc: '2026-01-10 09:00:00' },
    { id: 28, chuyen_gia_id: 8, thu_trong_tuan: 4, gio_bat_dau: '09:00:00', gio_ket_thuc: '12:00:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-10 09:00:00', cap_nhat_luc: '2026-01-10 09:00:00' },
    { id: 29, chuyen_gia_id: 8, thu_trong_tuan: 7, gio_bat_dau: '08:00:00', gio_ket_thuc: '11:30:00', thoi_luong_slot_phut: 45, trang_thai: 'hoat_dong', tao_luc: '2026-01-10 09:00:00', cap_nhat_luc: '2026-01-10 09:00:00' },
  ],
};

export default lich_lam_viec_chuyen_giaSeeder;
