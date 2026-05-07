import type { TableSeeder } from '../types';

const ky_hoa_hongSeeder: TableSeeder = {
  table: 'ky_hoa_hong',
  rows: [
    // Kỳ 1/2026 - đã chi trả (có booking 1,2,3 hoàn thành tháng 1)
    {
      id: 1, ma_ky: 'HH_2026_01', thang: 1, nam: 2026,
      tu_ngay: '2026-01-01', den_ngay: '2026-01-31',
      trang_thai: 'da_chi_tra',
      tong_doanh_thu_hop_le: 499000 / 3 + 1490000 / 6 + 1190000 / 6,
      tong_hoa_hong: Math.round((499000 / 3 * 0.35 + 1490000 / 6 * 0.40 + 1190000 / 6 * 0.35)),
      chot_boi: 1, chot_luc: '2026-02-05 08:00:00',
      chi_tra_boi: 1, chi_tra_luc: '2026-02-10 08:00:00',
      tao_luc: '2026-02-05 08:00:00', cap_nhat_luc: '2026-02-10 08:00:00',
    },
    // Kỳ 2/2026 - đã chi trả (booking 4,5,6,7 tháng 2)
    {
      id: 2, ma_ky: 'HH_2026_02', thang: 2, nam: 2026,
      tu_ngay: '2026-02-01', den_ngay: '2026-02-28',
      trang_thai: 'da_chi_tra',
      tong_doanh_thu_hop_le: 3500000 / 12 + 599000 / 3 + 890000 / 6 + 990000 / 6,
      tong_hoa_hong: Math.round((3500000 / 12 * 0.40 + 599000 / 3 * 0.30 + 890000 / 6 * 0.35 + 990000 / 6 * 0.30)),
      chot_boi: 1, chot_luc: '2026-03-05 08:00:00',
      chi_tra_boi: 1, chi_tra_luc: '2026-03-10 08:00:00',
      tao_luc: '2026-03-05 08:00:00', cap_nhat_luc: '2026-03-10 08:00:00',
    },
    // Kỳ 3/2026 - đã chốt chưa chi trả (booking 8,9,10,11,12 tháng 3)
    {
      id: 3, ma_ky: 'HH_2026_03', thang: 3, nam: 2026,
      tu_ngay: '2026-03-01', den_ngay: '2026-03-31',
      trang_thai: 'da_chot',
      tong_doanh_thu_hop_le: 249000 + 249000 + 3500000 / 12 + 1490000 / 6 + 2190000 / 12,
      tong_hoa_hong: Math.round((249000 * 0.35 + 249000 * 0.35 + 3500000 / 12 * 0.40 + 1490000 / 6 * 0.40 + 2190000 / 12 * 0.35)),
      chot_boi: 1, chot_luc: '2026-04-05 08:00:00',
      chi_tra_boi: null, chi_tra_luc: null,
      tao_luc: '2026-04-05 08:00:00', cap_nhat_luc: '2026-04-05 08:00:00',
    },
    // Kỳ 4/2026 - đang tính (booking 13-18 tháng 4, chưa chốt)
    {
      id: 4, ma_ky: 'HH_2026_04', thang: 4, nam: 2026,
      tu_ngay: '2026-04-01', den_ngay: '2026-04-30',
      trang_thai: 'nhap',
      tong_doanh_thu_hop_le: 0,
      tong_hoa_hong: 0,
      chot_boi: null, chot_luc: null,
      chi_tra_boi: null, chi_tra_luc: null,
      tao_luc: '2026-04-01 08:00:00', cap_nhat_luc: '2026-04-01 08:00:00',
    },
    // Kỳ 5/2026 - nhập (tháng hiện tại)
    {
      id: 5, ma_ky: 'HH_2026_05', thang: 5, nam: 2026,
      tu_ngay: '2026-05-01', den_ngay: '2026-05-31',
      trang_thai: 'nhap',
      tong_doanh_thu_hop_le: 0,
      tong_hoa_hong: 0,
      chot_boi: null, chot_luc: null,
      chi_tra_boi: null, chi_tra_luc: null,
      tao_luc: '2026-05-01 08:00:00', cap_nhat_luc: '2026-05-01 08:00:00',
    },
  ],
};

export default ky_hoa_hongSeeder;
