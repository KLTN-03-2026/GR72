import type { TableSeeder } from '../types';

// Maps each completed booking to the package usage log
const lich_su_su_dung_goiSeeder: TableSeeder = {
  table: 'lich_su_su_dung_goi',
  rows: [
    // goi_da_mua 1: customer 11 - gói 1 (3 buổi), dùng 2 lần (booking 1 + 19 đã xác nhận)
    { id: 1,  goi_da_mua_id: 1,  lich_hen_id: 1,  loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 2, ghi_chu: 'Buổi 1 hoàn thành', tao_luc: '2026-01-22 09:45:00' },
    { id: 2,  goi_da_mua_id: 1,  lich_hen_id: 19, loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 1, ghi_chu: 'Buổi 2 đặt lịch',   tao_luc: '2026-05-05 10:00:00' },
    // goi_da_mua 2: customer 12 - gói 6 (6 buổi), dùng 3 lần (booking 2, 11, 22)
    { id: 3,  goi_da_mua_id: 2,  lich_hen_id: 2,  loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 5, ghi_chu: 'Buổi 1 hoàn thành', tao_luc: '2026-01-27 08:45:00' },
    { id: 4,  goi_da_mua_id: 2,  lich_hen_id: 11, loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 4, ghi_chu: 'Buổi 2 hoàn thành', tao_luc: '2026-03-24 08:45:00' },
    { id: 5,  goi_da_mua_id: 2,  lich_hen_id: 22, loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 3, ghi_chu: 'Buổi 3 đặt lịch',   tao_luc: '2026-05-07 09:00:00' },
    // goi_da_mua 3: customer 13 - gói 7 (3 buổi), đã hết (booking 5, 16 + 1 trước đó)
    { id: 6,  goi_da_mua_id: 3,  lich_hen_id: 5,  loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 2, ghi_chu: 'Buổi 1 hoàn thành', tao_luc: '2026-02-10 09:45:00' },
    { id: 7,  goi_da_mua_id: 3,  lich_hen_id: 16, loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 1, ghi_chu: 'Buổi 2 hoàn thành', tao_luc: '2026-04-22 09:45:00' },
    { id: 8,  goi_da_mua_id: 3,  lich_hen_id: null, loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 0, ghi_chu: 'Buổi 3 hoàn thành', tao_luc: '2026-04-15 09:45:00' },
    // goi_da_mua 4: customer 14 - gói 3 (6 buổi), dùng 2 lần (booking 3, 13)
    { id: 9,  goi_da_mua_id: 4,  lich_hen_id: 3,  loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 5, ghi_chu: 'Buổi 1 hoàn thành', tao_luc: '2026-01-15 17:00:00' },
    { id: 10, goi_da_mua_id: 4,  lich_hen_id: 13, loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 4, ghi_chu: 'Buổi 2 hoàn thành', tao_luc: '2026-04-08 17:00:00' },
    // goi_da_mua 5: customer 15 - gói 2 (3 buổi), dùng 1 lần (booking 14)
    { id: 11, goi_da_mua_id: 5,  lich_hen_id: 14, loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 2, ghi_chu: 'Buổi 1 hoàn thành', tao_luc: '2026-04-14 09:45:00' },
    // Booking 24 bị huỷ - hoàn lại 1 lượt
    { id: 12, goi_da_mua_id: 5,  lich_hen_id: 24, loai_su_kien: 'hoan_luot', so_luot_thay_doi: 1, so_luot_con_lai_sau: 2, ghi_chu: 'Hoàn lượt do huỷ lịch', tao_luc: '2026-04-06 19:00:00' },
    // goi_da_mua 6: customer 16 - gói 11 (12 buổi), dùng 4 lần (booking 4, 10, 20 + 1)
    { id: 13, goi_da_mua_id: 6,  lich_hen_id: 4,  loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 11, ghi_chu: 'Buổi 1 hoàn thành', tao_luc: '2026-02-03 09:45:00' },
    { id: 14, goi_da_mua_id: 6,  lich_hen_id: 10, loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 10, ghi_chu: 'Buổi 2 hoàn thành', tao_luc: '2026-03-17 09:45:00' },
    { id: 15, goi_da_mua_id: 6,  lich_hen_id: null, loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 9, ghi_chu: 'Buổi 3 hoàn thành', tao_luc: '2026-04-01 09:45:00' },
    { id: 16, goi_da_mua_id: 6,  lich_hen_id: 20, loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 8, ghi_chu: 'Buổi 4 đặt lịch',   tao_luc: '2026-05-06 09:00:00' },
    // goi_da_mua 7: customer 17 - gói 9 (6 buổi), dùng 2 lần (booking 6, 25 bị huỷ)
    { id: 17, goi_da_mua_id: 7,  lich_hen_id: 6,  loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 5, ghi_chu: 'Buổi 1 hoàn thành', tao_luc: '2026-02-18 17:00:00' },
    { id: 18, goi_da_mua_id: 7,  lich_hen_id: 25, loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 4, ghi_chu: 'Buổi 2 đặt lịch',   tao_luc: '2026-04-12 11:00:00' },
    { id: 19, goi_da_mua_id: 7,  lich_hen_id: 25, loai_su_kien: 'hoan_luot', so_luot_thay_doi: 1, so_luot_con_lai_sau: 4, ghi_chu: 'Hoàn lượt do chuyên gia huỷ', tao_luc: '2026-04-15 20:00:00' },
    // goi_da_mua 9: customer 19 - gói 5 (1 buổi), dùng xong (booking 8)
    { id: 20, goi_da_mua_id: 9,  lich_hen_id: 8,  loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 0, ghi_chu: 'Buổi 1 hoàn thành', tao_luc: '2026-03-05 14:45:00' },
    // goi_da_mua 10: customer 20 - gói 10 (6 buổi), dùng 3 lần (booking 7, 15, 23)
    { id: 21, goi_da_mua_id: 10, lich_hen_id: 7,  loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 5, ghi_chu: 'Buổi 1 hoàn thành', tao_luc: '2026-02-23 09:45:00' },
    { id: 22, goi_da_mua_id: 10, lich_hen_id: 15, loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 4, ghi_chu: 'Buổi 2 hoàn thành', tao_luc: '2026-04-20 09:45:00' },
    { id: 23, goi_da_mua_id: 10, lich_hen_id: 23, loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 3, ghi_chu: 'Buổi 3 đặt lịch',   tao_luc: '2026-05-07 10:00:00' },
    // goi_da_mua 11: customer 21 - gói 5 (1 buổi), dùng xong (booking 9)
    { id: 24, goi_da_mua_id: 11, lich_hen_id: 9,  loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 0, ghi_chu: 'Buổi 1 hoàn thành', tao_luc: '2026-03-12 08:45:00' },
    // goi_da_mua 12: customer 22 - gói 4 (12 buổi), dùng 4 lần (booking 12, 18, 26, extra)
    { id: 25, goi_da_mua_id: 12, lich_hen_id: 12, loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 11, ghi_chu: 'Buổi 1 hoàn thành', tao_luc: '2026-03-27 17:00:00' },
    { id: 26, goi_da_mua_id: 12, lich_hen_id: 18, loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 10, ghi_chu: 'Buổi 2 hoàn thành', tao_luc: '2026-04-28 17:00:00' },
    { id: 27, goi_da_mua_id: 12, lich_hen_id: null, loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 9, ghi_chu: 'Buổi 3 hoàn thành', tao_luc: '2026-04-18 17:00:00' },
    { id: 28, goi_da_mua_id: 12, lich_hen_id: 26, loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 8, ghi_chu: 'Buổi 4 đang tư vấn', tao_luc: '2026-05-04 10:00:00' },
    // goi_da_mua 13: customer 23 - gói 2 (3 buổi), dùng 1 lần (booking 17)
    { id: 29, goi_da_mua_id: 13, lich_hen_id: 17, loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 2, ghi_chu: 'Buổi 1 hoàn thành', tao_luc: '2026-04-24 14:45:00' },
    // goi_da_mua 14: customer 24 - gói 3 (6 buổi), dùng 1 lần (booking 21)
    { id: 30, goi_da_mua_id: 14, lich_hen_id: 21, loai_su_kien: 'tru_luot', so_luot_thay_doi: -1, so_luot_con_lai_sau: 5, ghi_chu: 'Buổi 1 đặt lịch',   tao_luc: '2026-05-05 14:00:00' },
  ],
};

export default lich_su_su_dung_goiSeeder;
