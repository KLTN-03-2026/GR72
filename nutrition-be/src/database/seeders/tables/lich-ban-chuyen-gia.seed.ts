import type { TableSeeder } from '../types';

const lich_ban_chuyen_giaSeeder: TableSeeder = {
  table: 'lich_ban_chuyen_gia',
  rows: [
    { id: 1, chuyen_gia_id: 1, bat_dau_luc: '2026-04-28 12:00:00', ket_thuc_luc: '2026-04-28 14:00:00', ly_do: 'Nghỉ trưa, lịch cá nhân', tao_luc: '2026-04-25 10:00:00', cap_nhat_luc: '2026-04-25 10:00:00' },
    { id: 2, chuyen_gia_id: 1, bat_dau_luc: '2026-05-01 08:00:00', ket_thuc_luc: '2026-05-01 18:00:00', ly_do: 'Nghỉ lễ 30/4 - 1/5',        tao_luc: '2026-04-25 10:00:00', cap_nhat_luc: '2026-04-25 10:00:00' },
    { id: 3, chuyen_gia_id: 2, bat_dau_luc: '2026-05-01 08:00:00', ket_thuc_luc: '2026-05-01 18:00:00', ly_do: 'Nghỉ lễ 30/4 - 1/5',        tao_luc: '2026-04-25 10:00:00', cap_nhat_luc: '2026-04-25 10:00:00' },
    { id: 4, chuyen_gia_id: 3, bat_dau_luc: '2026-05-01 08:00:00', ket_thuc_luc: '2026-05-01 20:00:00', ly_do: 'Nghỉ lễ 30/4 - 1/5',        tao_luc: '2026-04-25 10:00:00', cap_nhat_luc: '2026-04-25 10:00:00' },
    { id: 5, chuyen_gia_id: 4, bat_dau_luc: '2026-04-30 14:00:00', ket_thuc_luc: '2026-04-30 18:00:00', ly_do: 'Hội thảo dinh dưỡng',       tao_luc: '2026-04-20 09:00:00', cap_nhat_luc: '2026-04-20 09:00:00' },
    { id: 6, chuyen_gia_id: 5, bat_dau_luc: '2026-05-01 08:00:00', ket_thuc_luc: '2026-05-02 18:00:00', ly_do: 'Nghỉ lễ và công tác',       tao_luc: '2026-04-25 10:00:00', cap_nhat_luc: '2026-04-25 10:00:00' },
    { id: 7, chuyen_gia_id: 8, bat_dau_luc: '2026-05-01 08:00:00', ket_thuc_luc: '2026-05-01 18:00:00', ly_do: 'Nghỉ lễ 30/4 - 1/5',        tao_luc: '2026-04-25 10:00:00', cap_nhat_luc: '2026-04-25 10:00:00' },
  ],
};

export default lich_ban_chuyen_giaSeeder;
