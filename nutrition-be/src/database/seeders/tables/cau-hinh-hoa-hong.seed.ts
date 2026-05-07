import type { TableSeeder } from '../types';

const cau_hinh_hoa_hongSeeder: TableSeeder = {
  table: 'cau_hinh_hoa_hong',
  rows: [
    // Cấu hình mặc định toàn hệ thống (30%)
    { id: 1, pham_vi: 'he_thong', goi_dich_vu_id: null, chuyen_gia_id: null, ty_le_hoa_hong: 30, hieu_luc_tu: '2026-01-01', hieu_luc_den: null, trang_thai: 'hoat_dong', tao_luc: '2026-01-01 08:00:00', cap_nhat_luc: '2026-01-01 08:00:00' },
    // Gói cao cấp (id 11 - Sức khoẻ Toàn diện 3.5M) - giảm về 25% để thu hút chuyên gia tốt
    { id: 2, pham_vi: 'goi_dich_vu', goi_dich_vu_id: 11, chuyen_gia_id: null, ty_le_hoa_hong: 25, hieu_luc_tu: '2026-01-01', hieu_luc_den: null, trang_thai: 'hoat_dong', tao_luc: '2026-01-01 08:00:00', cap_nhat_luc: '2026-01-01 08:00:00' },
    // Gói dinh dưỡng bệnh lý (id 6 - Kiểm soát Đường huyết) - 28%
    { id: 3, pham_vi: 'goi_dich_vu', goi_dich_vu_id: 6, chuyen_gia_id: null, ty_le_hoa_hong: 28, hieu_luc_tu: '2026-01-01', hieu_luc_den: null, trang_thai: 'hoat_dong', tao_luc: '2026-01-01 08:00:00', cap_nhat_luc: '2026-01-01 08:00:00' },
    // Chuyên gia mới (id 1 - ThS Lê Minh Phương) - ưu đãi 35% để xây dựng booking
    { id: 4, pham_vi: 'chuyen_gia', goi_dich_vu_id: null, chuyen_gia_id: 1, ty_le_hoa_hong: 35, hieu_luc_tu: '2026-01-06', hieu_luc_den: '2026-06-30', trang_thai: 'hoat_dong', tao_luc: '2026-01-06 08:00:00', cap_nhat_luc: '2026-01-06 08:00:00' },
    // Chuyên gia xuất sắc (id 5 - TS Vũ Thị Mai Anh) - đặc cách 40%
    { id: 5, pham_vi: 'chuyen_gia', goi_dich_vu_id: null, chuyen_gia_id: 5, ty_le_hoa_hong: 40, hieu_luc_tu: '2026-01-06', hieu_luc_den: null, trang_thai: 'hoat_dong', tao_luc: '2026-01-06 08:00:00', cap_nhat_luc: '2026-01-06 08:00:00' },
  ],
};

export default cau_hinh_hoa_hongSeeder;
