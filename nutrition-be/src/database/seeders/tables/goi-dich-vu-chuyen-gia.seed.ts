import type { TableSeeder } from '../types';

const goi_dich_vu_chuyen_giaSeeder: TableSeeder = {
  table: 'goi_dich_vu_chuyen_gia',
  rows: [
    // Expert 1 (ThS Lê Minh Phương - Dinh dưỡng lâm sàng) → gói dinh dưỡng
    { id: 1,  goi_dich_vu_id: 1,  chuyen_gia_id: 1, trang_thai: 'hoat_dong', ty_le_hoa_hong_override: null, gan_boi: 1, gan_luc: '2026-01-06 09:00:00', cap_nhat_luc: '2026-01-06 09:00:00' },
    { id: 2,  goi_dich_vu_id: 2,  chuyen_gia_id: 1, trang_thai: 'hoat_dong', ty_le_hoa_hong_override: null, gan_boi: 1, gan_luc: '2026-01-06 09:00:00', cap_nhat_luc: '2026-01-06 09:00:00' },
    { id: 3,  goi_dich_vu_id: 5,  chuyen_gia_id: 1, trang_thai: 'hoat_dong', ty_le_hoa_hong_override: null, gan_boi: 1, gan_luc: '2026-01-06 09:00:00', cap_nhat_luc: '2026-01-06 09:00:00' },
    // Expert 2 (BS Nguyễn Thu Hà - Dinh dưỡng nhi & phụ nữ) → nhi khoa + giảm cân
    { id: 4,  goi_dich_vu_id: 7,  chuyen_gia_id: 2, trang_thai: 'hoat_dong', ty_le_hoa_hong_override: null, gan_boi: 1, gan_luc: '2026-01-06 09:00:00', cap_nhat_luc: '2026-01-06 09:00:00' },
    { id: 5,  goi_dich_vu_id: 1,  chuyen_gia_id: 2, trang_thai: 'hoat_dong', ty_le_hoa_hong_override: null, gan_boi: 1, gan_luc: '2026-01-06 09:00:00', cap_nhat_luc: '2026-01-06 09:00:00' },
    { id: 6,  goi_dich_vu_id: 5,  chuyen_gia_id: 2, trang_thai: 'hoat_dong', ty_le_hoa_hong_override: null, gan_boi: 1, gan_luc: '2026-01-06 09:00:00', cap_nhat_luc: '2026-01-06 09:00:00' },
    // Expert 3 (PT Trần Văn Khải - Thể hình & dinh dưỡng thể thao) → tập luyện 35% override
    { id: 7,  goi_dich_vu_id: 3,  chuyen_gia_id: 3, trang_thai: 'hoat_dong', ty_le_hoa_hong_override: 35, gan_boi: 1, gan_luc: '2026-01-07 09:00:00', cap_nhat_luc: '2026-01-07 09:00:00' },
    { id: 8,  goi_dich_vu_id: 4,  chuyen_gia_id: 3, trang_thai: 'hoat_dong', ty_le_hoa_hong_override: 35, gan_boi: 1, gan_luc: '2026-01-07 09:00:00', cap_nhat_luc: '2026-01-07 09:00:00' },
    { id: 9,  goi_dich_vu_id: 9,  chuyen_gia_id: 3, trang_thai: 'hoat_dong', ty_le_hoa_hong_override: null, gan_boi: 1, gan_luc: '2026-01-07 09:00:00', cap_nhat_luc: '2026-01-07 09:00:00' },
    // Expert 4 (ThS Phạm Ngọc Linh - Giảm cân bền vững) → giảm cân + tổng quát 40% override
    { id: 10, goi_dich_vu_id: 2,  chuyen_gia_id: 4, trang_thai: 'hoat_dong', ty_le_hoa_hong_override: null, gan_boi: 1, gan_luc: '2026-01-08 09:00:00', cap_nhat_luc: '2026-01-08 09:00:00' },
    { id: 11, goi_dich_vu_id: 11, chuyen_gia_id: 4, trang_thai: 'hoat_dong', ty_le_hoa_hong_override: 40, gan_boi: 1, gan_luc: '2026-01-08 09:00:00', cap_nhat_luc: '2026-01-08 09:00:00' },
    { id: 12, goi_dich_vu_id: 5,  chuyen_gia_id: 4, trang_thai: 'hoat_dong', ty_le_hoa_hong_override: null, gan_boi: 1, gan_luc: '2026-01-08 09:00:00', cap_nhat_luc: '2026-01-08 09:00:00' },
    // Expert 5 (TS Vũ Thị Mai Anh - Dinh dưỡng bệnh lý) → bệnh lý + sức khỏe tổng quát 40% override
    { id: 13, goi_dich_vu_id: 6,  chuyen_gia_id: 5, trang_thai: 'hoat_dong', ty_le_hoa_hong_override: null, gan_boi: 1, gan_luc: '2026-01-06 09:00:00', cap_nhat_luc: '2026-01-06 09:00:00' },
    { id: 14, goi_dich_vu_id: 11, chuyen_gia_id: 5, trang_thai: 'hoat_dong', ty_le_hoa_hong_override: 40, gan_boi: 1, gan_luc: '2026-01-06 09:00:00', cap_nhat_luc: '2026-01-06 09:00:00' },
    { id: 15, goi_dich_vu_id: 5,  chuyen_gia_id: 5, trang_thai: 'hoat_dong', ty_le_hoa_hong_override: null, gan_boi: 1, gan_luc: '2026-01-06 09:00:00', cap_nhat_luc: '2026-01-06 09:00:00' },
    // Expert 6 (BS Đỗ Thanh Bình - Phục hồi chức năng, nhan_booking=false) → thể thao
    { id: 16, goi_dich_vu_id: 8,  chuyen_gia_id: 6, trang_thai: 'hoat_dong', ty_le_hoa_hong_override: null, gan_boi: 1, gan_luc: '2026-01-09 09:00:00', cap_nhat_luc: '2026-01-09 09:00:00' },
    { id: 17, goi_dich_vu_id: 3,  chuyen_gia_id: 6, trang_thai: 'hoat_dong', ty_le_hoa_hong_override: null, gan_boi: 1, gan_luc: '2026-01-09 09:00:00', cap_nhat_luc: '2026-01-09 09:00:00' },
    // Expert 8 (ThS Lý Quốc Bảo - Người cao tuổi) → lão khoa + sức khỏe tổng quát
    { id: 18, goi_dich_vu_id: 10, chuyen_gia_id: 8, trang_thai: 'hoat_dong', ty_le_hoa_hong_override: null, gan_boi: 1, gan_luc: '2026-01-10 09:00:00', cap_nhat_luc: '2026-01-10 09:00:00' },
    { id: 19, goi_dich_vu_id: 5,  chuyen_gia_id: 8, trang_thai: 'hoat_dong', ty_le_hoa_hong_override: null, gan_boi: 1, gan_luc: '2026-01-10 09:00:00', cap_nhat_luc: '2026-01-10 09:00:00' },
  ],
};

export default goi_dich_vu_chuyen_giaSeeder;
