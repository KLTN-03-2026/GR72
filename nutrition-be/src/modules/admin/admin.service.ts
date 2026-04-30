import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

type Dict = Record<string, any>;

type PaginationQuery = {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  from?: string;
  to?: string;
  type?: string;
  expertId?: string;
  packageId?: string;
};

const PACKAGE_STATUS = ['ban_nhap', 'dang_ban', 'ngung_ban'];
const PACKAGE_TYPES = ['suc_khoe', 'dinh_duong', 'tap_luyen'];
const PAYMENT_STATUS = ['khoi_tao', 'cho_thanh_toan', 'thanh_cong', 'that_bai', 'het_han', 'hoan_tien'];
const REVIEW_STATUS = ['hien_thi', 'bi_an', 'bi_bao_cao', 'da_xoa'];
const COMPLAINT_STATUS = ['moi', 'dang_xu_ly', 'cho_phan_hoi', 'da_giai_quyet', 'da_dong'];
const COMPLAINT_PRIORITY = ['thap', 'trung_binh', 'cao'];
const ACCOUNT_STATUS = ['hoat_dong', 'khong_hoat_dong', 'bi_khoa'];
const ACCOUNT_ROLES = ['customer', 'expert', 'admin'];
const EXPERT_STATUS = ['cho_duyet', 'tu_choi', 'hoat_dong', 'tam_dung', 'bi_khoa'];

function asInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

function parseJson(value: unknown) {
  if (!value || typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

@Injectable()
export class AdminService {
  constructor(private readonly dataSource: DataSource) {}

  async getOverview() {
    const [summary] = await this.dataSource.query(`
      SELECT
        COALESCE(SUM(CASE WHEN trang_thai = 'thanh_cong' THEN so_tien ELSE 0 END), 0) AS tong_doanh_thu,
        COUNT(*) AS tong_giao_dich,
        SUM(CASE WHEN trang_thai = 'thanh_cong' THEN 1 ELSE 0 END) AS giao_dich_thanh_cong,
        SUM(CASE WHEN trang_thai = 'hoan_tien' THEN 1 ELSE 0 END) AS giao_dich_hoan_tien
      FROM thanh_toan
    `);
    const [packages] = await this.dataSource.query(`SELECT COUNT(*) AS total FROM goi_dich_vu WHERE xoa_luc IS NULL`);
    const [reviews] = await this.dataSource.query(`SELECT COUNT(*) AS total FROM danh_gia WHERE trang_thai IN ('bi_bao_cao', 'bi_an')`);
    const [complaints] = await this.dataSource.query(`SELECT COUNT(*) AS total FROM khieu_nai WHERE trang_thai IN ('moi', 'dang_xu_ly', 'cho_phan_hoi')`);
    const [commission] = await this.dataSource.query(`SELECT COALESCE(SUM(tong_hoa_hong), 0) AS total FROM chi_tra_hoa_hong WHERE trang_thai = 'cho_chi_tra'`);

    return {
      revenue: Number(summary.tong_doanh_thu ?? 0),
      payments: Number(summary.tong_giao_dich ?? 0),
      successfulPayments: Number(summary.giao_dich_thanh_cong ?? 0),
      refundedPayments: Number(summary.giao_dich_hoan_tien ?? 0),
      packages: Number(packages.total ?? 0),
      flaggedReviews: Number(reviews.total ?? 0),
      openComplaints: Number(complaints.total ?? 0),
      pendingCommission: Number(commission.total ?? 0),
    };
  }

  async listUsers(query: PaginationQuery & { role?: string }) {
    const where = ['tk.xoa_luc IS NULL'];
    const params: unknown[] = [];
    if (query.status) { where.push('tk.trang_thai = ?'); params.push(query.status); }
    if (query.role) { where.push('tk.vai_tro = ?'); params.push(query.role); }
    if (query.search) {
      where.push('(tk.ho_ten LIKE ? OR tk.email LIKE ? OR tk.so_dien_thoai LIKE ?)');
      params.push(`%${query.search}%`, `%${query.search}%`, `%${query.search}%`);
    }

    const rows = await this.dataSource.query(
      `SELECT tk.id, tk.email, tk.vai_tro, tk.trang_thai, tk.ho_ten, tk.so_dien_thoai, tk.dang_nhap_cuoi_luc, tk.tao_luc, tk.cap_nhat_luc,
              COUNT(DISTINCT gdm.id) AS purchased_packages,
              COUNT(DISTINCT lh.id) AS bookings,
              COALESCE(SUM(CASE WHEN tt.trang_thai = 'thanh_cong' THEN tt.so_tien ELSE 0 END), 0) AS total_paid
       FROM tai_khoan tk
       LEFT JOIN goi_da_mua gdm ON gdm.tai_khoan_id = tk.id
       LEFT JOIN lich_hen lh ON lh.tai_khoan_id = tk.id
       LEFT JOIN thanh_toan tt ON tt.tai_khoan_id = tk.id
       WHERE ${where.join(' AND ')}
       GROUP BY tk.id
       ORDER BY tk.tao_luc DESC`,
      params,
    );
    return rows.map((row: Dict) => ({ ...row, purchased_packages: Number(row.purchased_packages ?? 0), bookings: Number(row.bookings ?? 0), total_paid: Number(row.total_paid ?? 0) }));
  }

  async getUser(id: number) {
    const [account] = await this.dataSource.query(
      `SELECT id, email, vai_tro, trang_thai, ho_ten, so_dien_thoai, dang_nhap_cuoi_luc, tao_luc, cap_nhat_luc
       FROM tai_khoan WHERE id = ? AND xoa_luc IS NULL`,
      [id],
    );
    if (!account) throw new NotFoundException('Khong tim thay tai khoan');
    const [customerProfile] = await this.dataSource.query('SELECT * FROM ho_so_customer WHERE tai_khoan_id = ?', [id]);
    const [healthProfile] = await this.dataSource.query('SELECT * FROM ho_so_suc_khoe WHERE tai_khoan_id = ?', [id]);
    const packages = await this.dataSource.query(
      `SELECT gdm.*, gdv.ten_goi, gdv.loai_goi
       FROM goi_da_mua gdm
       JOIN goi_dich_vu gdv ON gdv.id = gdm.goi_dich_vu_id
       WHERE gdm.tai_khoan_id = ? ORDER BY gdm.tao_luc DESC LIMIT 10`,
      [id],
    );
    const bookings = await this.dataSource.query(
      `SELECT lh.*, expert_account.ho_ten AS expert_name, gdv.ten_goi
       FROM lich_hen lh
       JOIN chuyen_gia cg ON cg.id = lh.chuyen_gia_id
       JOIN tai_khoan expert_account ON expert_account.id = cg.tai_khoan_id
       JOIN goi_dich_vu gdv ON gdv.id = lh.goi_dich_vu_id
       WHERE lh.tai_khoan_id = ? ORDER BY lh.ngay_hen DESC LIMIT 10`,
      [id],
    );
    const payments = await this.dataSource.query('SELECT * FROM thanh_toan WHERE tai_khoan_id = ? ORDER BY tao_luc DESC LIMIT 10', [id]);
    return { account, customerProfile: customerProfile ?? null, healthProfile: healthProfile ? { ...healthProfile, tinh_trang_suc_khoe: parseJson(healthProfile.tinh_trang_suc_khoe), di_ung: parseJson(healthProfile.di_ung), che_do_an_uu_tien: parseJson(healthProfile.che_do_an_uu_tien), thuc_pham_khong_dung: parseJson(healthProfile.thuc_pham_khong_dung) } : null, packages, bookings, payments };
  }

  async updateUserStatus(id: number, body: Dict, actorId?: number) {
    const status = String(body.trang_thai ?? body.status ?? '');
    if (!ACCOUNT_STATUS.includes(status)) throw new BadRequestException('Trang thai tai khoan khong hop le');
    const current = await this.getUser(id);
    await this.dataSource.query('UPDATE tai_khoan SET trang_thai = ?, cap_nhat_luc = ? WHERE id = ?', [status, new Date(), id]);
    await this.audit(actorId, 'update_user_status', 'tai_khoan', id, { trang_thai: current.account.trang_thai }, { trang_thai: status });
    return this.getUser(id);
  }

  async updateUserRole(id: number, body: Dict, actorId?: number) {
    const role = String(body.vai_tro ?? body.role ?? '');
    if (!ACCOUNT_ROLES.includes(role)) throw new BadRequestException('Vai tro tai khoan khong hop le');
    const current = await this.getUser(id);
    await this.dataSource.query('UPDATE tai_khoan SET vai_tro = ?, cap_nhat_luc = ? WHERE id = ?', [role, new Date(), id]);
    if (role === 'expert') {
      await this.dataSource.query(
        `INSERT IGNORE INTO chuyen_gia (tai_khoan_id, chuyen_mon, mo_ta, kinh_nghiem, hoc_vi, chung_chi, anh_dai_dien_url, trang_thai, nhan_booking, diem_danh_gia_trung_binh, so_luot_danh_gia, so_booking_hoan_thanh, ly_do_tu_choi, ly_do_bi_khoa, duyet_boi, duyet_luc, tao_luc, cap_nhat_luc, xoa_luc)
         VALUES (?, NULL, NULL, NULL, NULL, NULL, NULL, 'cho_duyet', 0, 0, 0, 0, NULL, NULL, NULL, NULL, ?, ?, NULL)`,
        [id, new Date(), new Date()],
      );
    }
    await this.audit(actorId, 'update_user_role', 'tai_khoan', id, { vai_tro: current.account.vai_tro }, { vai_tro: role });
    return this.getUser(id);
  }

  async listExperts(query: PaginationQuery & { booking?: string }) {
    const where = ['cg.xoa_luc IS NULL'];
    const params: unknown[] = [];
    if (query.status) { where.push('cg.trang_thai = ?'); params.push(query.status); }
    if (query.booking) { where.push('cg.nhan_booking = ?'); params.push(query.booking === 'yes' ? 1 : 0); }
    if (query.search) {
      where.push('(tk.ho_ten LIKE ? OR tk.email LIKE ? OR cg.chuyen_mon LIKE ? OR cg.hoc_vi LIKE ?)');
      params.push(`%${query.search}%`, `%${query.search}%`, `%${query.search}%`, `%${query.search}%`);
    }
    const rows = await this.dataSource.query(
      `SELECT cg.*, tk.ho_ten, tk.email, tk.so_dien_thoai, tk.trang_thai AS account_status,
              active_cfg.ty_le_hoa_hong AS commission_rate,
              COUNT(DISTINCT gdcg.goi_dich_vu_id) AS package_count,
              COUNT(DISTINCT lh.id) AS booking_count
       FROM chuyen_gia cg
       JOIN tai_khoan tk ON tk.id = cg.tai_khoan_id
       LEFT JOIN cau_hinh_hoa_hong active_cfg ON active_cfg.chuyen_gia_id = cg.id AND active_cfg.pham_vi = 'chuyen_gia' AND active_cfg.trang_thai = 'hoat_dong'
       LEFT JOIN goi_dich_vu_chuyen_gia gdcg ON gdcg.chuyen_gia_id = cg.id AND gdcg.trang_thai = 'hoat_dong'
       LEFT JOIN lich_hen lh ON lh.chuyen_gia_id = cg.id
       WHERE ${where.join(' AND ')}
       GROUP BY cg.id, active_cfg.ty_le_hoa_hong
       ORDER BY cg.tao_luc DESC`,
      params,
    );
    return rows.map((row: Dict) => ({ ...row, package_count: Number(row.package_count ?? 0), booking_count: Number(row.booking_count ?? 0), commission_rate: row.commission_rate == null ? null : Number(row.commission_rate) }));
  }

  async getExpert(id: number) {
    const [expert] = await this.dataSource.query(
      `SELECT cg.*, tk.ho_ten, tk.email, tk.so_dien_thoai, tk.trang_thai AS account_status,
              active_cfg.ty_le_hoa_hong AS commission_rate
       FROM chuyen_gia cg
       JOIN tai_khoan tk ON tk.id = cg.tai_khoan_id
       LEFT JOIN cau_hinh_hoa_hong active_cfg ON active_cfg.chuyen_gia_id = cg.id AND active_cfg.pham_vi = 'chuyen_gia' AND active_cfg.trang_thai = 'hoat_dong'
       WHERE cg.id = ? AND cg.xoa_luc IS NULL`,
      [id],
    );
    if (!expert) throw new NotFoundException('Khong tim thay chuyen gia');
    const packages = await this.dataSource.query(
      `SELECT gdcg.*, gdv.ten_goi, gdv.loai_goi
       FROM goi_dich_vu_chuyen_gia gdcg
       JOIN goi_dich_vu gdv ON gdv.id = gdcg.goi_dich_vu_id
       WHERE gdcg.chuyen_gia_id = ? ORDER BY gdcg.cap_nhat_luc DESC`,
      [id],
    );
    const bookings = await this.dataSource.query(
      `SELECT lh.*, customer.ho_ten AS customer_name, gdv.ten_goi
       FROM lich_hen lh
       JOIN tai_khoan customer ON customer.id = lh.tai_khoan_id
       JOIN goi_dich_vu gdv ON gdv.id = lh.goi_dich_vu_id
       WHERE lh.chuyen_gia_id = ? ORDER BY lh.ngay_hen DESC LIMIT 10`,
      [id],
    );
    const reviews = await this.dataSource.query(
      `SELECT dg.*, customer.ho_ten AS customer_name
       FROM danh_gia dg
       JOIN tai_khoan customer ON customer.id = dg.tai_khoan_id
       WHERE dg.chuyen_gia_id = ? ORDER BY dg.tao_luc DESC LIMIT 10`,
      [id],
    );
    return { expert: { ...expert, commission_rate: expert.commission_rate == null ? null : Number(expert.commission_rate) }, packages, bookings, reviews };
  }

  async updateExpertProfile(id: number, body: Dict, actorId?: number) {
    const current = await this.getExpert(id);
    await this.dataSource.query(
      `UPDATE chuyen_gia SET chuyen_mon = ?, mo_ta = ?, kinh_nghiem = ?, hoc_vi = ?, chung_chi = ?, cap_nhat_luc = ? WHERE id = ?`,
      [body.chuyen_mon ?? null, body.mo_ta ?? null, body.kinh_nghiem ?? null, body.hoc_vi ?? null, body.chung_chi ?? null, new Date(), id],
    );
    await this.audit(actorId, 'update_expert_profile', 'chuyen_gia', id, current.expert, body);
    return this.getExpert(id);
  }

  async updateExpertStatus(id: number, body: Dict, actorId?: number) {
    const status = String(body.trang_thai ?? body.status ?? '');
    if (!EXPERT_STATUS.includes(status)) throw new BadRequestException('Trang thai chuyen gia khong hop le');
    const reason = String(body.ly_do ?? body.reason ?? '').trim();
    if (['tu_choi', 'bi_khoa'].includes(status) && !reason) throw new BadRequestException('Vui long nhap ly do');
    const current = await this.getExpert(id);
    const approved = status === 'hoat_dong' ? ', duyet_boi = ?, duyet_luc = ?' : '';
    const reasonColumn = status === 'tu_choi' ? 'ly_do_tu_choi' : status === 'bi_khoa' ? 'ly_do_bi_khoa' : null;
    if (reasonColumn) {
      await this.dataSource.query(`UPDATE chuyen_gia SET trang_thai = ?, ${reasonColumn} = ?, cap_nhat_luc = ? WHERE id = ?`, [status, reason, new Date(), id]);
    } else if (approved) {
      await this.dataSource.query(`UPDATE chuyen_gia SET trang_thai = ?, ly_do_tu_choi = NULL, ly_do_bi_khoa = NULL${approved}, cap_nhat_luc = ? WHERE id = ?`, [status, actorId ?? null, new Date(), new Date(), id]);
    } else {
      await this.dataSource.query('UPDATE chuyen_gia SET trang_thai = ?, cap_nhat_luc = ? WHERE id = ?', [status, new Date(), id]);
    }
    await this.audit(actorId, 'update_expert_status', 'chuyen_gia', id, { trang_thai: current.expert.trang_thai }, { trang_thai: status, reason });
    return this.getExpert(id);
  }

  async updateExpertBooking(id: number, body: Dict, actorId?: number) {
    const enabled = Boolean(body.nhan_booking ?? body.enabled);
    const current = await this.getExpert(id);
    await this.dataSource.query('UPDATE chuyen_gia SET nhan_booking = ?, cap_nhat_luc = ? WHERE id = ?', [enabled ? 1 : 0, new Date(), id]);
    await this.audit(actorId, 'update_expert_booking', 'chuyen_gia', id, { nhan_booking: current.expert.nhan_booking }, { nhan_booking: enabled });
    return this.getExpert(id);
  }

  async updateExpertCommission(id: number, body: Dict, actorId?: number) {
    const rate = Number(body.ty_le_hoa_hong ?? body.rate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) throw new BadRequestException('Ty le hoa hong phai trong khoang 0-100');
    await this.getExpert(id);
    await this.dataSource.query("UPDATE cau_hinh_hoa_hong SET trang_thai = 'ngung_ap_dung', hieu_luc_den = CURDATE(), cap_nhat_luc = ? WHERE pham_vi = 'chuyen_gia' AND chuyen_gia_id = ? AND trang_thai = 'hoat_dong'", [new Date(), id]);
    const result = await this.dataSource.query(
      `INSERT INTO cau_hinh_hoa_hong (pham_vi, goi_dich_vu_id, chuyen_gia_id, ty_le_hoa_hong, hieu_luc_tu, hieu_luc_den, trang_thai, tao_luc, cap_nhat_luc)
       VALUES ('chuyen_gia', NULL, ?, ?, CURDATE(), NULL, 'hoat_dong', ?, ?)`,
      [id, rate, new Date(), new Date()],
    );
    await this.audit(actorId, 'update_expert_commission', 'cau_hinh_hoa_hong', result.insertId, null, { expertId: id, rate });
    return this.getExpert(id);
  }

  async listNotifications(query: PaginationQuery & { read?: string; role?: string }) {
    const where = ['1=1'];
    const params: unknown[] = [];
    if (query.status) { where.push('tb.trang_thai = ?'); params.push(query.status); }
    if (query.type) { where.push('tb.loai = ?'); params.push(query.type); }
    if (query.role) { where.push('tk.vai_tro = ?'); params.push(query.role); }
    if (query.search) {
      where.push('(tb.tieu_de LIKE ? OR tb.noi_dung LIKE ? OR tk.ho_ten LIKE ? OR tk.email LIKE ?)');
      params.push(`%${query.search}%`, `%${query.search}%`, `%${query.search}%`, `%${query.search}%`);
    }
    return this.dataSource.query(
      `SELECT tb.*, tk.ho_ten AS receiver_name, tk.email AS receiver_email, tk.vai_tro AS receiver_role, sender.ho_ten AS sender_name
       FROM thong_bao tb
       JOIN tai_khoan tk ON tk.id = tb.tai_khoan_id
       LEFT JOIN tai_khoan sender ON sender.id = tb.nguoi_gui_id
       WHERE ${where.join(' AND ')}
       ORDER BY tb.tao_luc DESC`,
      params,
    );
  }

  async getNotificationSummary(receiverId?: number) {
    if (!receiverId) return { total: 0, unread: 0, today: 0, latest: [] };
    const [summary] = await this.dataSource.query(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN trang_thai = 'chua_doc' THEN 1 ELSE 0 END) AS unread,
              SUM(CASE WHEN DATE(tao_luc) = CURDATE() THEN 1 ELSE 0 END) AS today
       FROM thong_bao WHERE tai_khoan_id = ?`,
      [receiverId],
    );
    const latest = await this.dataSource.query(
      `SELECT tb.*, tk.ho_ten AS receiver_name, tk.vai_tro AS receiver_role
       FROM thong_bao tb
       JOIN tai_khoan tk ON tk.id = tb.tai_khoan_id
       WHERE tb.tai_khoan_id = ?
       ORDER BY tb.tao_luc DESC LIMIT 5`,
      [receiverId],
    );
    return {
      total: Number(summary.total ?? 0),
      unread: Number(summary.unread ?? 0),
      today: Number(summary.today ?? 0),
      latest,
    };
  }

  async createNotification(body: Dict, actorId?: number) {
    const receiverId = Number(body.tai_khoan_id ?? body.receiverId);
    const title = String(body.tieu_de ?? body.title ?? '').trim();
    const content = String(body.noi_dung ?? body.content ?? '').trim();
    const type = String(body.loai ?? body.type ?? 'he_thong').trim();
    if (!receiverId) throw new BadRequestException('Vui long chon nguoi nhan');
    if (!title) throw new BadRequestException('Vui long nhap tieu de thong bao');
    if (!content) throw new BadRequestException('Vui long nhap noi dung thong bao');
    const [receiver] = await this.dataSource.query('SELECT id FROM tai_khoan WHERE id = ? AND xoa_luc IS NULL', [receiverId]);
    if (!receiver) throw new NotFoundException('Khong tim thay nguoi nhan thong bao');
    const now = new Date();
    const result = await this.dataSource.query(
      `INSERT INTO thong_bao (tai_khoan_id, nguoi_gui_id, loai, tieu_de, noi_dung, trang_thai, duong_dan_hanh_dong, entity_type, entity_id, tao_luc, doc_luc, cap_nhat_luc)
       VALUES (?, ?, ?, ?, ?, 'chua_doc', ?, ?, ?, ?, NULL, ?)`,
      [receiverId, actorId ?? null, type, title, content, body.duong_dan_hanh_dong ?? body.actionUrl ?? null, body.entity_type ?? null, body.entity_id ?? null, now, now],
    );
    await this.audit(actorId, 'create_notification', 'thong_bao', result.insertId, null, { receiverId, type, title });
    const [notification] = await this.dataSource.query('SELECT * FROM thong_bao WHERE id = ?', [result.insertId]);
    return notification;
  }

  async markNotificationRead(id: number, actorId?: number) {
    const [current] = await this.dataSource.query('SELECT * FROM thong_bao WHERE id = ?', [id]);
    if (!current) throw new NotFoundException('Khong tim thay thong bao');
    await this.dataSource.query("UPDATE thong_bao SET trang_thai = 'da_doc', doc_luc = COALESCE(doc_luc, ?), cap_nhat_luc = ? WHERE id = ?", [new Date(), new Date(), id]);
    await this.audit(actorId, 'mark_notification_read', 'thong_bao', id, { trang_thai: current.trang_thai }, { trang_thai: 'da_doc' });
    const [notification] = await this.dataSource.query('SELECT * FROM thong_bao WHERE id = ?', [id]);
    return notification;
  }

  async listPackages(query: PaginationQuery) {
    const where = ['xoa_luc IS NULL'];
    const params: unknown[] = [];
    if (query.status) {
      where.push('trang_thai = ?');
      params.push(query.status);
    }
    if (query.type) {
      where.push('loai_goi = ?');
      params.push(query.type);
    }
    if (query.search) {
      where.push('(ten_goi LIKE ? OR ma_goi LIKE ? OR slug LIKE ?)');
      params.push(`%${query.search}%`, `%${query.search}%`, `%${query.search}%`);
    }

    const rows = await this.dataSource.query(
      `SELECT * FROM goi_dich_vu WHERE ${where.join(' AND ')} ORDER BY thu_tu_hien_thi ASC, id DESC`,
      params,
    );

    return rows.map((row: Dict) => ({ ...row, quyen_loi: parseJson(row.quyen_loi) }));
  }

  async getPackage(id: number) {
    const [row] = await this.dataSource.query('SELECT * FROM goi_dich_vu WHERE id = ? AND xoa_luc IS NULL', [id]);
    if (!row) throw new NotFoundException('Khong tim thay goi dich vu');
    return { ...row, quyen_loi: parseJson(row.quyen_loi) };
  }

  async createPackage(body: Dict, actorId?: number) {
    this.validatePackage(body);
    const now = new Date();
    const code = String(body.ma_goi || body.code || slugify(body.ten_goi)).toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const slug = body.slug ? slugify(String(body.slug)) : slugify(String(body.ten_goi));
    const duplicate = await this.dataSource.query('SELECT id FROM goi_dich_vu WHERE (ma_goi = ? OR slug = ?) AND xoa_luc IS NULL LIMIT 1', [code, slug]);
    if (duplicate.length) throw new BadRequestException('Ma goi hoac slug da ton tai');

    const result = await this.dataSource.query(
      `INSERT INTO goi_dich_vu
        (ma_goi, ten_goi, slug, loai_goi, mo_ta, quyen_loi, gia, gia_khuyen_mai, thoi_han_ngay, so_luot_tu_van, thoi_luong_tu_van_phut, trang_thai, goi_noi_bat, thu_tu_hien_thi, tao_luc, cap_nhat_luc, xoa_luc)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        code,
        body.ten_goi,
        slug,
        body.loai_goi,
        body.mo_ta ?? null,
        JSON.stringify(body.quyen_loi ?? []),
        Number(body.gia),
        body.gia_khuyen_mai ? Number(body.gia_khuyen_mai) : null,
        Number(body.thoi_han_ngay),
        Number(body.so_luot_tu_van),
        Number(body.thoi_luong_tu_van_phut ?? 30),
        body.trang_thai ?? 'ban_nhap',
        Boolean(body.goi_noi_bat),
        Number(body.thu_tu_hien_thi ?? 1),
        now,
        now,
      ],
    );
    await this.audit(actorId, 'create', 'goi_dich_vu', result.insertId, null, body);
    return this.getPackage(result.insertId);
  }

  async updatePackage(id: number, body: Dict, actorId?: number) {
    const current = await this.getPackage(id);
    this.validatePackage({ ...current, ...body });
    const next = { ...current, ...body };
    const slug = body.slug ? slugify(String(body.slug)) : current.slug;
    const code = body.ma_goi ? String(body.ma_goi).toUpperCase().replace(/[^A-Z0-9_]/g, '_') : current.ma_goi;
    const duplicate = await this.dataSource.query('SELECT id FROM goi_dich_vu WHERE (ma_goi = ? OR slug = ?) AND id <> ? AND xoa_luc IS NULL LIMIT 1', [code, slug, id]);
    if (duplicate.length) throw new BadRequestException('Ma goi hoac slug da ton tai');

    await this.dataSource.query(
      `UPDATE goi_dich_vu SET ma_goi=?, ten_goi=?, slug=?, loai_goi=?, mo_ta=?, quyen_loi=?, gia=?, gia_khuyen_mai=?, thoi_han_ngay=?, so_luot_tu_van=?, thoi_luong_tu_van_phut=?, trang_thai=?, goi_noi_bat=?, thu_tu_hien_thi=?, cap_nhat_luc=? WHERE id=?`,
      [
        code,
        next.ten_goi,
        slug,
        next.loai_goi,
        next.mo_ta ?? null,
        JSON.stringify(next.quyen_loi ?? []),
        Number(next.gia),
        next.gia_khuyen_mai ? Number(next.gia_khuyen_mai) : null,
        Number(next.thoi_han_ngay),
        Number(next.so_luot_tu_van),
        Number(next.thoi_luong_tu_van_phut ?? 30),
        next.trang_thai,
        Boolean(next.goi_noi_bat),
        Number(next.thu_tu_hien_thi ?? 1),
        new Date(),
        id,
      ],
    );
    await this.audit(actorId, current.gia !== next.gia ? 'update_price' : 'update', 'goi_dich_vu', id, current, next);
    return this.getPackage(id);
  }

  async updatePackageStatus(id: number, status: string, actorId?: number) {
    if (!PACKAGE_STATUS.includes(status)) throw new BadRequestException('Trang thai goi khong hop le');
    const current = await this.getPackage(id);
    if (status === 'dang_ban') this.validatePackage({ ...current, trang_thai: status });
    await this.dataSource.query('UPDATE goi_dich_vu SET trang_thai = ?, cap_nhat_luc = ? WHERE id = ?', [status, new Date(), id]);
    await this.audit(actorId, 'update_status', 'goi_dich_vu', id, { trang_thai: current.trang_thai }, { trang_thai: status });
    return this.getPackage(id);
  }

  async listPackageExperts(packageId: number) {
    await this.getPackage(packageId);
    const assigned = await this.dataSource.query(
      `SELECT m.*, cg.chuyen_mon, cg.diem_danh_gia_trung_binh, tk.ho_ten, tk.email
       FROM goi_dich_vu_chuyen_gia m
       JOIN chuyen_gia cg ON cg.id = m.chuyen_gia_id
       JOIN tai_khoan tk ON tk.id = cg.tai_khoan_id
       WHERE m.goi_dich_vu_id = ?
       ORDER BY m.trang_thai ASC, tk.ho_ten ASC`,
      [packageId],
    );
    const available = await this.dataSource.query(
      `SELECT cg.id, cg.chuyen_mon, cg.diem_danh_gia_trung_binh, tk.ho_ten, tk.email
       FROM chuyen_gia cg
       JOIN tai_khoan tk ON tk.id = cg.tai_khoan_id
       WHERE cg.trang_thai = 'hoat_dong' AND cg.nhan_booking = 1 AND cg.xoa_luc IS NULL
       ORDER BY tk.ho_ten ASC`,
    );
    return { assigned, available };
  }

  async assignExpert(packageId: number, body: Dict, actorId?: number) {
    await this.getPackage(packageId);
    const expertId = Number(body.chuyen_gia_id ?? body.expertId);
    if (!expertId) throw new BadRequestException('Vui long chon chuyen gia');
    const [expert] = await this.dataSource.query("SELECT id FROM chuyen_gia WHERE id = ? AND trang_thai = 'hoat_dong' AND nhan_booking = 1 AND xoa_luc IS NULL", [expertId]);
    if (!expert) throw new BadRequestException('Chuyen gia khong san sang nhan booking');
    const commission = body.ty_le_hoa_hong_override == null || body.ty_le_hoa_hong_override === '' ? null : Number(body.ty_le_hoa_hong_override);
    if (commission != null && (commission < 0 || commission > 100)) throw new BadRequestException('Ty le hoa hong phai trong khoang 0-100');

    await this.dataSource.query(
      `INSERT INTO goi_dich_vu_chuyen_gia (goi_dich_vu_id, chuyen_gia_id, trang_thai, ty_le_hoa_hong_override, gan_boi, gan_luc, cap_nhat_luc)
       VALUES (?, ?, 'hoat_dong', ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE trang_thai = VALUES(trang_thai), ty_le_hoa_hong_override = VALUES(ty_le_hoa_hong_override), cap_nhat_luc = VALUES(cap_nhat_luc)`,
      [packageId, expertId, commission, actorId ?? null, new Date(), new Date()],
    );
    await this.audit(actorId, 'assign_expert', 'goi_dich_vu_chuyen_gia', packageId, null, { packageId, expertId, commission });
    return this.listPackageExperts(packageId);
  }

  async updatePackageExpert(packageId: number, expertId: number, body: Dict, actorId?: number) {
    const status = body.trang_thai ?? body.status;
    if (!['hoat_dong', 'tam_dung'].includes(status)) throw new BadRequestException('Trang thai mapping khong hop le');
    const commission = body.ty_le_hoa_hong_override == null || body.ty_le_hoa_hong_override === '' ? null : Number(body.ty_le_hoa_hong_override);
    if (commission != null && (commission < 0 || commission > 100)) throw new BadRequestException('Ty le hoa hong phai trong khoang 0-100');
    await this.dataSource.query('UPDATE goi_dich_vu_chuyen_gia SET trang_thai = ?, ty_le_hoa_hong_override = ?, cap_nhat_luc = ? WHERE goi_dich_vu_id = ? AND chuyen_gia_id = ?', [status, commission, new Date(), packageId, expertId]);
    await this.audit(actorId, 'update_expert_mapping', 'goi_dich_vu_chuyen_gia', packageId, null, { packageId, expertId, status, commission });
    return this.listPackageExperts(packageId);
  }

  async removePackageExpert(packageId: number, expertId: number, actorId?: number) {
    await this.dataSource.query('UPDATE goi_dich_vu_chuyen_gia SET trang_thai = ?, cap_nhat_luc = ? WHERE goi_dich_vu_id = ? AND chuyen_gia_id = ?', ['tam_dung', new Date(), packageId, expertId]);
    await this.audit(actorId, 'pause_expert_mapping', 'goi_dich_vu_chuyen_gia', packageId, null, { packageId, expertId });
    return this.listPackageExperts(packageId);
  }

  async listPayments(query: PaginationQuery) {
    const where = ['1=1'];
    const params: unknown[] = [];
    if (query.status) { where.push('tt.trang_thai = ?'); params.push(query.status); }
    if (query.type) { where.push('tt.loai_thanh_toan = ?'); params.push(query.type); }
    if (query.from) { where.push('DATE(tt.tao_luc) >= ?'); params.push(query.from); }
    if (query.to) { where.push('DATE(tt.tao_luc) <= ?'); params.push(query.to); }
    if (query.search) {
      where.push('(tt.ma_giao_dich LIKE ? OR tt.txn_ref LIKE ? OR tk.ho_ten LIKE ? OR tk.email LIKE ?)');
      params.push(`%${query.search}%`, `%${query.search}%`, `%${query.search}%`, `%${query.search}%`);
    }
    return this.dataSource.query(
      `SELECT tt.*, tk.ho_ten AS customer_name, tk.email AS customer_email
       FROM thanh_toan tt JOIN tai_khoan tk ON tk.id = tt.tai_khoan_id
       WHERE ${where.join(' AND ')} ORDER BY tt.tao_luc DESC`,
      params,
    );
  }

  async getPayment(id: number) {
    const [row] = await this.dataSource.query(
      `SELECT tt.*, tk.ho_ten AS customer_name, tk.email AS customer_email
       FROM thanh_toan tt JOIN tai_khoan tk ON tk.id = tt.tai_khoan_id WHERE tt.id = ?`,
      [id],
    );
    if (!row) throw new NotFoundException('Khong tim thay giao dich');
    return { ...row, raw_request: parseJson(row.raw_request), raw_response: parseJson(row.raw_response) };
  }

  async getPaymentWebhookLogs(id: number) {
    const rows = await this.dataSource.query('SELECT * FROM payment_webhook_log WHERE thanh_toan_id = ? ORDER BY tao_luc DESC', [id]);
    return rows.map((row: Dict) => ({ ...row, payload: parseJson(row.payload), ket_qua_xu_ly: parseJson(row.ket_qua_xu_ly) }));
  }

  async refundPayment(id: number, body: Dict, actorId?: number) {
    return this.dataSource.transaction(async (manager) => {
      const [payment] = await manager.query('SELECT * FROM thanh_toan WHERE id = ? FOR UPDATE', [id]);
      if (!payment) throw new NotFoundException('Khong tim thay giao dich');
      if (payment.trang_thai === 'hoan_tien') throw new BadRequestException('Giao dich da hoan tien');
      if (payment.trang_thai !== 'thanh_cong') throw new BadRequestException('Chi refund giao dich thanh cong');
      const existing = await manager.query("SELECT id FROM refund WHERE thanh_toan_id = ? AND trang_thai IN ('yeu_cau', 'dang_xu_ly', 'thanh_cong')", [id]);
      if (existing.length) throw new BadRequestException('Giao dich da co refund dang xu ly hoac thanh cong');
      const amount = Number(body.so_tien ?? payment.so_tien);
      if (!amount || amount <= 0 || amount > Number(payment.so_tien)) throw new BadRequestException('So tien refund khong hop le');
      const now = new Date();
      const result = await manager.query(
        `INSERT INTO refund (thanh_toan_id, so_tien, ly_do, trang_thai, xu_ly_boi, xu_ly_luc, raw_response, tao_luc, cap_nhat_luc)
         VALUES (?, ?, ?, 'thanh_cong', ?, ?, ?, ?, ?)`,
        [id, amount, body.ly_do || 'Admin refund', actorId ?? null, now, JSON.stringify({ source: 'admin_manual' }), now, now],
      );
      await manager.query('UPDATE thanh_toan SET trang_thai = ?, cap_nhat_luc = ? WHERE id = ?', ['hoan_tien', now, id]);
      if (payment.loai_thanh_toan === 'mua_goi') {
        await manager.query("UPDATE goi_da_mua SET trang_thai = 'da_hoan_tien', cap_nhat_luc = ? WHERE id = ?", [now, payment.doi_tuong_id]);
      }
      await this.audit(actorId, 'refund', 'thanh_toan', id, payment, { amount, refundId: result.insertId }, manager);
      return this.getPayment(id);
    });
  }

  async reconcilePayment(id: number, actorId?: number) {
    const payment = await this.getPayment(id);
    const logs = await this.getPaymentWebhookLogs(id);
    const validSuccess = logs.some((log: Dict) => Boolean(log.hop_le) && log.payload?.vnp_ResponseCode === '00');
    const status = validSuccess ? 'thanh_cong' : payment.trang_thai;
    await this.dataSource.query('UPDATE thanh_toan SET trang_thai = ?, cap_nhat_luc = ? WHERE id = ?', [status, new Date(), id]);
    await this.audit(actorId, 'reconcile', 'thanh_toan', id, { trang_thai: payment.trang_thai }, { trang_thai: status });
    return this.getPayment(id);
  }

  async listReviews(query: PaginationQuery & { rating?: string }) {
    const where = ['1=1'];
    const params: unknown[] = [];
    if (query.status) { where.push('dg.trang_thai = ?'); params.push(query.status); }
    if (query.rating) { where.push('dg.diem = ?'); params.push(Number(query.rating)); }
    if (query.expertId) { where.push('dg.chuyen_gia_id = ?'); params.push(Number(query.expertId)); }
    if (query.search) { where.push('(customer.ho_ten LIKE ? OR expert_account.ho_ten LIKE ? OR dg.noi_dung LIKE ?)'); params.push(`%${query.search}%`, `%${query.search}%`, `%${query.search}%`); }
    const rows = await this.dataSource.query(
      `SELECT dg.*, customer.ho_ten AS customer_name, expert_account.ho_ten AS expert_name, ph.noi_dung AS expert_reply
       FROM danh_gia dg
       JOIN tai_khoan customer ON customer.id = dg.tai_khoan_id
       JOIN chuyen_gia cg ON cg.id = dg.chuyen_gia_id
       JOIN tai_khoan expert_account ON expert_account.id = cg.tai_khoan_id
       LEFT JOIN phan_hoi_danh_gia ph ON ph.danh_gia_id = dg.id
       WHERE ${where.join(' AND ')} ORDER BY dg.tao_luc DESC`,
      params,
    );
    return rows.map((row: Dict) => ({ ...row, tags: parseJson(row.tags) }));
  }

  async getReview(id: number) {
    const [row] = await this.dataSource.query(
      `SELECT dg.*, customer.ho_ten AS customer_name, expert_account.ho_ten AS expert_name, ph.noi_dung AS expert_reply
       FROM danh_gia dg
       JOIN tai_khoan customer ON customer.id = dg.tai_khoan_id
       JOIN chuyen_gia cg ON cg.id = dg.chuyen_gia_id
       JOIN tai_khoan expert_account ON expert_account.id = cg.tai_khoan_id
       LEFT JOIN phan_hoi_danh_gia ph ON ph.danh_gia_id = dg.id
       WHERE dg.id = ?`,
      [id],
    );
    if (!row) throw new NotFoundException('Khong tim thay danh gia');
    return { ...row, tags: parseJson(row.tags) };
  }

  async updateReviewStatus(id: number, body: Dict, actorId?: number) {
    const status = body.trang_thai ?? body.status;
    if (!REVIEW_STATUS.includes(status)) throw new BadRequestException('Trang thai danh gia khong hop le');
    if (status !== 'hien_thi' && !body.ly_do_an) throw new BadRequestException('Vui long nhap ly do moderation');
    const current = await this.getReview(id);
    await this.dataSource.query('UPDATE danh_gia SET trang_thai = ?, an_boi = ?, an_luc = ?, ly_do_an = ?, cap_nhat_luc = ? WHERE id = ?', [status, status === 'hien_thi' ? null : actorId ?? null, status === 'hien_thi' ? null : new Date(), status === 'hien_thi' ? null : body.ly_do_an, new Date(), id]);
    await this.recalculateExpertRating(Number(current.chuyen_gia_id));
    await this.audit(actorId, 'moderate_review', 'danh_gia', id, { trang_thai: current.trang_thai }, { status, reason: body.ly_do_an });
    return this.getReview(id);
  }

  async addReviewModerationNote(id: number, body: Dict, actorId?: number) {
    const review = await this.getReview(id);
    await this.audit(actorId, 'review_moderation_note', 'danh_gia', id, null, { note: body.note, reviewId: review.id });
    return { ok: true };
  }

  async getRevenueSummary(query: PaginationQuery) {
    const { where, params } = this.paymentDateWhere(query, 'tt');
    const commissionDate = this.dateWhere(query, 'ct.tao_luc');
    const bookingDate = this.dateWhere(query, 'lh.hoan_thanh_luc');
    const [summary] = await this.dataSource.query(
      `SELECT
        COALESCE(SUM(CASE WHEN tt.trang_thai = 'thanh_cong' THEN tt.so_tien ELSE 0 END), 0) AS grossRevenue,
        COALESCE(SUM(CASE WHEN tt.trang_thai = 'hoan_tien' THEN tt.so_tien ELSE 0 END), 0) AS refundedRevenue,
        SUM(CASE WHEN tt.trang_thai = 'thanh_cong' THEN 1 ELSE 0 END) AS successfulPayments,
        SUM(CASE WHEN tt.trang_thai = 'hoan_tien' THEN 1 ELSE 0 END) AS refundedPayments
       FROM thanh_toan tt WHERE ${where}`,
      params,
    );
    const [booking] = await this.dataSource.query(
      `SELECT COUNT(*) AS completedBookings FROM lich_hen lh WHERE lh.trang_thai = 'hoan_thanh' AND ${bookingDate.where}`,
      bookingDate.params,
    );
    const [commission] = await this.dataSource.query(
      `SELECT COALESCE(SUM(ct.so_tien_hoa_hong), 0) AS payableCommission FROM chi_tiet_hoa_hong ct WHERE ct.trang_thai <> 'da_huy' AND ${commissionDate.where}`,
      commissionDate.params,
    );
    return {
      grossRevenue: Number(summary.grossRevenue ?? 0),
      refundedRevenue: Number(summary.refundedRevenue ?? 0),
      netRevenue: Number(summary.grossRevenue ?? 0) - Number(summary.refundedRevenue ?? 0),
      successfulPayments: Number(summary.successfulPayments ?? 0),
      refundedPayments: Number(summary.refundedPayments ?? 0),
      completedBookings: Number(booking.completedBookings ?? 0),
      payableCommission: Number(commission.payableCommission ?? 0),
    };
  }

  async getRevenueByPackage(query: PaginationQuery) {
    const { where, params } = this.paymentDateWhere(query, 'tt');
    return this.dataSource.query(
      `SELECT gdv.id, gdv.ten_goi, gdv.loai_goi, COUNT(tt.id) AS payment_count, COALESCE(SUM(tt.so_tien), 0) AS revenue
       FROM thanh_toan tt
       JOIN goi_da_mua gdm ON gdm.id = tt.doi_tuong_id AND tt.loai_thanh_toan = 'mua_goi'
       JOIN goi_dich_vu gdv ON gdv.id = gdm.goi_dich_vu_id
       WHERE ${where} AND tt.trang_thai = 'thanh_cong'
       GROUP BY gdv.id, gdv.ten_goi, gdv.loai_goi ORDER BY revenue DESC`,
      params,
    );
  }

  async getRevenueByExpert(query: PaginationQuery) {
    const dateFilter = this.dateWhere(query, 'ct.tao_luc');
    return this.dataSource.query(
      `SELECT cg.id AS expert_id, tk.ho_ten AS expert_name, COUNT(lh.id) AS completed_bookings,
              COALESCE(SUM(ct.doanh_thu_hop_le), 0) AS revenue,
              COALESCE(SUM(ct.so_tien_hoa_hong), 0) AS commission
       FROM chuyen_gia cg
       JOIN tai_khoan tk ON tk.id = cg.tai_khoan_id
       LEFT JOIN chi_tiet_hoa_hong ct ON ct.chuyen_gia_id = cg.id AND ct.trang_thai <> 'da_huy' AND ${dateFilter.where}
       LEFT JOIN lich_hen lh ON lh.id = ct.lich_hen_id AND lh.trang_thai = 'hoan_thanh'
       GROUP BY cg.id, tk.ho_ten ORDER BY revenue DESC`,
      dateFilter.params,
    );
  }

  async getRevenueTimeseries(query: PaginationQuery) {
    const { where, params } = this.paymentDateWhere(query, 'tt');
    return this.dataSource.query(
      `SELECT DATE(tt.tao_luc) AS date, COALESCE(SUM(CASE WHEN tt.trang_thai = 'thanh_cong' THEN tt.so_tien ELSE 0 END), 0) AS revenue,
              COUNT(*) AS payment_count
       FROM thanh_toan tt WHERE ${where} GROUP BY DATE(tt.tao_luc) ORDER BY date ASC`,
      params,
    );
  }

  async exportRevenue(query: PaginationQuery, actorId?: number) {
    const now = new Date();
    const result = await this.dataSource.query(
      `INSERT INTO export_job (nguoi_tao_id, loai_export, dinh_dang, filter_json, trang_thai, file_url, loi, tao_luc, hoan_thanh_luc)
       VALUES (?, 'doanh_thu', 'csv', ?, 'hoan_thanh', ?, NULL, ?, ?)`,
      [actorId ?? 1, JSON.stringify(query), `/uploads/exports/revenue-${Date.now()}.csv`, now, now],
    );
    await this.audit(actorId, 'export_revenue', 'export_job', result.insertId, null, query);
    return { exportJobId: result.insertId, file_url: `/uploads/exports/revenue-${Date.now()}.csv` };
  }

  async listCommissionPeriods(query: PaginationQuery & { year?: string }) {
    const where = ['1=1'];
    const params: unknown[] = [];
    if (query.status) { where.push('trang_thai = ?'); params.push(query.status); }
    if (query.year) { where.push('nam = ?'); params.push(Number(query.year)); }
    return this.dataSource.query(`SELECT * FROM ky_hoa_hong WHERE ${where.join(' AND ')} ORDER BY nam DESC, thang DESC`, params);
  }

  async createCommissionPeriod(body: Dict, actorId?: number) {
    const month = Number(body.thang);
    const year = Number(body.nam);
    if (!month || month < 1 || month > 12 || !year) throw new BadRequestException('Thang nam khong hop le');
    const code = `HH_${year}_${String(month).padStart(2, '0')}`;
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
    const now = new Date();
    await this.dataSource.query(
      `INSERT INTO ky_hoa_hong (ma_ky, thang, nam, tu_ngay, den_ngay, trang_thai, tong_doanh_thu_hop_le, tong_hoa_hong, tao_luc, cap_nhat_luc)
       VALUES (?, ?, ?, ?, ?, 'nhap', 0, 0, ?, ?)
       ON DUPLICATE KEY UPDATE cap_nhat_luc = VALUES(cap_nhat_luc)`,
      [code, month, year, start, end, now, now],
    );
    const [period] = await this.dataSource.query('SELECT * FROM ky_hoa_hong WHERE ma_ky = ?', [code]);
    await this.audit(actorId, 'create_commission_period', 'ky_hoa_hong', period.id, null, period);
    return period;
  }

  async getCommissionPeriod(id: number) {
    const [period] = await this.dataSource.query('SELECT * FROM ky_hoa_hong WHERE id = ?', [id]);
    if (!period) throw new NotFoundException('Khong tim thay ky hoa hong');
    const lines = await this.dataSource.query(
      `SELECT ct.*, tk.ho_ten AS expert_name, gdv.ten_goi
       FROM chi_tiet_hoa_hong ct
       JOIN chuyen_gia cg ON cg.id = ct.chuyen_gia_id
       JOIN tai_khoan tk ON tk.id = cg.tai_khoan_id
       JOIN goi_dich_vu gdv ON gdv.id = ct.goi_dich_vu_id
       WHERE ct.ky_hoa_hong_id = ? ORDER BY expert_name ASC`,
      [id],
    );
    const payouts = await this.dataSource.query(
      `SELECT p.*, tk.ho_ten AS expert_name FROM chi_tra_hoa_hong p
       JOIN chuyen_gia cg ON cg.id = p.chuyen_gia_id
       JOIN tai_khoan tk ON tk.id = cg.tai_khoan_id
       WHERE p.ky_hoa_hong_id = ? ORDER BY expert_name ASC`,
      [id],
    );
    return { period, lines, payouts };
  }

  async recalculateCommissionPeriod(id: number, actorId?: number) {
    return this.dataSource.transaction(async (manager) => {
      const [period] = await manager.query('SELECT * FROM ky_hoa_hong WHERE id = ? FOR UPDATE', [id]);
      if (!period) throw new NotFoundException('Khong tim thay ky hoa hong');
      if (period.trang_thai !== 'nhap') throw new BadRequestException('Chi tinh lai ky dang nhap');
      await manager.query('DELETE FROM chi_tra_hoa_hong WHERE ky_hoa_hong_id = ?', [id]);
      await manager.query('DELETE FROM chi_tiet_hoa_hong WHERE ky_hoa_hong_id = ?', [id]);
      const bookings = await manager.query(
        `SELECT lh.id AS lich_hen_id, lh.chuyen_gia_id, lh.goi_dich_vu_id, lh.thanh_toan_id, tt.so_tien,
                COALESCE(gdcg.ty_le_hoa_hong_override, cfg_pkg.ty_le_hoa_hong, cfg_expert.ty_le_hoa_hong, cfg_default.ty_le_hoa_hong, 30) AS rate
         FROM lich_hen lh
         JOIN thanh_toan tt ON tt.id = lh.thanh_toan_id AND tt.trang_thai = 'thanh_cong'
         LEFT JOIN refund rf ON rf.thanh_toan_id = tt.id AND rf.trang_thai IN ('yeu_cau','dang_xu_ly','thanh_cong')
         LEFT JOIN goi_dich_vu_chuyen_gia gdcg ON gdcg.goi_dich_vu_id = lh.goi_dich_vu_id AND gdcg.chuyen_gia_id = lh.chuyen_gia_id
         LEFT JOIN cau_hinh_hoa_hong cfg_pkg ON cfg_pkg.pham_vi = 'goi_dich_vu' AND cfg_pkg.goi_dich_vu_id = lh.goi_dich_vu_id AND cfg_pkg.trang_thai = 'hoat_dong'
         LEFT JOIN cau_hinh_hoa_hong cfg_expert ON cfg_expert.pham_vi = 'chuyen_gia' AND cfg_expert.chuyen_gia_id = lh.chuyen_gia_id AND cfg_expert.trang_thai = 'hoat_dong'
         LEFT JOIN cau_hinh_hoa_hong cfg_default ON cfg_default.pham_vi = 'he_thong' AND cfg_default.trang_thai = 'hoat_dong'
         WHERE lh.trang_thai = 'hoan_thanh' AND rf.id IS NULL AND DATE(lh.hoan_thanh_luc) BETWEEN ? AND ?`,
        [period.tu_ngay, period.den_ngay],
      );
      let totalRevenue = 0;
      let totalCommission = 0;
      for (const booking of bookings) {
        const revenue = Number(booking.so_tien);
        const rate = Number(booking.rate ?? 30);
        const commission = Math.round((revenue * rate) / 100);
        totalRevenue += revenue;
        totalCommission += commission;
        await manager.query(
          `INSERT INTO chi_tiet_hoa_hong (ky_hoa_hong_id, lich_hen_id, thanh_toan_id, chuyen_gia_id, goi_dich_vu_id, doanh_thu_hop_le, ty_le_hoa_hong, so_tien_hoa_hong, trang_thai, tao_luc, cap_nhat_luc)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'nhap', ?, ?)`,
          [id, booking.lich_hen_id, booking.thanh_toan_id, booking.chuyen_gia_id, booking.goi_dich_vu_id, revenue, rate, commission, new Date(), new Date()],
        );
      }
      const byExpert = await manager.query(
        `SELECT chuyen_gia_id, COUNT(*) AS so_booking, SUM(doanh_thu_hop_le) AS revenue, SUM(so_tien_hoa_hong) AS commission
         FROM chi_tiet_hoa_hong WHERE ky_hoa_hong_id = ? GROUP BY chuyen_gia_id`,
        [id],
      );
      for (const row of byExpert) {
        await manager.query(
          `INSERT INTO chi_tra_hoa_hong (ky_hoa_hong_id, chuyen_gia_id, so_booking, tong_doanh_thu_hop_le, tong_hoa_hong, trang_thai, phuong_thuc_chi_tra, ma_chi_tra, ghi_chu, chi_tra_luc, tao_luc, cap_nhat_luc)
           VALUES (?, ?, ?, ?, ?, 'cho_chi_tra', 'chuyen_khoan', ?, 'Cho chi tra theo ky', NULL, ?, ?)`,
          [id, row.chuyen_gia_id, row.so_booking, row.revenue, row.commission, `PAYOUT_${id}_${row.chuyen_gia_id}`, new Date(), new Date()],
        );
      }
      await manager.query('UPDATE ky_hoa_hong SET tong_doanh_thu_hop_le = ?, tong_hoa_hong = ?, cap_nhat_luc = ? WHERE id = ?', [totalRevenue, totalCommission, new Date(), id]);
      await this.audit(actorId, 'recalculate_commission', 'ky_hoa_hong', id, null, { totalRevenue, totalCommission }, manager);
      return this.getCommissionPeriod(id);
    });
  }

  async finalizeCommissionPeriod(id: number, actorId?: number) {
    await this.dataSource.query("UPDATE ky_hoa_hong SET trang_thai = 'da_chot', chot_boi = ?, chot_luc = ?, cap_nhat_luc = ? WHERE id = ? AND trang_thai = 'nhap'", [actorId ?? null, new Date(), new Date(), id]);
    await this.dataSource.query("UPDATE chi_tiet_hoa_hong SET trang_thai = 'da_chot', cap_nhat_luc = ? WHERE ky_hoa_hong_id = ? AND trang_thai = 'nhap'", [new Date(), id]);
    await this.audit(actorId, 'finalize_commission', 'ky_hoa_hong', id, null, { status: 'da_chot' });
    return this.getCommissionPeriod(id);
  }

  async payoutCommissionPeriod(id: number, actorId?: number) {
    await this.dataSource.query("UPDATE chi_tra_hoa_hong SET trang_thai = 'da_chi_tra', chi_tra_luc = ?, cap_nhat_luc = ? WHERE ky_hoa_hong_id = ? AND trang_thai = 'cho_chi_tra'", [new Date(), new Date(), id]);
    await this.dataSource.query("UPDATE ky_hoa_hong SET trang_thai = 'da_chi_tra', chi_tra_boi = ?, chi_tra_luc = ?, cap_nhat_luc = ? WHERE id = ?", [actorId ?? null, new Date(), new Date(), id]);
    await this.audit(actorId, 'payout_commission', 'ky_hoa_hong', id, null, { status: 'da_chi_tra' });
    return this.getCommissionPeriod(id);
  }

  async listComplaints(query: PaginationQuery & { priority?: string }) {
    const where = ['1=1'];
    const params: unknown[] = [];
    if (query.status) { where.push('kn.trang_thai = ?'); params.push(query.status); }
    if (query.type) { where.push('kn.loai_khieu_nai = ?'); params.push(query.type); }
    if (query.priority) { where.push('kn.muc_uu_tien = ?'); params.push(query.priority); }
    if (query.search) { where.push('(kn.ma_khieu_nai LIKE ? OR kn.tieu_de LIKE ? OR sender.ho_ten LIKE ?)'); params.push(`%${query.search}%`, `%${query.search}%`, `%${query.search}%`); }
    return this.dataSource.query(
      `SELECT kn.*, sender.ho_ten AS sender_name, assignee.ho_ten AS assignee_name
       FROM khieu_nai kn
       JOIN tai_khoan sender ON sender.id = kn.nguoi_gui_id
       LEFT JOIN tai_khoan assignee ON assignee.id = kn.gan_cho_id
       WHERE ${where.join(' AND ')} ORDER BY kn.tao_luc DESC`,
      params,
    );
  }

  async getComplaint(id: number) {
    const [complaint] = await this.dataSource.query(
      `SELECT kn.*, sender.ho_ten AS sender_name, assignee.ho_ten AS assignee_name
       FROM khieu_nai kn
       JOIN tai_khoan sender ON sender.id = kn.nguoi_gui_id
       LEFT JOIN tai_khoan assignee ON assignee.id = kn.gan_cho_id WHERE kn.id = ?`,
      [id],
    );
    if (!complaint) throw new NotFoundException('Khong tim thay khieu nai');
    const messages = await this.dataSource.query(
      `SELECT msg.*, tk.ho_ten AS sender_name FROM khieu_nai_tin_nhan msg
       JOIN tai_khoan tk ON tk.id = msg.nguoi_gui_id WHERE msg.khieu_nai_id = ? ORDER BY msg.tao_luc ASC`,
      [id],
    );
    return { complaint, messages: messages.map((row: Dict) => ({ ...row, tep_dinh_kem: parseJson(row.tep_dinh_kem) })) };
  }

  async assignComplaint(id: number, body: Dict, actorId?: number) {
    const status = body.trang_thai ?? 'dang_xu_ly';
    const priority = body.muc_uu_tien;
    if (!COMPLAINT_STATUS.includes(status)) throw new BadRequestException('Trang thai khieu nai khong hop le');
    if (priority && !COMPLAINT_PRIORITY.includes(priority)) throw new BadRequestException('Muc uu tien khong hop le');
    await this.dataSource.query('UPDATE khieu_nai SET gan_cho_id = ?, muc_uu_tien = COALESCE(?, muc_uu_tien), trang_thai = ?, cap_nhat_luc = ? WHERE id = ?', [body.gan_cho_id ?? actorId ?? null, priority ?? null, status, new Date(), id]);
    await this.audit(actorId, 'assign_complaint', 'khieu_nai', id, null, body);
    return this.getComplaint(id);
  }

  async addComplaintMessage(id: number, body: Dict, actorId?: number) {
    if (!body.noi_dung) throw new BadRequestException('Noi dung tin nhan khong duoc de trong');
    await this.getComplaint(id);
    await this.dataSource.query('INSERT INTO khieu_nai_tin_nhan (khieu_nai_id, nguoi_gui_id, noi_dung, tep_dinh_kem, tao_luc) VALUES (?, ?, ?, ?, ?)', [id, actorId ?? 1, body.noi_dung, JSON.stringify(body.tep_dinh_kem ?? []), new Date()]);
    await this.audit(actorId, 'complaint_message', 'khieu_nai', id, null, { message: body.noi_dung });
    return this.getComplaint(id);
  }

  async resolveComplaint(id: number, body: Dict, actorId?: number) {
    if (!body.ket_qua_xu_ly) throw new BadRequestException('Vui long nhap ket qua xu ly');
    const status = body.trang_thai ?? 'da_giai_quyet';
    if (!['da_giai_quyet', 'da_dong'].includes(status)) throw new BadRequestException('Trang thai dong khieu nai khong hop le');
    await this.dataSource.query('UPDATE khieu_nai SET trang_thai = ?, ket_qua_xu_ly = ?, dong_luc = ?, cap_nhat_luc = ? WHERE id = ?', [status, body.ket_qua_xu_ly, new Date(), new Date(), id]);
    await this.audit(actorId, 'resolve_complaint', 'khieu_nai', id, null, body);
    return this.getComplaint(id);
  }

  private validatePackage(body: Dict) {
    if (!body.ten_goi || String(body.ten_goi).trim().length < 3) throw new BadRequestException('Ten goi phai co it nhat 3 ky tu');
    if (!PACKAGE_TYPES.includes(body.loai_goi)) throw new BadRequestException('Loai goi khong hop le');
    if (!PACKAGE_STATUS.includes(body.trang_thai ?? 'ban_nhap')) throw new BadRequestException('Trang thai goi khong hop le');
    if (Number(body.gia) <= 0) throw new BadRequestException('Gia goi phai lon hon 0');
    if (Number(body.thoi_han_ngay) <= 0) throw new BadRequestException('Thoi han goi phai lon hon 0');
    if (Number(body.so_luot_tu_van) <= 0) throw new BadRequestException('So luot tu van phai lon hon 0');
  }

  private paymentDateWhere(query: PaginationQuery, alias: string) {
    return this.dateWhere(query, `${alias}.tao_luc`);
  }

  private dateWhere(query: PaginationQuery, column: string) {
    const where = ['1=1'];
    const params: unknown[] = [];
    if (query.from) { where.push(`DATE(${column}) >= ?`); params.push(query.from); }
    if (query.to) { where.push(`DATE(${column}) <= ?`); params.push(query.to); }
    return { where: where.join(' AND '), params };
  }

  private async recalculateExpertRating(expertId: number) {
    const [summary] = await this.dataSource.query("SELECT AVG(diem) AS avg_rating, COUNT(*) AS total FROM danh_gia WHERE chuyen_gia_id = ? AND trang_thai = 'hien_thi'", [expertId]);
    await this.dataSource.query('UPDATE chuyen_gia SET diem_danh_gia_trung_binh = ?, so_luot_danh_gia = ?, cap_nhat_luc = ? WHERE id = ?', [Number(summary.avg_rating ?? 0), Number(summary.total ?? 0), new Date(), expertId]);
  }

  private async audit(actorId: number | undefined, action: string, resourceType: string, resourceId: number, oldValue: unknown, newValue: unknown, runner: { query: (sql: string, params?: unknown[]) => Promise<unknown> } = this.dataSource) {
    await runner.query(
      `INSERT INTO audit_log (actor_id, actor_role, action, resource_type, resource_id, old_value, new_value, ip_address, user_agent, request_id, tao_luc)
       VALUES (?, 'admin', ?, ?, ?, ?, ?, NULL, NULL, NULL, ?)`,
      [actorId ?? null, action, resourceType, resourceId, oldValue == null ? null : JSON.stringify(oldValue), newValue == null ? null : JSON.stringify(newValue), new Date()],
    );
  }
}
