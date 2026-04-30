import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const audit_logSeeder: TableSeeder = {
  table: 'audit_log',
  rows: createRows(10, (i) => ({
    id: i,
    actor_id: 1,
    actor_role: 'admin',
    action: 'seed_create',
    resource_type: ['goi_dich_vu', 'thanh_toan', 'lich_hen', 'danh_gia'][i % 4],
    resource_id: i,
    old_value: null,
    new_value: { id: i, source: 'seed' },
    ip_address: '127.0.0.1',
    user_agent: 'seed-runner',
    request_id: `seed-${i}`,
    tao_luc: '2026-03-29 08:00:00',
  })),
};

export default audit_logSeeder;

