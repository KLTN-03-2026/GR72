import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChatGateway } from '../chat/chat.gateway';

type Dict = Record<string, any>;

function parseJson(value: unknown) {
  if (!value || typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
}

@Injectable()
export class CustomerService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly chatGateway: ChatGateway,
  ) {}

  private async assertBooking(accountId: number | undefined, bookingId: number) {
    if (!accountId) throw new UnauthorizedException('Ban chua dang nhap');
    const [booking] = await this.dataSource.query(
      `SELECT lh.*, expert_account.id AS expert_account_id, expert_account.ho_ten AS expert_name,
              gdv.ten_goi, gdv.loai_goi
       FROM lich_hen lh
       JOIN chuyen_gia cg ON cg.id = lh.chuyen_gia_id
       JOIN tai_khoan expert_account ON expert_account.id = cg.tai_khoan_id
       JOIN goi_dich_vu gdv ON gdv.id = lh.goi_dich_vu_id
       WHERE lh.id = ? AND lh.tai_khoan_id = ?`,
      [bookingId, accountId],
    );
    if (!booking) throw new NotFoundException('Khong tim thay booking cua khach hang');
    return booking;
  }

  async listChats(accountId: number | undefined, query: Dict) {
    if (!accountId) throw new UnauthorizedException('Ban chua dang nhap');
    const where = ['lh.tai_khoan_id = ?'];
    const params: unknown[] = [accountId];
    if (query.search) {
      where.push('(expert_account.ho_ten LIKE ? OR lh.ma_lich_hen LIKE ? OR gdv.ten_goi LIKE ?)');
      params.push(`%${query.search}%`, `%${query.search}%`, `%${query.search}%`);
    }

    return this.dataSource.query(
      `SELECT lh.id AS booking_id, lh.ma_lich_hen, lh.trang_thai, expert_account.ho_ten AS expert_name, gdv.ten_goi,
              MAX(msg.tao_luc) AS last_message_at,
              SUM(CASE WHEN msg.nguoi_gui_id <> ? AND msg.da_doc_luc IS NULL THEN 1 ELSE 0 END) AS unread
       FROM lich_hen lh
       JOIN chuyen_gia cg ON cg.id = lh.chuyen_gia_id
       JOIN tai_khoan expert_account ON expert_account.id = cg.tai_khoan_id
       JOIN goi_dich_vu gdv ON gdv.id = lh.goi_dich_vu_id
       LEFT JOIN tin_nhan msg ON msg.lich_hen_id = lh.id
       WHERE ${where.join(' AND ')}
       GROUP BY lh.id
       ORDER BY COALESCE(last_message_at, lh.tao_luc) DESC`,
      [accountId, ...params],
    );
  }

  async getMessages(accountId: number | undefined, bookingId: number) {
    await this.assertBooking(accountId, bookingId);
    const rows = await this.dataSource.query(
      `SELECT msg.*, tk.ho_ten AS sender_name, tk.vai_tro AS sender_role
       FROM tin_nhan msg JOIN tai_khoan tk ON tk.id = msg.nguoi_gui_id
       WHERE msg.lich_hen_id = ? ORDER BY msg.tao_luc ASC`,
      [bookingId],
    );
    return rows.map((row: Dict) => ({ ...row, tep_dinh_kem: parseJson(row.tep_dinh_kem) }));
  }

  async sendMessage(accountId: number | undefined, bookingId: number, body: Dict) {
    const booking = await this.assertBooking(accountId, bookingId);
    const content = String(body.noi_dung ?? body.content ?? '').trim();
    if (!content) throw new BadRequestException('Vui long nhap tin nhan');

    const now = new Date();
    const result = await this.dataSource.query(
      'INSERT INTO tin_nhan (lich_hen_id, nguoi_gui_id, loai, noi_dung, tep_dinh_kem, da_doc_luc, da_doc_boi_id, tao_luc, cap_nhat_luc) VALUES (?, ?, ?, ?, NULL, NULL, NULL, ?, ?)',
      [bookingId, accountId, 'text', content, now, now],
    );
    await this.dataSource.query(
      'INSERT INTO thong_bao (tai_khoan_id, nguoi_gui_id, loai, tieu_de, noi_dung, trang_thai, duong_dan_hanh_dong, entity_type, entity_id, tao_luc, doc_luc, cap_nhat_luc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)',
      [booking.expert_account_id, accountId, 'message', 'Khách hàng gửi tin nhắn mới', content.slice(0, 180), 'chua_doc', `/nutritionist/chats/${bookingId}`, 'lich_hen', bookingId, now, now],
    );

    const [message] = await this.dataSource.query(
      `SELECT msg.*, tk.ho_ten AS sender_name, tk.vai_tro AS sender_role
       FROM tin_nhan msg JOIN tai_khoan tk ON tk.id = msg.nguoi_gui_id
       WHERE msg.id = ?`,
      [result.insertId],
    );
    if (message) this.chatGateway.emitMessageCreated(bookingId, { ...message, tep_dinh_kem: parseJson(message.tep_dinh_kem) });
    return this.getMessages(accountId, bookingId);
  }

  async markChatRead(accountId: number | undefined, bookingId: number) {
    await this.assertBooking(accountId, bookingId);
    await this.dataSource.query(
      'UPDATE tin_nhan SET da_doc_luc = COALESCE(da_doc_luc, ?), da_doc_boi_id = ? WHERE lich_hen_id = ? AND nguoi_gui_id <> ?',
      [new Date(), accountId, bookingId, accountId],
    );
    this.chatGateway.emitChatRead(bookingId, Number(accountId));
    return { ok: true };
  }
}
