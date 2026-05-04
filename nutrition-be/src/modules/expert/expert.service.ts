import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';
import { DataSource } from 'typeorm';
import { ChatGateway } from '../chat/chat.gateway';

type Dict = Record<string, any>;
const CHAT_SEND_ALLOWED_STATUSES = new Set([
  'cho_xac_nhan',
  'cho_thanh_toan',
  'da_xac_nhan',
  'da_checkin',
  'dang_tu_van',
  'hoan_thanh',
]);
const CALL_JOIN_ALLOWED_STATUSES = new Set(['da_xac_nhan', 'da_checkin', 'dang_tu_van']);
const CALL_OPEN_BEFORE_START_MINUTES = 15;
const CALL_OPEN_AFTER_END_MINUTES = 30;

type ExpertContext = { accountId: number; expertId: number };

function parseJson(value: unknown) {
  if (!value || typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
}

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function asDate(value: unknown) {
  return value ? new Date(value as string | number | Date) : null;
}

@Injectable()
export class ExpertService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly chatGateway: ChatGateway,
  ) {}

  private async context(accountId?: number): Promise<ExpertContext> {
    if (!accountId) throw new UnauthorizedException('Ban chua dang nhap');
    const [expert] = await this.dataSource.query('SELECT id FROM chuyen_gia WHERE tai_khoan_id = ? AND xoa_luc IS NULL', [accountId]);
    if (!expert) throw new UnauthorizedException('Tai khoan chua co ho so chuyen gia');
    return { accountId, expertId: Number(expert.id) };
  }

  private async assertBooking(accountId: number | undefined, bookingId: number) {
    const ctx = await this.context(accountId);
    const [booking] = await this.dataSource.query(
      `SELECT lh.*, customer.ho_ten AS customer_name, customer.email AS customer_email, gdv.ten_goi, gdv.loai_goi
       FROM lich_hen lh
       JOIN tai_khoan customer ON customer.id = lh.tai_khoan_id
       JOIN goi_dich_vu gdv ON gdv.id = lh.goi_dich_vu_id
       WHERE lh.id = ? AND lh.chuyen_gia_id = ?`,
      [bookingId, ctx.expertId],
    );
    if (!booking) throw new NotFoundException('Khong tim thay booking cua chuyen gia');
    return { ctx, booking };
  }

  private evaluateCallJoin(booking: Dict) {
    if (!CALL_JOIN_ALLOWED_STATUSES.has(String(booking.trang_thai))) {
      return { canJoin: false, reason: 'Booking chua o trang thai cho phep vao phong goi.' };
    }

    const startAt = asDate(booking.bat_dau_luc);
    const endAt = asDate(booking.ket_thuc_luc);
    if (!startAt || !endAt) {
      return { canJoin: false, reason: 'Booking chua co moc thoi gian call hop le.' };
    }

    const openFrom = new Date(startAt.getTime() - CALL_OPEN_BEFORE_START_MINUTES * 60 * 1000);
    const openUntil = new Date(endAt.getTime() + CALL_OPEN_AFTER_END_MINUTES * 60 * 1000);
    const now = new Date();

    if (now < openFrom) {
      return { canJoin: false, reason: 'Chua den khung gio cho phep vao phong goi.', openFrom, openUntil, now };
    }
    if (now > openUntil) {
      return { canJoin: false, reason: 'Da qua khung gio cho phep vao phong goi.', openFrom, openUntil, now };
    }
    return { canJoin: true, reason: null, openFrom, openUntil, now };
  }

  private async ensureCallSession(bookingId: number) {
    const [found] = await this.dataSource.query('SELECT * FROM cuoc_goi_tu_van WHERE lich_hen_id = ? LIMIT 1', [bookingId]);
    if (found) return found;

    const now = new Date();
    const roomName = `booking-${bookingId}`;
    await this.dataSource.query(
      `INSERT INTO cuoc_goi_tu_van (lich_hen_id, provider, room_name, trang_thai, bat_dau_luc, ket_thuc_luc, thoi_luong_giay, tao_luc, cap_nhat_luc)
       VALUES (?, 'livekit', ?, 'cho', NULL, NULL, NULL, ?, ?)`,
      [bookingId, roomName, now, now],
    );
    const [created] = await this.dataSource.query('SELECT * FROM cuoc_goi_tu_van WHERE lich_hen_id = ? LIMIT 1', [bookingId]);
    return created;
  }

  async getCallSession(accountId: number | undefined, bookingId: number) {
    const { booking } = await this.assertBooking(accountId, bookingId);
    const gate = this.evaluateCallJoin(booking);
    const call = await this.ensureCallSession(bookingId);
    return {
      booking_id: bookingId,
      room_name: call.room_name,
      provider: call.provider,
      call_status: call.trang_thai,
      can_join: gate.canJoin,
      reason: gate.reason,
      open_from: gate.openFrom?.toISOString() ?? null,
      open_until: gate.openUntil?.toISOString() ?? null,
      now: gate.now?.toISOString() ?? new Date().toISOString(),
    };
  }

  async createCallToken(accountId: number | undefined, bookingId: number) {
    const { ctx, booking } = await this.assertBooking(accountId, bookingId);
    const gate = this.evaluateCallJoin(booking);
    if (!gate.canJoin) throw new BadRequestException(gate.reason ?? 'Booking hien khong cho phep vao phong goi');

    const session = await this.ensureCallSession(bookingId);
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;
    if (!apiKey || !apiSecret || !wsUrl) {
      throw new BadRequestException('He thong chua cau hinh LIVEKIT_API_KEY, LIVEKIT_API_SECRET hoac LIVEKIT_URL');
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: `expert:${ctx.accountId}`,
      name: `expert-${ctx.accountId}`,
      ttl: '15m',
    });
    token.addGrant({
      roomJoin: true,
      room: String(session.room_name),
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    const jwt = await token.toJwt();

    const now = new Date();
    await this.dataSource.query(
      `UPDATE cuoc_goi_tu_van
       SET trang_thai = CASE WHEN trang_thai = 'cho' THEN 'dang_dien_ra' ELSE trang_thai END,
           bat_dau_luc = COALESCE(bat_dau_luc, ?),
           cap_nhat_luc = ?
       WHERE lich_hen_id = ?`,
      [now, now, bookingId],
    );
    await this.dataSource.query(
      `INSERT INTO booking_timeline (lich_hen_id, actor_id, su_kien, trang_thai_truoc, trang_thai_sau, ghi_chu, metadata, tao_luc)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingId,
        ctx.accountId,
        'call_token_created',
        booking.trang_thai ?? null,
        booking.trang_thai ?? null,
        'Expert tao token vao phong goi video',
        JSON.stringify({ room_name: session.room_name, provider: session.provider }),
        now,
      ],
    );

    const meetBase = process.env.LIVEKIT_MEET_URL ?? 'https://meet.livekit.io';
    return {
      provider: session.provider,
      room_name: session.room_name,
      livekit_url: wsUrl,
      token: jwt,
      join_url: `${meetBase}/custom?liveKitUrl=${encodeURIComponent(wsUrl)}&token=${encodeURIComponent(jwt)}`,
      expires_in_seconds: 15 * 60,
    };
  }

  async getDashboard(accountId?: number) {
    const ctx = await this.context(accountId);
    const [profile] = await this.dataSource.query('SELECT * FROM chuyen_gia WHERE id = ?', [ctx.expertId]);
    const [booking] = await this.dataSource.query(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN trang_thai IN ('cho_xac_nhan','da_xac_nhan','da_checkin','dang_tu_van') THEN 1 ELSE 0 END) AS active,
              SUM(CASE WHEN trang_thai = 'hoan_thanh' THEN 1 ELSE 0 END) AS completed
       FROM lich_hen WHERE chuyen_gia_id = ?`,
      [ctx.expertId],
    );
    const [review] = await this.dataSource.query("SELECT AVG(diem) AS avgRating, COUNT(*) AS totalReviews FROM danh_gia WHERE chuyen_gia_id = ? AND trang_thai <> 'da_xoa'", [ctx.expertId]);
    const [commission] = await this.dataSource.query("SELECT COALESCE(SUM(tong_hoa_hong), 0) AS pending FROM chi_tra_hoa_hong WHERE chuyen_gia_id = ? AND trang_thai = 'cho_chi_tra'", [ctx.expertId]);
    const nextBookings = await this.listBookings(accountId, { status: 'da_xac_nhan' });
    const notifications = await this.getNotificationSummary(accountId);
    return { profile, booking, review, commission, nextBookings: nextBookings.slice(0, 5), notifications };
  }

  async getProfile(accountId?: number) {
    const ctx = await this.context(accountId);
    const [row] = await this.dataSource.query(
      `SELECT cg.*, tk.ho_ten, tk.email, tk.so_dien_thoai, tk.trang_thai AS account_status
       FROM chuyen_gia cg JOIN tai_khoan tk ON tk.id = cg.tai_khoan_id WHERE cg.id = ?`,
      [ctx.expertId],
    );
    return row;
  }

  async updateProfile(accountId: number | undefined, body: Dict) {
    const ctx = await this.context(accountId);
    if (!String(body.chuyen_mon ?? '').trim()) throw new BadRequestException('Vui long nhap chuyen mon');
    await this.dataSource.query(
      `UPDATE chuyen_gia SET chuyen_mon=?, mo_ta=?, kinh_nghiem=?, hoc_vi=?, chung_chi=?, nhan_booking=?, cap_nhat_luc=? WHERE id=?`,
      [body.chuyen_mon, body.mo_ta ?? null, body.kinh_nghiem ?? null, body.hoc_vi ?? null, body.chung_chi ?? null, body.nhan_booking ? 1 : 0, new Date(), ctx.expertId],
    );
    if (body.ho_ten || body.so_dien_thoai !== undefined) {
      await this.dataSource.query('UPDATE tai_khoan SET ho_ten = COALESCE(?, ho_ten), so_dien_thoai = ?, cap_nhat_luc = ? WHERE id = ?', [body.ho_ten ?? null, body.so_dien_thoai ?? null, new Date(), ctx.accountId]);
    }
    return this.getProfile(accountId);
  }

  async getAvailability(accountId?: number) {
    const ctx = await this.context(accountId);
    const weekly = await this.dataSource.query('SELECT * FROM lich_lam_viec_chuyen_gia WHERE chuyen_gia_id = ? ORDER BY thu_trong_tuan ASC, gio_bat_dau ASC', [ctx.expertId]);
    const blocked = await this.dataSource.query('SELECT * FROM lich_ban_chuyen_gia WHERE chuyen_gia_id = ? ORDER BY bat_dau_luc DESC', [ctx.expertId]);
    return { weekly, blocked };
  }

  async saveWeeklyAvailability(accountId: number | undefined, body: Dict) {
    const ctx = await this.context(accountId);
    const slots = Array.isArray(body.slots) ? body.slots : [];
    for (const slot of slots) {
      const day = Number(slot.thu_trong_tuan);
      if (day < 1 || day > 7 || !slot.gio_bat_dau || !slot.gio_ket_thuc) throw new BadRequestException('Slot lich lam viec khong hop le');
    }
    await this.dataSource.transaction(async (manager) => {
      await manager.query('DELETE FROM lich_lam_viec_chuyen_gia WHERE chuyen_gia_id = ?', [ctx.expertId]);
      for (const slot of slots) {
        await manager.query(
          `INSERT INTO lich_lam_viec_chuyen_gia (chuyen_gia_id, thu_trong_tuan, gio_bat_dau, gio_ket_thuc, thoi_luong_slot_phut, trang_thai, tao_luc, cap_nhat_luc)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [ctx.expertId, Number(slot.thu_trong_tuan), slot.gio_bat_dau, slot.gio_ket_thuc, Number(slot.thoi_luong_slot_phut ?? 30), slot.trang_thai ?? 'hoat_dong', new Date(), new Date()],
        );
      }
    });
    return this.getAvailability(accountId);
  }

  async createBlockedTime(accountId: number | undefined, body: Dict) {
    const ctx = await this.context(accountId);
    if (!body.bat_dau_luc || !body.ket_thuc_luc) throw new BadRequestException('Vui long nhap thoi gian ban');
    const result = await this.dataSource.query(
      'INSERT INTO lich_ban_chuyen_gia (chuyen_gia_id, bat_dau_luc, ket_thuc_luc, ly_do, tao_luc, cap_nhat_luc) VALUES (?, ?, ?, ?, ?, ?)',
      [ctx.expertId, body.bat_dau_luc, body.ket_thuc_luc, body.ly_do ?? null, new Date(), new Date()],
    );
    return { id: result.insertId, ...(await this.getAvailability(accountId)) };
  }

  async deleteBlockedTime(accountId: number | undefined, blockedId: number) {
    const ctx = await this.context(accountId);
    await this.dataSource.query('DELETE FROM lich_ban_chuyen_gia WHERE id = ? AND chuyen_gia_id = ?', [blockedId, ctx.expertId]);
    return this.getAvailability(accountId);
  }

  async previewAvailability(accountId: number | undefined, query: Dict) {
    const ctx = await this.context(accountId);
    const from = query.from ?? dateOnly(new Date());
    const to = query.to ?? from;
    const bookings = await this.dataSource.query('SELECT ngay_hen, gio_bat_dau, gio_ket_thuc, trang_thai FROM lich_hen WHERE chuyen_gia_id = ? AND ngay_hen BETWEEN ? AND ? ORDER BY ngay_hen, gio_bat_dau', [ctx.expertId, from, to]);
    return { from, to, bookedSlots: bookings };
  }

  async listBookings(accountId: number | undefined, query: Dict) {
    const ctx = await this.context(accountId);
    const where = ['lh.chuyen_gia_id = ?'];
    const params: unknown[] = [ctx.expertId];
    if (query.status) { where.push('lh.trang_thai = ?'); params.push(query.status); }
    if (query.from) { where.push('lh.ngay_hen >= ?'); params.push(query.from); }
    if (query.to) { where.push('lh.ngay_hen <= ?'); params.push(query.to); }
    if (query.search) { where.push('(customer.ho_ten LIKE ? OR lh.ma_lich_hen LIKE ? OR gdv.ten_goi LIKE ?)'); params.push(`%${query.search}%`, `%${query.search}%`, `%${query.search}%`); }
    return this.dataSource.query(
      `SELECT lh.*, customer.ho_ten AS customer_name, customer.email AS customer_email, gdv.ten_goi, gdv.loai_goi
       FROM lich_hen lh JOIN tai_khoan customer ON customer.id = lh.tai_khoan_id JOIN goi_dich_vu gdv ON gdv.id = lh.goi_dich_vu_id
       WHERE ${where.join(' AND ')} ORDER BY lh.ngay_hen DESC, lh.gio_bat_dau DESC`,
      params,
    );
  }

  async getBooking(accountId: number | undefined, bookingId: number) {
    const { booking } = await this.assertBooking(accountId, bookingId);
    const timeline = await this.dataSource.query('SELECT * FROM booking_timeline WHERE lich_hen_id = ? ORDER BY tao_luc ASC', [bookingId]);
    const notes = await this.getNotes(accountId, bookingId);
    return { booking, timeline, notes };
  }

  async updateBookingStatus(accountId: number | undefined, bookingId: number, status: string) {
    const { ctx, booking } = await this.assertBooking(accountId, bookingId);
    const now = new Date();
    await this.dataSource.query('UPDATE lich_hen SET trang_thai = ?, cap_nhat_luc = ? WHERE id = ?', [status, now, bookingId]);
    await this.dataSource.query('INSERT INTO booking_timeline (lich_hen_id, actor_id, su_kien, trang_thai_truoc, trang_thai_sau, ghi_chu, metadata, tao_luc) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?)', [bookingId, ctx.accountId, status, booking.trang_thai, status, now]);
    // Thông báo customer khi expert xác nhận booking
    if (status === 'da_xac_nhan') {
      await this.dataSource.query(
        `INSERT INTO thong_bao (tai_khoan_id,nguoi_gui_id,loai,tieu_de,noi_dung,trang_thai,duong_dan_hanh_dong,entity_type,entity_id,tao_luc,doc_luc,cap_nhat_luc)
         VALUES (?,?,'booking','Booking da duoc xac nhan',?,'chua_doc',?,'lich_hen',?,?,NULL,?)`,
        [booking.tai_khoan_id, ctx.accountId,
         `Chuyen gia da xac nhan lich hen ${booking.ma_lich_hen}. Vui long check-in dung gio.`,
         `/user/bookings/${bookingId}`, bookingId, now, now],
      );
    }
    return this.getBooking(accountId, bookingId);
  }

  async rejectBooking(accountId: number | undefined, bookingId: number, body: Dict) {
    if (!String(body.ly_do ?? '').trim()) throw new BadRequestException('Vui long nhap ly do tu choi');
    const { ctx, booking } = await this.assertBooking(accountId, bookingId);
    const now = new Date();
    await this.dataSource.query('UPDATE lich_hen SET trang_thai = ?, ly_do_huy = ?, huy_boi = ?, huy_luc = ?, cap_nhat_luc = ? WHERE id = ?', ['da_huy', body.ly_do, ctx.accountId, now, now, bookingId]);
    await this.dataSource.query('INSERT INTO booking_timeline (lich_hen_id, actor_id, su_kien, trang_thai_truoc, trang_thai_sau, ghi_chu, metadata, tao_luc) VALUES (?, ?, ?, ?, ?, ?, NULL, ?)', [bookingId, ctx.accountId, 'reject', booking.trang_thai, 'da_huy', body.ly_do, now]);
    // Thông báo customer khi expert từ chối booking
    await this.dataSource.query(
      `INSERT INTO thong_bao (tai_khoan_id,nguoi_gui_id,loai,tieu_de,noi_dung,trang_thai,duong_dan_hanh_dong,entity_type,entity_id,tao_luc,doc_luc,cap_nhat_luc)
       VALUES (?,?,'booking','Booking bi tu choi',?,'chua_doc',?,'lich_hen',?,?,NULL,?)`,
      [booking.tai_khoan_id, ctx.accountId,
       `Lich hen ${booking.ma_lich_hen} bi tu choi. Ly do: ${body.ly_do}. Luot cua ban se duoc hoan tra.`,
       `/user/bookings/${bookingId}`, bookingId, now, now],
    );
    return this.getBooking(accountId, bookingId);
  }

  async completeBooking(accountId: number | undefined, bookingId: number) {
    const { ctx, booking } = await this.assertBooking(accountId, bookingId);
    const now = new Date();
    await this.dataSource.query('UPDATE lich_hen SET trang_thai = ?, hoan_thanh_luc = ?, cap_nhat_luc = ? WHERE id = ?', ['hoan_thanh', now, now, bookingId]);
    await this.dataSource.query('UPDATE chuyen_gia SET so_booking_hoan_thanh = so_booking_hoan_thanh + 1, cap_nhat_luc = ? WHERE id = ?', [now, ctx.expertId]);
    await this.dataSource.query('INSERT INTO booking_timeline (lich_hen_id, actor_id, su_kien, trang_thai_truoc, trang_thai_sau, ghi_chu, metadata, tao_luc) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?)', [bookingId, ctx.accountId, 'complete', booking.trang_thai, 'hoan_thanh', now]);
    // Thông báo customer: buổi tư vấn hoàn thành, mời đánh giá
    await this.dataSource.query(
      `INSERT INTO thong_bao (tai_khoan_id,nguoi_gui_id,loai,tieu_de,noi_dung,trang_thai,duong_dan_hanh_dong,entity_type,entity_id,tao_luc,doc_luc,cap_nhat_luc)
       VALUES (?,?,'booking','Buoi tu van hoan thanh',?,'chua_doc',?,'lich_hen',?,?,NULL,?)`,
      [booking.tai_khoan_id, ctx.accountId,
       `Lich hen ${booking.ma_lich_hen} da hoan thanh. Hay danh gia buoi tu van de giup chuyen gia cai thien dich vu!`,
       `/user/bookings/${bookingId}`, bookingId, now, now],
    );
    return this.getBooking(accountId, bookingId);
  }

  async getNotes(accountId: number | undefined, bookingId: number) {
    const { ctx } = await this.assertBooking(accountId, bookingId);
    const [note] = await this.dataSource.query('SELECT * FROM ghi_chu_tu_van WHERE lich_hen_id = ? AND chuyen_gia_id = ?', [bookingId, ctx.expertId]);
    return note ? { ...note, tags: parseJson(note.tags) } : null;
  }

  async saveNotes(accountId: number | undefined, bookingId: number, body: Dict) {
    const { ctx } = await this.assertBooking(accountId, bookingId);
    await this.dataSource.query(
      `INSERT INTO ghi_chu_tu_van (lich_hen_id, chuyen_gia_id, tom_tat_cho_customer, ghi_chu_noi_bo, khuyen_nghi_sau_tu_van, tags, tao_luc, cap_nhat_luc)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE tom_tat_cho_customer=VALUES(tom_tat_cho_customer), ghi_chu_noi_bo=VALUES(ghi_chu_noi_bo), khuyen_nghi_sau_tu_van=VALUES(khuyen_nghi_sau_tu_van), tags=VALUES(tags), cap_nhat_luc=VALUES(cap_nhat_luc)`,
      [bookingId, ctx.expertId, body.tom_tat_cho_customer ?? null, body.ghi_chu_noi_bo ?? null, body.khuyen_nghi_sau_tu_van ?? null, JSON.stringify(body.tags ?? []), new Date(), new Date()],
    );
    return this.getNotes(accountId, bookingId);
  }

  async getReviewSummary(accountId?: number) {
    const ctx = await this.context(accountId);
    const [summary] = await this.dataSource.query("SELECT AVG(diem) AS avgRating, COUNT(*) AS total, SUM(CASE WHEN trang_thai='bi_bao_cao' THEN 1 ELSE 0 END) AS flagged FROM danh_gia WHERE chuyen_gia_id = ?", [ctx.expertId]);
    return { avgRating: Number(summary.avgRating ?? 0), total: Number(summary.total ?? 0), flagged: Number(summary.flagged ?? 0) };
  }

  async listReviews(accountId: number | undefined, query: Dict) {
    const ctx = await this.context(accountId);
    const where = ['dg.chuyen_gia_id = ?'];
    const params: unknown[] = [ctx.expertId];
    if (query.rating) { where.push('dg.diem = ?'); params.push(Number(query.rating)); }
    if (query.status) { where.push('dg.trang_thai = ?'); params.push(query.status); }
    return this.dataSource.query(
      `SELECT dg.*, customer.ho_ten AS customer_name, ph.noi_dung AS expert_reply
       FROM danh_gia dg JOIN tai_khoan customer ON customer.id = dg.tai_khoan_id LEFT JOIN phan_hoi_danh_gia ph ON ph.danh_gia_id = dg.id
       WHERE ${where.join(' AND ')} ORDER BY dg.tao_luc DESC`,
      params,
    );
  }

  async replyReview(accountId: number | undefined, reviewId: number, body: Dict) {
    const ctx = await this.context(accountId);
    const content = String(body.noi_dung ?? body.content ?? '').trim();
    if (!content) throw new BadRequestException('Vui long nhap phan hoi');
    const [review] = await this.dataSource.query(
      `SELECT dg.id, dg.tai_khoan_id, dg.lich_hen_id FROM danh_gia dg WHERE dg.id = ? AND dg.chuyen_gia_id = ?`,
      [reviewId, ctx.expertId],
    );
    if (!review) throw new NotFoundException('Khong tim thay danh gia cua chuyen gia');
    const now = new Date();
    await this.dataSource.query(
      `INSERT INTO phan_hoi_danh_gia (danh_gia_id, chuyen_gia_id, noi_dung, tao_luc, cap_nhat_luc)
       VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE noi_dung=VALUES(noi_dung), cap_nhat_luc=VALUES(cap_nhat_luc)`,
      [reviewId, ctx.expertId, content, now, now],
    );
    // Thông báo customer: chuyên gia đã phản hồi đánh giá
    await this.dataSource.query(
      `INSERT INTO thong_bao (tai_khoan_id,nguoi_gui_id,loai,tieu_de,noi_dung,trang_thai,duong_dan_hanh_dong,entity_type,entity_id,tao_luc,doc_luc,cap_nhat_luc)
       VALUES (?,?,'review','Chuyen gia da phan hoi danh gia',?,'chua_doc',?,'danh_gia',?,?,NULL,?)`,
      [review.tai_khoan_id, ctx.accountId,
       `Chuyen gia da phan hoi danh gia cua ban: "${content.slice(0, 100)}${content.length > 100 ? '...' : ''}"`,
       `/user/bookings/${review.lich_hen_id}`, reviewId, now, now],
    );
    return { ok: true };
  }

  async getEarnings(accountId: number | undefined, query: Dict) {
    const ctx = await this.context(accountId);
    const month = String(query.month ?? new Date().toISOString().slice(0, 7));
    const [year, monthNo] = month.split('-').map(Number);
    const [period] = await this.dataSource.query('SELECT * FROM ky_hoa_hong WHERE thang = ? AND nam = ?', [monthNo, year]);
    if (!period) return { period: null, payout: null, lines: [], summary: { revenue: 0, commission: 0, bookings: 0 } };
    const [payout] = await this.dataSource.query('SELECT * FROM chi_tra_hoa_hong WHERE ky_hoa_hong_id = ? AND chuyen_gia_id = ?', [period.id, ctx.expertId]);
    const lines = await this.getEarningBookings(accountId, period.id);
    return { period, payout: payout ?? null, lines, summary: { revenue: Number(payout?.tong_doanh_thu_hop_le ?? 0), commission: Number(payout?.tong_hoa_hong ?? 0), bookings: Number(payout?.so_booking ?? 0) } };
  }

  async getEarningBookings(accountId: number | undefined, periodId: number) {
    const ctx = await this.context(accountId);
    return this.dataSource.query(
      `SELECT ct.*, gdv.ten_goi, lh.ma_lich_hen, lh.ngay_hen
       FROM chi_tiet_hoa_hong ct JOIN goi_dich_vu gdv ON gdv.id = ct.goi_dich_vu_id JOIN lich_hen lh ON lh.id = ct.lich_hen_id
       WHERE ct.ky_hoa_hong_id = ? AND ct.chuyen_gia_id = ? ORDER BY lh.ngay_hen DESC`,
      [periodId, ctx.expertId],
    );
  }

  async exportEarnings(accountId: number | undefined, periodId: number) {
    await this.context(accountId);
    return { file_url: `/uploads/exports/expert-earnings-${periodId}-${Date.now()}.csv` };
  }

  async getNotificationSummary(accountId?: number) {
    if (!accountId) return { total: 0, unread: 0, latest: [] };
    const [summary] = await this.dataSource.query("SELECT COUNT(*) AS total, SUM(CASE WHEN trang_thai='chua_doc' THEN 1 ELSE 0 END) AS unread FROM thong_bao WHERE tai_khoan_id = ?", [accountId]);
    const latest = await this.dataSource.query('SELECT * FROM thong_bao WHERE tai_khoan_id = ? ORDER BY tao_luc DESC LIMIT 5', [accountId]);
    return { total: Number(summary.total ?? 0), unread: Number(summary.unread ?? 0), latest };
  }

  async listNotifications(accountId: number | undefined, query: Dict) {
    if (!accountId) throw new UnauthorizedException('Ban chua dang nhap');
    const where = ['tai_khoan_id = ?'];
    const params: unknown[] = [accountId];
    if (query.status) { where.push('trang_thai = ?'); params.push(query.status); }
    if (query.type) { where.push('loai = ?'); params.push(query.type); }
    return this.dataSource.query(`SELECT * FROM thong_bao WHERE ${where.join(' AND ')} ORDER BY tao_luc DESC`, params);
  }

  async markNotificationRead(accountId: number | undefined, notificationId: number) {
    if (!accountId) throw new UnauthorizedException('Ban chua dang nhap');
    await this.dataSource.query("UPDATE thong_bao SET trang_thai='da_doc', doc_luc=COALESCE(doc_luc, ?), cap_nhat_luc=? WHERE id=? AND tai_khoan_id=?", [new Date(), new Date(), notificationId, accountId]);
    return { ok: true };
  }

  async markAllNotificationsRead(accountId?: number) {
    if (!accountId) throw new UnauthorizedException('Ban chua dang nhap');
    await this.dataSource.query("UPDATE thong_bao SET trang_thai='da_doc', doc_luc=COALESCE(doc_luc, ?), cap_nhat_luc=? WHERE tai_khoan_id=? AND trang_thai='chua_doc'", [new Date(), new Date(), accountId]);
    return { ok: true };
  }

  async listChats(accountId: number | undefined, query: Dict) {
    const ctx = await this.context(accountId);
    const where = ['lh.chuyen_gia_id = ?'];
    const params: unknown[] = [ctx.expertId];
    if (query.search) { where.push('(customer.ho_ten LIKE ? OR lh.ma_lich_hen LIKE ? OR gdv.ten_goi LIKE ?)'); params.push(`%${query.search}%`, `%${query.search}%`, `%${query.search}%`); }
    return this.dataSource.query(
      `SELECT lh.id AS booking_id, lh.ma_lich_hen, lh.trang_thai, customer.ho_ten AS customer_name, gdv.ten_goi,
              MAX(msg.tao_luc) AS last_message_at,
              SUM(CASE WHEN msg.nguoi_gui_id <> ? AND msg.da_doc_luc IS NULL THEN 1 ELSE 0 END) AS unread
       FROM lich_hen lh JOIN tai_khoan customer ON customer.id = lh.tai_khoan_id JOIN goi_dich_vu gdv ON gdv.id = lh.goi_dich_vu_id
       LEFT JOIN tin_nhan msg ON msg.lich_hen_id = lh.id
       WHERE ${where.join(' AND ')} GROUP BY lh.id ORDER BY COALESCE(last_message_at, lh.tao_luc) DESC`,
      [ctx.accountId, ...params],
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
    const { ctx, booking } = await this.assertBooking(accountId, bookingId);
    if (!CHAT_SEND_ALLOWED_STATUSES.has(String(booking.trang_thai))) {
      throw new BadRequestException('Booking hien khong cho phep gui tin nhan');
    }
    const content = String(body.noi_dung ?? body.content ?? '').trim();
    if (!content) throw new BadRequestException('Vui long nhap tin nhan');
    const now = new Date();
    const result = await this.dataSource.query('INSERT INTO tin_nhan (lich_hen_id, nguoi_gui_id, loai, noi_dung, tep_dinh_kem, da_doc_luc, da_doc_boi_id, tao_luc, cap_nhat_luc) VALUES (?, ?, ?, ?, NULL, NULL, NULL, ?, ?)', [bookingId, ctx.accountId, 'text', content, now, now]);
    await this.dataSource.query('INSERT INTO thong_bao (tai_khoan_id, nguoi_gui_id, loai, tieu_de, noi_dung, trang_thai, duong_dan_hanh_dong, entity_type, entity_id, tao_luc, doc_luc, cap_nhat_luc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)', [booking.tai_khoan_id, ctx.accountId, 'message', 'Chuyên gia gửi tin nhắn mới', content.slice(0, 180), 'chua_doc', `/dashboard/bookings/${bookingId}/chat`, 'lich_hen', bookingId, new Date(), new Date()]);
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
    const { ctx } = await this.assertBooking(accountId, bookingId);
    await this.dataSource.query('UPDATE tin_nhan SET da_doc_luc = COALESCE(da_doc_luc, ?), da_doc_boi_id = ? WHERE lich_hen_id = ? AND nguoi_gui_id <> ?', [new Date(), ctx.accountId, bookingId, ctx.accountId]);
    this.chatGateway.emitChatRead(bookingId, ctx.accountId);
    return { ok: true };
  }
}
