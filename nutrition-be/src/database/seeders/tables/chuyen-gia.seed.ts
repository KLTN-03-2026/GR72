import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const chuyen_giaSeeder: TableSeeder = {
  table: 'chuyen_gia',
  rows: createRows(10, (i) => ({
    id: i,
    tai_khoan_id: i + 2,
    chuyen_mon: ['Tu van suc khoe', 'Dinh duong lam sang', 'Huan luyen ca nhan'][i % 3],
    mo_ta: `Chuyen gia ${i} co kinh nghiem tu van ca nhan hoa.`,
    kinh_nghiem: `${3 + i} nam kinh nghiem tu van.`,
    hoc_vi: i % 2 === 0 ? 'Cu nhan Dinh duong' : 'Thac si Suc khoe cong dong',
    chung_chi: 'Chung chi tu van suc khoe va dinh duong',
    anh_dai_dien_url: `/uploads/experts/expert-${i}.jpg`,
    trang_thai: 'hoat_dong',
    nhan_booking: true,
    diem_danh_gia_trung_binh: 4.3 + i / 20,
    so_luot_danh_gia: 10 + i,
    so_booking_hoan_thanh: 20 + i,
    ly_do_tu_choi: null,
    ly_do_bi_khoa: null,
    duyet_boi: 1,
    duyet_luc: '2026-01-06 08:00:00',
    tao_luc: '2026-01-06 08:00:00',
    cap_nhat_luc: '2026-01-06 08:00:00',
    xoa_luc: null,
  })),
};

export default chuyen_giaSeeder;

