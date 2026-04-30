import { createRows } from '../helpers';
import type { TableSeeder } from '../types';

const tin_nhan_chat_aiSeeder: TableSeeder = {
  table: 'tin_nhan_chat_ai',
  rows: createRows(10, (i) => ({
    id: i,
    phien_chat_ai_id: i,
    vai_tro: i % 2 === 0 ? 'assistant' : 'user',
    noi_dung: i % 2 === 0 ? 'Ban nen duy tri bua sang giau dam va theo doi can nang hang tuan.' : 'Toi muon giam can nhung hay met vao buoi chieu.',
    model: i % 2 === 0 ? 'gpt-health-assistant' : null,
    token_input: i % 2 === 0 ? 200 : null,
    token_output: i % 2 === 0 ? 120 : null,
    trang_thai: 'thanh_cong',
    loi: null,
    metadata: { source: 'seed' },
    tao_luc: '2026-03-22 08:10:00',
  })),
};

export default tin_nhan_chat_aiSeeder;

