import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';
import { DataSource } from 'typeorm';
import {
  generatePaymentUrl,
  isVnpaySuccess,
  verifyIpnSignature,
  verifyReturnSignature,
} from '../../common/vnpay/vnpay.util';
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

function parseJson(value: unknown) {
  if (!value || typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function plusDays(date: Date, days: number) {
  const clone = new Date(date);
  clone.setDate(clone.getDate() + days);
  return clone;
}

function plusHours(date: Date, hours: number) {
  const clone = new Date(date);
  clone.setHours(clone.getHours() + hours);
  return clone;
}

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toWeekday(date: Date) {
  const weekday = date.getDay();
  return weekday === 0 ? 7 : weekday;
}

function makeCode(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function asDate(value: unknown) {
  return value ? new Date(value as string | number | Date) : null;
}

@Injectable()
export class CustomerService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly chatGateway: ChatGateway,
  ) {}

  private async assertAccount(accountId: number | undefined) {
    if (!accountId) throw new UnauthorizedException('Ban chua dang nhap');
    return accountId;
  }

  private async assertPackagePurchase(accountId: number | undefined, purchaseId: number) {
    const userId = await this.assertAccount(accountId);
    const [purchase] = await this.dataSource.query(
      `SELECT gdm.*, gdv.ten_goi, gdv.loai_goi, gdv.thoi_luong_tu_van_phut
       FROM goi_da_mua gdm
       JOIN goi_dich_vu gdv ON gdv.id = gdm.goi_dich_vu_id
       WHERE gdm.id = ? AND gdm.tai_khoan_id = ?`,
      [purchaseId, userId],
    );
    if (!purchase) throw new NotFoundException('Khong tim thay goi da mua');
    return purchase;
  }

  private purchaseRuntimeStatus(purchase: Dict) {
    if (purchase.trang_thai === 'tam_khoa') return 'tam_khoa';
    if (purchase.trang_thai === 'da_hoan_tien') return 'da_hoan_tien';
    if (purchase.trang_thai === 'cho_thanh_toan') return 'cho_thanh_toan';

    const now = new Date();
    const expiredAt = purchase.het_han_luc ? new Date(purchase.het_han_luc) : null;
    const remaining = toNumber(purchase.so_luot_con_lai);
    if (expiredAt && expiredAt.getTime() < now.getTime()) return 'het_han';
    if (remaining <= 0) return 'het_luot';
    return 'dang_hieu_luc';
  }

  private async assertBookablePackagePurchase(accountId: number | undefined, purchaseId: number) {
    const purchase = await this.assertPackagePurchase(accountId, purchaseId);
    const runtime = this.purchaseRuntimeStatus(purchase);
    if (runtime !== 'dang_hieu_luc') {
      throw new BadRequestException('Goi da mua khong con hieu luc de dat lich');
    }
    return purchase;
  }

  async listServicePackages(query: Dict) {
    const where = ["gdv.trang_thai = 'dang_ban'", 'gdv.xoa_luc IS NULL'];
    const params: unknown[] = [];

    if (query.search) {
      where.push('(gdv.ten_goi LIKE ? OR gdv.mo_ta LIKE ?)');
      params.push(`%${query.search}%`, `%${query.search}%`);
    }
    if (query.type) {
      where.push('gdv.loai_goi = ?');
      params.push(query.type);
    }

    const rows = await this.dataSource.query(
      `SELECT gdv.*,
              COUNT(DISTINCT gdcg.chuyen_gia_id) AS so_chuyen_gia,
              COALESCE(AVG(cg.diem_danh_gia_trung_binh), 0) AS rating_trung_binh
       FROM goi_dich_vu gdv
       LEFT JOIN goi_dich_vu_chuyen_gia gdcg ON gdcg.goi_dich_vu_id = gdv.id AND gdcg.trang_thai = 'hoat_dong'
       LEFT JOIN chuyen_gia cg ON cg.id = gdcg.chuyen_gia_id AND cg.trang_thai = 'hoat_dong' AND cg.nhan_booking = 1
       WHERE ${where.join(' AND ')}
       GROUP BY gdv.id
       ORDER BY gdv.thu_tu_hien_thi ASC, gdv.id DESC`,
      params,
    );
    return rows.map((row: Dict) => ({
      ...row,
      quyen_loi: parseJson(row.quyen_loi) ?? [],
      so_chuyen_gia: toNumber(row.so_chuyen_gia),
      rating_trung_binh: Number(row.rating_trung_binh ?? 0),
    }));
  }

  async getServicePackage(accountId: number | undefined, packageId: number) {
    const [pkg] = await this.dataSource.query(
      `SELECT * FROM goi_dich_vu WHERE id = ? AND xoa_luc IS NULL`,
      [packageId],
    );
    if (!pkg) throw new NotFoundException('Khong tim thay goi dich vu');

    const experts = await this.dataSource.query(
      `SELECT cg.id AS chuyen_gia_id, tk.ho_ten, tk.email, cg.anh_dai_dien_url, cg.chuyen_mon,
              cg.mo_ta, cg.diem_danh_gia_trung_binh, cg.so_luot_danh_gia, cg.so_booking_hoan_thanh,
              cg.nhan_booking
       FROM goi_dich_vu_chuyen_gia gdcg
       JOIN chuyen_gia cg ON cg.id = gdcg.chuyen_gia_id
       JOIN tai_khoan tk ON tk.id = cg.tai_khoan_id
       WHERE gdcg.goi_dich_vu_id = ? AND gdcg.trang_thai = 'hoat_dong' AND cg.trang_thai = 'hoat_dong'
       ORDER BY cg.diem_danh_gia_trung_binh DESC, cg.so_booking_hoan_thanh DESC`,
      [packageId],
    );

    let owned = false;
    if (accountId) {
      const rows = await this.dataSource.query(
        `SELECT id FROM goi_da_mua WHERE tai_khoan_id = ? AND goi_dich_vu_id = ? AND trang_thai IN ('dang_hieu_luc', 'cho_thanh_toan', 'het_luot') LIMIT 1`,
        [accountId, packageId],
      );
      owned = rows.length > 0;
    }

    return {
      ...pkg,
      quyen_loi: parseJson(pkg.quyen_loi) ?? [],
      da_so_huu: owned,
      experts,
    };
  }

  private async createPaymentRecord(
    manager: any,
    accountId: number,
    type: 'mua_goi' | 'booking',
    objectId: number,
    amount: number,
    orderInfo: string,
  ) {
    const now = new Date();
    const txnRef = makeCode(type === 'mua_goi' ? 'PKG_TXN' : 'BKG_TXN').slice(0, 50);
    const paymentUrl = generatePaymentUrl({
      amount,
      orderDescription: orderInfo,
      orderType: type === 'mua_goi' ? 'other' : 'billpayment',
      txnRef,
      language: 'vn',
    });
    const result = await manager.query(
      `INSERT INTO thanh_toan
      (tai_khoan_id, loai_thanh_toan, doi_tuong_id, ma_giao_dich, cong_thanh_toan, so_tien, tien_te,
       trang_thai, payment_url, txn_ref, raw_request, raw_response, thanh_toan_luc, het_han_luc, tao_luc, cap_nhat_luc)
      VALUES (?, ?, ?, ?, ?, ?, 'VND', 'cho_thanh_toan', ?, ?, ?, NULL, NULL, ?, ?, ?)`,
      [
        accountId,
        type,
        objectId,
        makeCode(type === 'mua_goi' ? 'PAY_PKG' : 'PAY_BKG').slice(0, 80),
        'vnpay',
        amount,
        paymentUrl,
        txnRef,
        JSON.stringify({ orderInfo, amount, txnRef }),
        plusHours(now, 1),
        now,
        now,
      ],
    );

    const [payment] = await manager.query('SELECT * FROM thanh_toan WHERE id = ?', [result.insertId]);
    return payment;
  }

  async createPackagePurchase(accountId: number | undefined, body: Dict) {
    const userId = await this.assertAccount(accountId);
    const packageId = toNumber(body.goi_dich_vu_id ?? body.package_id);
    if (!packageId) throw new BadRequestException('Thieu goi dich vu');

    return this.dataSource.transaction(async (manager) => {
      const [pkg] = await manager.query('SELECT * FROM goi_dich_vu WHERE id = ? AND xoa_luc IS NULL FOR UPDATE', [packageId]);
      if (!pkg) throw new NotFoundException('Khong tim thay goi dich vu');
      if (pkg.trang_thai !== 'dang_ban') throw new BadRequestException('Goi khong trong trang thai dang ban');

      const price = Number(pkg.gia_khuyen_mai ?? pkg.gia ?? 0);
      if (price <= 0) throw new BadRequestException('Gia goi dich vu khong hop le');

      const now = new Date();
      const purchaseCode = makeCode('GDM').slice(0, 80);
      const result = await manager.query(
        `INSERT INTO goi_da_mua
        (tai_khoan_id, goi_dich_vu_id, ma_goi_da_mua, trang_thai, gia_mua, so_luot_tong, so_luot_da_dung, so_luot_con_lai,
         bat_dau_luc, het_han_luc, khoa_luc, ly_do_khoa, tao_luc, cap_nhat_luc)
        VALUES (?, ?, ?, 'cho_thanh_toan', ?, ?, 0, ?, NULL, NULL, NULL, NULL, ?, ?)`,
        [userId, packageId, purchaseCode, price, pkg.so_luot_tu_van, pkg.so_luot_tu_van, now, now],
      );

      const purchaseId = result.insertId;
      const payment = await this.createPaymentRecord(
        manager,
        userId,
        'mua_goi',
        purchaseId,
        price,
        `Thanh toan mua goi ${pkg.ten_goi}`,
      );

      return {
        package_purchase_id: purchaseId,
        payment_id: payment.id,
        payment_url: payment.payment_url,
        txn_ref: payment.txn_ref,
        amount: Number(payment.so_tien),
        status: payment.trang_thai,
      };
    });
  }

  async getPackagePurchase(accountId: number | undefined, purchaseId: number) {
    const purchase = await this.assertPackagePurchase(accountId, purchaseId);
    const payment = await this.dataSource.query(
      `SELECT * FROM thanh_toan WHERE loai_thanh_toan = 'mua_goi' AND doi_tuong_id = ? ORDER BY tao_luc DESC LIMIT 1`,
      [purchaseId],
    );

    return {
      ...purchase,
      runtime_status: this.purchaseRuntimeStatus(purchase),
      payment: payment[0] ?? null,
    };
  }

  async listMyPackages(accountId: number | undefined, query: Dict) {
    const userId = await this.assertAccount(accountId);
    await this.dataSource.transaction(async (manager) => {
      const stale = await manager.query(
        `SELECT tt.id AS payment_id, gdm.id AS purchase_id
         FROM thanh_toan tt
         JOIN goi_da_mua gdm ON gdm.id = tt.doi_tuong_id
         WHERE tt.tai_khoan_id = ?
           AND tt.loai_thanh_toan = 'mua_goi'
           AND tt.trang_thai = 'cho_thanh_toan'
           AND tt.het_han_luc IS NOT NULL
           AND tt.het_han_luc < NOW()
           AND gdm.trang_thai = 'cho_thanh_toan'`,
        [userId],
      );
      for (const row of stale) {
        await manager.query(
          `UPDATE thanh_toan
           SET trang_thai = 'that_bai', cap_nhat_luc = ?
           WHERE id = ?`,
          [new Date(), row.payment_id],
        );
        await manager.query(
          `UPDATE goi_da_mua
           SET trang_thai = 'het_han', cap_nhat_luc = ?
           WHERE id = ? AND trang_thai = 'cho_thanh_toan'`,
          [new Date(), row.purchase_id],
        );
      }
    });

    const where = ['gdm.tai_khoan_id = ?', "gdm.trang_thai <> 'cho_thanh_toan'"];
    const params: unknown[] = [userId];

    if (query.search) {
      where.push('(gdv.ten_goi LIKE ? OR gdm.ma_goi_da_mua LIKE ?)');
      params.push(`%${query.search}%`, `%${query.search}%`);
    }

    const rows = await this.dataSource.query(
      `SELECT gdm.*, gdv.ten_goi, gdv.loai_goi, gdv.thoi_luong_tu_van_phut
       FROM goi_da_mua gdm
       JOIN goi_dich_vu gdv ON gdv.id = gdm.goi_dich_vu_id
       WHERE ${where.join(' AND ')}
       ORDER BY gdm.tao_luc DESC`,
      params,
    );

    return rows.map((row: Dict) => ({
      ...row,
      runtime_status: this.purchaseRuntimeStatus(row),
    }));
  }

  async getMyPackage(accountId: number | undefined, purchaseId: number) {
    const purchase = await this.assertPackagePurchase(accountId, purchaseId);
    const [summary] = await this.dataSource.query(
      `SELECT COUNT(*) AS total_booking,
              SUM(CASE WHEN trang_thai = 'hoan_thanh' THEN 1 ELSE 0 END) AS completed_booking,
              SUM(CASE WHEN trang_thai = 'da_huy' THEN 1 ELSE 0 END) AS cancelled_booking
       FROM lich_hen WHERE goi_da_mua_id = ?`,
      [purchaseId],
    );

    return {
      ...purchase,
      runtime_status: this.purchaseRuntimeStatus(purchase),
      usage_summary: {
        total_booking: toNumber(summary?.total_booking),
        completed_booking: toNumber(summary?.completed_booking),
        cancelled_booking: toNumber(summary?.cancelled_booking),
      },
    };
  }

  async getPackageUsageHistory(accountId: number | undefined, purchaseId: number) {
    await this.assertPackagePurchase(accountId, purchaseId);
    const rows = await this.dataSource.query(
      `SELECT ls.*, lh.ma_lich_hen, lh.ngay_hen, lh.gio_bat_dau, lh.trang_thai AS trang_thai_booking,
              tk.ho_ten AS expert_name
       FROM lich_su_su_dung_goi ls
       LEFT JOIN lich_hen lh ON lh.id = ls.lich_hen_id
       LEFT JOIN chuyen_gia cg ON cg.id = lh.chuyen_gia_id
       LEFT JOIN tai_khoan tk ON tk.id = cg.tai_khoan_id
       WHERE ls.goi_da_mua_id = ?
       ORDER BY ls.tao_luc DESC`,
      [purchaseId],
    );
    return rows;
  }

  async renewPackage(accountId: number | undefined, purchaseId: number) {
    const purchase = await this.assertPackagePurchase(accountId, purchaseId);
    return this.createPackagePurchase(accountId, { goi_dich_vu_id: purchase.goi_dich_vu_id });
  }

  private async assertExpertInPackagePurchase(
    accountId: number | undefined,
    purchaseId: number,
    expertId: number,
  ) {
    const purchase = await this.assertBookablePackagePurchase(accountId, purchaseId);
    const [mapping] = await this.dataSource.query(
      `SELECT gdcg.*, cg.nhan_booking, cg.trang_thai AS expert_status
       FROM goi_dich_vu_chuyen_gia gdcg
       JOIN chuyen_gia cg ON cg.id = gdcg.chuyen_gia_id
       WHERE gdcg.goi_dich_vu_id = ? AND gdcg.chuyen_gia_id = ?`,
      [purchase.goi_dich_vu_id, expertId],
    );
    if (!mapping || mapping.trang_thai !== 'hoat_dong') {
      throw new BadRequestException('Chuyen gia khong thuoc goi da mua');
    }
    if (mapping.expert_status !== 'hoat_dong' || !mapping.nhan_booking) {
      throw new BadRequestException('Chuyen gia tam thoi khong nhan lich');
    }
    return purchase;
  }

  async listExpertsByPackagePurchase(accountId: number | undefined, purchaseId: number, query: Dict) {
    const purchase = await this.assertBookablePackagePurchase(accountId, purchaseId);
    const where = [
      'gdcg.goi_dich_vu_id = ?',
      "gdcg.trang_thai = 'hoat_dong'",
      "cg.trang_thai = 'hoat_dong'",
      'cg.nhan_booking = 1',
    ];
    const params: unknown[] = [purchase.goi_dich_vu_id];

    if (query.search) {
      where.push('(tk.ho_ten LIKE ? OR cg.chuyen_mon LIKE ?)');
      params.push(`%${query.search}%`, `%${query.search}%`);
    }

    const rows = await this.dataSource.query(
      `SELECT cg.id AS expert_id, tk.ho_ten, tk.email, cg.anh_dai_dien_url, cg.chuyen_mon, cg.mo_ta,
              cg.diem_danh_gia_trung_binh, cg.so_luot_danh_gia, cg.so_booking_hoan_thanh, cg.nhan_booking
       FROM goi_dich_vu_chuyen_gia gdcg
       JOIN chuyen_gia cg ON cg.id = gdcg.chuyen_gia_id
       JOIN tai_khoan tk ON tk.id = cg.tai_khoan_id
       WHERE ${where.join(' AND ')}
       ORDER BY cg.diem_danh_gia_trung_binh DESC, cg.so_booking_hoan_thanh DESC`,
      params,
    );
    return rows;
  }

  async getExpertDetail(expertId: number) {
    const [expert] = await this.dataSource.query(
      `SELECT cg.id, tk.ho_ten, tk.email, cg.anh_dai_dien_url, cg.chuyen_mon, cg.mo_ta, cg.kinh_nghiem,
              cg.hoc_vi, cg.chung_chi, cg.diem_danh_gia_trung_binh, cg.so_luot_danh_gia, cg.so_booking_hoan_thanh,
              cg.nhan_booking
       FROM chuyen_gia cg
       JOIN tai_khoan tk ON tk.id = cg.tai_khoan_id
       WHERE cg.id = ? AND cg.trang_thai = 'hoat_dong'`,
      [expertId],
    );
    if (!expert) throw new NotFoundException('Khong tim thay chuyen gia');

    const reviews = await this.dataSource.query(
      `SELECT dg.id, dg.diem, dg.noi_dung, dg.tao_luc, tk.ho_ten AS customer_name
       FROM danh_gia dg
       JOIN tai_khoan tk ON tk.id = dg.tai_khoan_id
       WHERE dg.chuyen_gia_id = ? AND dg.trang_thai = 'hien_thi'
       ORDER BY dg.tao_luc DESC LIMIT 20`,
      [expertId],
    );

    return { ...expert, reviews };
  }

  async getExpertAvailability(accountId: number | undefined, expertId: number, purchaseId: number, query: Dict) {
    await this.assertExpertInPackagePurchase(accountId, purchaseId, expertId);
    const days = Math.min(14, Math.max(1, toNumber(query.days, 7)));
    const from = query.from ? new Date(query.from) : new Date();
    if (Number.isNaN(from.getTime())) throw new BadRequestException('Ngay bat dau khong hop le');

    const [packagePurchase] = await this.dataSource.query('SELECT thoi_luong_tu_van_phut FROM goi_dich_vu gdv JOIN goi_da_mua gdm ON gdm.goi_dich_vu_id = gdv.id WHERE gdm.id = ?', [purchaseId]);
    const duration = Math.max(15, toNumber(packagePurchase?.thoi_luong_tu_van_phut, 30));

    const workSlots = await this.dataSource.query(
      `SELECT * FROM lich_lam_viec_chuyen_gia
       WHERE chuyen_gia_id = ? AND trang_thai = 'hoat_dong'`,
      [expertId],
    );

    const end = plusDays(from, days + 1);
    const bookings = await this.dataSource.query(
      `SELECT bat_dau_luc, ket_thuc_luc, trang_thai
       FROM lich_hen
       WHERE chuyen_gia_id = ? AND bat_dau_luc < ? AND ket_thuc_luc > ?
         AND trang_thai IN ('cho_xac_nhan', 'cho_thanh_toan', 'da_xac_nhan', 'da_checkin', 'dang_tu_van')`,
      [expertId, end, from],
    );

    const blocked = await this.dataSource.query(
      `SELECT bat_dau_luc, ket_thuc_luc FROM lich_ban_chuyen_gia WHERE chuyen_gia_id = ? AND bat_dau_luc < ? AND ket_thuc_luc > ?`,
      [expertId, end, from],
    );

    const busyRanges = [...bookings, ...blocked].map((row: Dict) => ({
      start: new Date(row.bat_dau_luc).getTime(),
      end: new Date(row.ket_thuc_luc).getTime(),
    }));

    const slots: Array<{ start_at: string; end_at: string; date: string; start_time: string; end_time: string }> = [];
    for (let i = 0; i < days; i += 1) {
      const date = plusDays(from, i);
      const weekday = toWeekday(date);
      const daySlots = workSlots.filter((slot: Dict) => Number(slot.thu_trong_tuan) === weekday);

      for (const slot of daySlots) {
        const [startH, startM] = String(slot.gio_bat_dau).split(':').map(Number);
        const [endH, endM] = String(slot.gio_ket_thuc).split(':').map(Number);
        let cursor = new Date(date);
        cursor.setHours(startH, startM, 0, 0);
        const endTime = new Date(date);
        endTime.setHours(endH, endM, 0, 0);

        while (cursor.getTime() + duration * 60 * 1000 <= endTime.getTime()) {
          const candidateStart = cursor.getTime();
          const candidateEnd = candidateStart + duration * 60 * 1000;
          const isBusy = busyRanges.some((range) => candidateStart < range.end && candidateEnd > range.start);
          if (!isBusy && candidateStart > Date.now()) {
            const startAt = new Date(candidateStart);
            const endAt = new Date(candidateEnd);
            slots.push({
              start_at: startAt.toISOString(),
              end_at: endAt.toISOString(),
              date: formatDateOnly(startAt),
              start_time: startAt.toTimeString().slice(0, 5),
              end_time: endAt.toTimeString().slice(0, 5),
            });
          }
          cursor = new Date(cursor.getTime() + duration * 60 * 1000);
        }
      }
    }

    return { duration_minutes: duration, from: from.toISOString(), days, slots };
  }

  async createBooking(accountId: number | undefined, body: Dict, headerIdempotencyKey?: string) {
    const userId = await this.assertAccount(accountId);
    const purchaseId = toNumber(body.package_purchase_id);
    const expertId = toNumber(body.expert_id);
    const startAtRaw = body.start_at;

    if (!purchaseId || !expertId || !startAtRaw) {
      throw new BadRequestException('Thieu thong tin dat lich');
    }
    const idempotencyKey = String(body.idempotency_key ?? headerIdempotencyKey ?? '').trim();
    if (idempotencyKey.length > 120) throw new BadRequestException('Idempotency key qua dai');

    const purchase = await this.assertExpertInPackagePurchase(userId, purchaseId, expertId);
    const startAt = new Date(String(startAtRaw));
    if (Number.isNaN(startAt.getTime())) throw new BadRequestException('Thoi gian bat dau khong hop le');

    const duration = Math.max(15, toNumber(purchase.thoi_luong_tu_van_phut, 30));
    const endAt = new Date(startAt.getTime() + duration * 60 * 1000);

    return this.dataSource.transaction(async (manager) => {
      if (idempotencyKey) {
        const duplicate = await manager.query(
          `SELECT bt.lich_hen_id
           FROM booking_timeline bt
           JOIN lich_hen lh ON lh.id = bt.lich_hen_id
           WHERE lh.tai_khoan_id = ?
             AND bt.su_kien = 'customer_create_booking'
             AND JSON_UNQUOTE(JSON_EXTRACT(bt.metadata, '$.idempotency_key')) = ?
           ORDER BY bt.id DESC
           LIMIT 1`,
          [userId, idempotencyKey],
        );
        if (duplicate.length) {
          return this.getBookingDetail(userId, Number(duplicate[0].lich_hen_id));
        }
      }

      const [lockedPurchase] = await manager.query('SELECT * FROM goi_da_mua WHERE id = ? FOR UPDATE', [purchaseId]);
      if (!lockedPurchase) throw new NotFoundException('Khong tim thay goi da mua');
      if (this.purchaseRuntimeStatus(lockedPurchase) !== 'dang_hieu_luc') {
        throw new BadRequestException('Goi da mua khong con hieu luc');
      }

      const clash = await manager.query(
        `SELECT id FROM lich_hen
         WHERE (tai_khoan_id = ? OR chuyen_gia_id = ?)
           AND bat_dau_luc < ? AND ket_thuc_luc > ?
           AND trang_thai IN ('cho_xac_nhan', 'cho_thanh_toan', 'da_xac_nhan', 'da_checkin', 'dang_tu_van')
         LIMIT 1`,
        [userId, expertId, endAt, startAt],
      );
      if (clash.length) throw new BadRequestException('Khung gio da duoc dat');

      const [expert] = await manager.query('SELECT * FROM chuyen_gia WHERE id = ? FOR UPDATE', [expertId]);
      if (!expert || expert.trang_thai !== 'hoat_dong' || !expert.nhan_booking) {
        throw new BadRequestException('Chuyen gia khong san sang nhan lich');
      }

      const weekday = toWeekday(startAt);
      const startTime = startAt.toTimeString().slice(0, 8);
      const endTime = endAt.toTimeString().slice(0, 8);
      const workSlot = await manager.query(
        `SELECT id FROM lich_lam_viec_chuyen_gia
         WHERE chuyen_gia_id = ?
           AND thu_trong_tuan = ?
           AND trang_thai = 'hoat_dong'
           AND gio_bat_dau <= ?
           AND gio_ket_thuc >= ?
         LIMIT 1`,
        [expertId, weekday, startTime, endTime],
      );
      if (!workSlot.length) {
        throw new BadRequestException('Khung gio khong nam trong lich lam viec cua chuyen gia');
      }

      const blockedAt = await manager.query(
        `SELECT id FROM lich_ban_chuyen_gia
         WHERE chuyen_gia_id = ?
           AND bat_dau_luc < ?
           AND ket_thuc_luc > ?
         LIMIT 1`,
        [expertId, endAt, startAt],
      );
      if (blockedAt.length) {
        throw new BadRequestException('Chuyen gia khong kha dung trong khung gio nay');
      }

      const bookingCode = makeCode('LH').slice(0, 80);
      const now = new Date();
      const result = await manager.query(
        `INSERT INTO lich_hen
        (ma_lich_hen, tai_khoan_id, chuyen_gia_id, goi_dich_vu_id, goi_da_mua_id, thanh_toan_id,
         muc_dich, ghi_chu_customer, ngay_hen, gio_bat_dau, gio_ket_thuc, bat_dau_luc, ket_thuc_luc,
         trang_thai, giu_cho_den_luc, ly_do_huy, huy_boi, huy_luc, hoan_thanh_luc, tao_luc, cap_nhat_luc)
        VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, 'cho_xac_nhan', NULL, NULL, NULL, NULL, NULL, ?, ?)`,
        [
          bookingCode,
          userId,
          expertId,
          purchase.goi_dich_vu_id,
          purchaseId,
          body.muc_dich ?? null,
          body.ghi_chu_ban_dau ?? body.ghi_chu_customer ?? null,
          formatDateOnly(startAt),
          startAt.toTimeString().slice(0, 8),
          endAt.toTimeString().slice(0, 8),
          startAt,
          endAt,
          now,
          now,
        ],
      );

      await manager.query(
        'INSERT INTO booking_timeline (lich_hen_id, actor_id, su_kien, trang_thai_truoc, trang_thai_sau, ghi_chu, metadata, tao_luc) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          result.insertId,
          userId,
          'customer_create_booking',
          null,
          'cho_xac_nhan',
          body.muc_dich ?? null,
          JSON.stringify({ package_purchase_id: purchaseId, expert_id: expertId, idempotency_key: idempotencyKey || null }),
          now,
        ],
      );

      await manager.query(
        `INSERT INTO lich_su_su_dung_goi (goi_da_mua_id, lich_hen_id, loai_su_kien, so_luot_thay_doi, so_luot_con_lai_sau, ghi_chu, tao_luc)
         VALUES (?, ?, 'giu_luot', 0, ?, ?, ?)`,
        [purchaseId, result.insertId, lockedPurchase.so_luot_con_lai, 'Dat lich thanh cong', now],
      );

      await manager.query(
        `INSERT INTO thong_bao (tai_khoan_id, nguoi_gui_id, loai, tieu_de, noi_dung, trang_thai, duong_dan_hanh_dong, entity_type, entity_id, tao_luc, doc_luc, cap_nhat_luc)
         VALUES (?, ?, 'booking', 'Booking moi tu khach hang', ?, 'chua_doc', ?, 'lich_hen', ?, ?, NULL, ?)`,
        [expert.tai_khoan_id, userId, `Khach hang vua dat lich ${bookingCode}`, `/nutritionist/bookings`, result.insertId, now, now],
      );

      return this.getBookingDetail(userId, result.insertId);
    });
  }

  async getBookingDetail(accountId: number | undefined, bookingId: number) {
    const userId = await this.assertAccount(accountId);
    const [booking] = await this.dataSource.query(
      `SELECT lh.*, gdv.ten_goi, tk.ho_ten AS expert_name, tk.email AS expert_email
       FROM lich_hen lh
       JOIN goi_dich_vu gdv ON gdv.id = lh.goi_dich_vu_id
       JOIN chuyen_gia cg ON cg.id = lh.chuyen_gia_id
       JOIN tai_khoan tk ON tk.id = cg.tai_khoan_id
       WHERE lh.id = ? AND lh.tai_khoan_id = ?`,
      [bookingId, userId],
    );
    if (!booking) throw new NotFoundException('Khong tim thay booking cua khach hang');

    const timeline = await this.dataSource.query(
      'SELECT * FROM booking_timeline WHERE lich_hen_id = ? ORDER BY tao_luc ASC',
      [bookingId],
    );
    const payment = await this.dataSource.query(
      `SELECT * FROM thanh_toan WHERE loai_thanh_toan = 'booking' AND doi_tuong_id = ? ORDER BY tao_luc DESC LIMIT 1`,
      [bookingId],
    );

    return { booking, timeline, payment: payment[0] ?? null };
  }

  async createPackagePayment(accountId: number | undefined, body: Dict) {
    const userId = await this.assertAccount(accountId);
    const purchaseId = toNumber(body.package_purchase_id ?? body.goi_da_mua_id);
    const purchase = await this.assertPackagePurchase(userId, purchaseId);
    if (purchase.trang_thai === 'da_hoan_tien') {
      throw new BadRequestException('Goi da hoan tien, khong the tao thanh toan');
    }

    return this.dataSource.transaction(async (manager) => {
      const [locked] = await manager.query('SELECT * FROM goi_da_mua WHERE id = ? FOR UPDATE', [purchaseId]);
      if (!locked) throw new NotFoundException('Khong tim thay goi da mua');

      const existing = await manager.query(
        `SELECT * FROM thanh_toan
         WHERE tai_khoan_id = ? AND loai_thanh_toan = 'mua_goi' AND doi_tuong_id = ?
           AND trang_thai IN ('khoi_tao', 'cho_thanh_toan')
         ORDER BY tao_luc DESC LIMIT 1`,
        [userId, purchaseId],
      );
      if (existing.length) {
        return {
          payment_id: existing[0].id,
          payment_url: existing[0].payment_url,
          txn_ref: existing[0].txn_ref,
          status: existing[0].trang_thai,
        };
      }

      const [pkg] = await manager.query('SELECT ten_goi FROM goi_dich_vu WHERE id = ?', [locked.goi_dich_vu_id]);
      const payment = await this.createPaymentRecord(
        manager,
        userId,
        'mua_goi',
        purchaseId,
        Number(locked.gia_mua),
        `Thanh toan mua goi ${pkg?.ten_goi ?? ''}`,
      );
      return {
        payment_id: payment.id,
        payment_url: payment.payment_url,
        txn_ref: payment.txn_ref,
        status: payment.trang_thai,
      };
    });
  }

  async createBookingPayment(accountId: number | undefined, body: Dict) {
    const userId = await this.assertAccount(accountId);
    const bookingId = toNumber(body.booking_id ?? body.lich_hen_id);
    if (!bookingId) throw new BadRequestException('Thieu booking id');

    return this.dataSource.transaction(async (manager) => {
      const [booking] = await manager.query(
        'SELECT * FROM lich_hen WHERE id = ? AND tai_khoan_id = ? FOR UPDATE',
        [bookingId, userId],
      );
      if (!booking) throw new NotFoundException('Khong tim thay booking');
      if (!['cho_xac_nhan', 'cho_thanh_toan'].includes(booking.trang_thai)) {
        throw new BadRequestException('Booking khong o trang thai thanh toan');
      }

      const existing = await manager.query(
        `SELECT * FROM thanh_toan
         WHERE tai_khoan_id = ? AND loai_thanh_toan = 'booking' AND doi_tuong_id = ?
           AND trang_thai IN ('khoi_tao', 'cho_thanh_toan')
         ORDER BY tao_luc DESC LIMIT 1`,
        [userId, bookingId],
      );
      if (existing.length) {
        return {
          payment_id: existing[0].id,
          payment_url: existing[0].payment_url,
          txn_ref: existing[0].txn_ref,
          status: existing[0].trang_thai,
        };
      }

      const amount = toNumber(body.amount, 50000);
      const payment = await this.createPaymentRecord(
        manager,
        userId,
        'booking',
        bookingId,
        amount,
        `Thanh toan booking ${booking.ma_lich_hen}`,
      );
      await manager.query('UPDATE lich_hen SET trang_thai = ?, cap_nhat_luc = ? WHERE id = ?', [
        'cho_thanh_toan',
        new Date(),
        bookingId,
      ]);
      return {
        payment_id: payment.id,
        payment_url: payment.payment_url,
        txn_ref: payment.txn_ref,
        status: payment.trang_thai,
      };
    });
  }

  async listPayments(accountId: number | undefined, query: Dict) {
    const userId = await this.assertAccount(accountId);
    const where = ['tt.tai_khoan_id = ?'];
    const params: unknown[] = [userId];

    if (query.type) {
      where.push('tt.loai_thanh_toan = ?');
      params.push(query.type);
    }
    if (query.status) {
      where.push('tt.trang_thai = ?');
      params.push(query.status);
    }

    return this.dataSource.query(
      `SELECT tt.*
       FROM thanh_toan tt
       WHERE ${where.join(' AND ')}
       ORDER BY tt.tao_luc DESC`,
      params,
    );
  }

  async getPayment(accountId: number | undefined, paymentId: number) {
    const userId = await this.assertAccount(accountId);
    const [payment] = await this.dataSource.query(
      `SELECT * FROM thanh_toan WHERE id = ? AND tai_khoan_id = ?`,
      [paymentId, userId],
    );
    if (!payment) throw new NotFoundException('Khong tim thay giao dich');

    const webhooks = await this.dataSource.query(
      `SELECT id, loai_webhook, hop_le, tao_luc FROM payment_webhook_log WHERE thanh_toan_id = ? ORDER BY tao_luc DESC`,
      [paymentId],
    );
    return { ...payment, webhooks };
  }

  async processPaymentWebhook(kind: 'return' | 'ipn', payload: Dict) {
    const txnRef = String(payload.vnp_TxnRef ?? payload.txn_ref ?? '').trim();
    if (!txnRef) throw new BadRequestException('Thieu txn_ref');

    const valid = kind === 'ipn' ? verifyIpnSignature(payload as Record<string, string>) : verifyReturnSignature(payload as Record<string, string>);
    const success = valid && isVnpaySuccess(String(payload.vnp_TransactionStatus ?? payload.vnp_ResponseCode ?? ''));
    const amount = toNumber(payload.vnp_Amount, 0) / 100;

    return this.dataSource.transaction(async (manager) => {
      const [payment] = await manager.query('SELECT * FROM thanh_toan WHERE txn_ref = ? FOR UPDATE', [txnRef]);
      if (!payment) {
        await manager.query(
          'INSERT INTO payment_webhook_log (thanh_toan_id, txn_ref, loai_webhook, hop_le, payload, ket_qua_xu_ly, tao_luc) VALUES (NULL, ?, ?, ?, ?, ?, ?)',
          [txnRef, kind, valid ? 1 : 0, JSON.stringify(payload), JSON.stringify({ message: 'transaction_not_found' }), new Date()],
        );
        return { ok: false, message: 'Khong tim thay transaction' };
      }

      let resultMessage = 'ignored';
      if (!valid) {
        resultMessage = 'invalid_signature';
      } else if (amount > 0 && Number(payment.so_tien) !== amount) {
        resultMessage = 'amount_mismatch';
      } else if (payment.trang_thai === 'thanh_cong') {
        resultMessage = 'already_success';
      } else {
        const nextStatus = success ? 'thanh_cong' : 'that_bai';
        await manager.query(
          'UPDATE thanh_toan SET trang_thai = ?, gateway_transaction_no = ?, raw_response = ?, thanh_toan_luc = ?, cap_nhat_luc = ? WHERE id = ?',
          [
            nextStatus,
            payload.vnp_TransactionNo ?? null,
            JSON.stringify(payload),
            success ? new Date() : null,
            new Date(),
            payment.id,
          ],
        );

        if (success) {
          if (payment.loai_thanh_toan === 'mua_goi') {
            const [purchase] = await manager.query('SELECT * FROM goi_da_mua WHERE id = ? FOR UPDATE', [payment.doi_tuong_id]);
            if (purchase) {
              const startAt = purchase.bat_dau_luc ? new Date(purchase.bat_dau_luc) : new Date();
              const [pkg] = await manager.query('SELECT thoi_han_ngay, ten_goi FROM goi_dich_vu WHERE id = ?', [purchase.goi_dich_vu_id]);
              const expiredAt = plusDays(startAt, toNumber(pkg?.thoi_han_ngay, 30));
              await manager.query(
                `UPDATE goi_da_mua
                 SET trang_thai = 'dang_hieu_luc', bat_dau_luc = ?, het_han_luc = ?, cap_nhat_luc = ?
                 WHERE id = ?`,
                [startAt, expiredAt, new Date(), purchase.id],
              );
              // Thông báo customer: mua gói thành công
              await manager.query(
                `INSERT INTO thong_bao (tai_khoan_id,nguoi_gui_id,loai,tieu_de,noi_dung,trang_thai,duong_dan_hanh_dong,entity_type,entity_id,tao_luc,doc_luc,cap_nhat_luc)
                 VALUES (?,NULL,'payment','Mua goi thanh cong',?,'chua_doc',?,'goi_da_mua',?,?,NULL,?)`,
                [payment.tai_khoan_id,
                 `Goi "${pkg?.ten_goi ?? ''}" da duoc kich hoat. Han su dung den ${expiredAt.toLocaleDateString('vi-VN')}.`,
                 `/user/my-packages`, purchase.id, new Date(), new Date()],
              );
            }
          }

          if (payment.loai_thanh_toan === 'booking') {
            const [booking] = await manager.query('SELECT * FROM lich_hen WHERE id = ? FOR UPDATE', [payment.doi_tuong_id]);
            if (booking) {
              await manager.query(
                `UPDATE lich_hen SET thanh_toan_id = ?, trang_thai = 'da_xac_nhan', cap_nhat_luc = ? WHERE id = ?`,
                [payment.id, new Date(), booking.id],
              );
              await manager.query(
                `INSERT INTO booking_timeline (lich_hen_id, actor_id, su_kien, trang_thai_truoc, trang_thai_sau, ghi_chu, metadata, tao_luc)
                 VALUES (?, NULL, 'payment_success', ?, 'da_xac_nhan', NULL, ?, ?)`,
                [booking.id, booking.trang_thai, JSON.stringify({ payment_id: payment.id }), new Date()],
              );
              // Thông báo customer: thanh toán booking thành công
              await manager.query(
                `INSERT INTO thong_bao (tai_khoan_id,nguoi_gui_id,loai,tieu_de,noi_dung,trang_thai,duong_dan_hanh_dong,entity_type,entity_id,tao_luc,doc_luc,cap_nhat_luc)
                 VALUES (?,NULL,'payment','Thanh toan lich hen thanh cong',?,'chua_doc',?,'lich_hen',?,?,NULL,?)`,
                [payment.tai_khoan_id,
                 `Thanh toan cho lich hen ${booking.ma_lich_hen} thanh cong. Lich hen da duoc xac nhan.`,
                 `/user/bookings/${booking.id}`, booking.id, new Date(), new Date()],
              );
            }
          }
        }

        resultMessage = success ? 'updated_success' : 'updated_failed';
        // Thông báo customer khi thanh toán thất bại
        if (!success) {
          const label = payment.loai_thanh_toan === 'mua_goi' ? 'mua goi dich vu' : 'lich hen';
          await manager.query(
            `INSERT INTO thong_bao (tai_khoan_id,nguoi_gui_id,loai,tieu_de,noi_dung,trang_thai,duong_dan_hanh_dong,entity_type,entity_id,tao_luc,doc_luc,cap_nhat_luc)
             VALUES (?,NULL,'payment','Thanh toan that bai',?,'chua_doc',?,'thanh_toan',?,?,NULL,?)`,
            [payment.tai_khoan_id,
             `Thanh toan ${label} that bai. Vui long thu lai hoac lien he ho tro.`,
             `/user/payments`, payment.id, new Date(), new Date()],
          );
          if (payment.loai_thanh_toan === 'mua_goi') {
            const [purchase] = await manager.query(
              'SELECT * FROM goi_da_mua WHERE id = ? FOR UPDATE',
              [payment.doi_tuong_id],
            );
            if (purchase && purchase.trang_thai === 'cho_thanh_toan') {
              await manager.query('DELETE FROM goi_da_mua WHERE id = ?', [purchase.id]);
              resultMessage = 'updated_failed_rolled_back';
            }
          }
        }
      }

      await manager.query(
        'INSERT INTO payment_webhook_log (thanh_toan_id, txn_ref, loai_webhook, hop_le, payload, ket_qua_xu_ly, tao_luc) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [payment.id, txnRef, kind, valid ? 1 : 0, JSON.stringify(payload), JSON.stringify({ success, resultMessage }), new Date()],
      );

      return { ok: true, success, message: resultMessage };
    });
  }

  async getNotificationSummary(accountId?: number) {
    if (!accountId) return { total: 0, unread: 0, latest: [] };
    const [summary] = await this.dataSource.query(
      "SELECT COUNT(*) AS total, SUM(CASE WHEN trang_thai='chua_doc' THEN 1 ELSE 0 END) AS unread FROM thong_bao WHERE tai_khoan_id = ?",
      [accountId]
    );
    const latest = await this.dataSource.query(
      'SELECT * FROM thong_bao WHERE tai_khoan_id = ? ORDER BY tao_luc DESC LIMIT 5',
      [accountId]
    );
    return {
      total: Number(summary.total ?? 0),
      unread: Number(summary.unread ?? 0),
      latest
    };
  }

  async listNotifications(accountId: number | undefined, query: Dict) {
    if (!accountId) throw new UnauthorizedException('Ban chua dang nhap');
    const where = ['tai_khoan_id = ?'];
    const params: unknown[] = [accountId];
    if (query.status) {
      where.push('trang_thai = ?');
      params.push(query.status);
    }
    if (query.type) {
      where.push('loai = ?');
      params.push(query.type);
    }
    return this.dataSource.query(`SELECT * FROM thong_bao WHERE ${where.join(' AND ')} ORDER BY tao_luc DESC`, params);
  }

  async markNotificationRead(accountId: number | undefined, notificationId: number) {
    if (!accountId) throw new UnauthorizedException('Ban chua dang nhap');
    await this.dataSource.query(
      "UPDATE thong_bao SET trang_thai='da_doc', doc_luc=COALESCE(doc_luc, ?), cap_nhat_luc=? WHERE id=? AND tai_khoan_id=?",
      [new Date(), new Date(), notificationId, accountId]
    );
    return { ok: true };
  }

  async markAllNotificationsRead(accountId?: number) {
    if (!accountId) throw new UnauthorizedException('Ban chua dang nhap');
    await this.dataSource.query(
      "UPDATE thong_bao SET trang_thai='da_doc', doc_luc=COALESCE(doc_luc, ?), cap_nhat_luc=? WHERE tai_khoan_id=? AND trang_thai='chua_doc'",
      [new Date(), new Date(), accountId]
    );
    return { ok: true };
  }

  private async assertBooking(accountId: number | undefined, bookingId: number) {
    if (!accountId) throw new UnauthorizedException('Ban chua dang nhap');
    const [booking] = await this.dataSource.query(
      `SELECT lh.*,
              expert_account.id AS expert_account_id,
              expert_account.ho_ten AS expert_name,
              gdv.ten_goi, gdv.loai_goi,
              gdv.thoi_luong_tu_van_phut
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
    const booking = await this.assertBooking(accountId, bookingId);
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
    const booking = await this.assertBooking(accountId, bookingId);
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
      identity: `customer:${accountId}`,
      name: String(booking.customer_name ?? `customer-${accountId}`),
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
        accountId,
        'call_token_created',
        booking.trang_thai ?? null,
        booking.trang_thai ?? null,
        'Customer tao token vao phong goi video',
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
    if (!CHAT_SEND_ALLOWED_STATUSES.has(String(booking.trang_thai))) {
      throw new BadRequestException('Booking hien khong cho phep gui tin nhan');
    }
    const content = String(body.noi_dung ?? body.content ?? '').trim();
    if (!content) throw new BadRequestException('Vui long nhap tin nhan');

    const now = new Date();
    const result = await this.dataSource.query(
      'INSERT INTO tin_nhan (lich_hen_id, nguoi_gui_id, loai, noi_dung, tep_dinh_kem, da_doc_luc, da_doc_boi_id, tao_luc, cap_nhat_luc) VALUES (?, ?, ?, ?, NULL, NULL, NULL, ?, ?)',
      [bookingId, accountId, 'text', content, now, now],
    );
    await this.dataSource.query(
      'INSERT INTO thong_bao (tai_khoan_id, nguoi_gui_id, loai, tieu_de, noi_dung, trang_thai, duong_dan_hanh_dong, entity_type, entity_id, tao_luc, doc_luc, cap_nhat_luc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)',
      [
        booking.expert_account_id,
        accountId,
        'message',
        'Khach hang gui tin nhan moi',
        content.slice(0, 180),
        'chua_doc',
        `/nutritionist/chats/${bookingId}`,
        'lich_hen',
        bookingId,
        now,
        now,
      ],
    );

    const [message] = await this.dataSource.query(
      `SELECT msg.*, tk.ho_ten AS sender_name, tk.vai_tro AS sender_role
       FROM tin_nhan msg JOIN tai_khoan tk ON tk.id = msg.nguoi_gui_id
       WHERE msg.id = ?`,
      [result.insertId],
    );
    if (message) {
      this.chatGateway.emitMessageCreated(bookingId, {
        ...message,
        tep_dinh_kem: parseJson(message.tep_dinh_kem),
      });
    }
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

  // ─── 06: Quản lý booking ───

  async listBookings(accountId: number | undefined, query: Dict) {
    const userId = await this.assertAccount(accountId);
    const where = ['lh.tai_khoan_id = ?'];
    const params: unknown[] = [userId];

    if (query.status) {
      where.push('lh.trang_thai = ?');
      params.push(query.status);
    }
    if (query.search) {
      where.push('(lh.ma_lich_hen LIKE ? OR tk.ho_ten LIKE ? OR gdv.ten_goi LIKE ?)');
      params.push(`%${query.search}%`, `%${query.search}%`, `%${query.search}%`);
    }

    const rows = await this.dataSource.query(
      `SELECT lh.id, lh.ma_lich_hen, lh.ngay_hen, lh.gio_bat_dau, lh.gio_ket_thuc,
              lh.bat_dau_luc, lh.ket_thuc_luc, lh.trang_thai, lh.muc_dich, lh.ly_do_huy,
              lh.hoan_thanh_luc, lh.tao_luc,
              gdv.ten_goi, gdv.loai_goi,
              cg.id AS chuyen_gia_id, tk.ho_ten AS expert_name, cg.anh_dai_dien_url,
              tt.so_tien AS thanh_toan_so_tien, tt.trang_thai AS thanh_toan_trang_thai,
              EXISTS(SELECT 1 FROM danh_gia dg WHERE dg.lich_hen_id = lh.id AND dg.tai_khoan_id = lh.tai_khoan_id) AS da_danh_gia
       FROM lich_hen lh
       JOIN goi_dich_vu gdv ON gdv.id = lh.goi_dich_vu_id
       JOIN chuyen_gia cg ON cg.id = lh.chuyen_gia_id
       JOIN tai_khoan tk ON tk.id = cg.tai_khoan_id
       LEFT JOIN thanh_toan tt ON tt.id = lh.thanh_toan_id
       WHERE ${where.join(' AND ')}
       ORDER BY lh.bat_dau_luc DESC`,
      params,
    );
    return rows.map((r: Dict) => ({ ...r, da_danh_gia: !!r.da_danh_gia }));
  }

  async rescheduleBooking(accountId: number | undefined, bookingId: number, body: Dict) {
    const booking = await this.assertBooking(accountId, bookingId);
    if (!['cho_xac_nhan', 'da_xac_nhan'].includes(booking.trang_thai)) {
      throw new BadRequestException('Chi co the doi lich khi booking dang cho xac nhan hoac da xac nhan');
    }

    const newStartAtRaw = body.start_at;
    if (!newStartAtRaw) throw new BadRequestException('Thieu thoi gian moi');
    const newStartAt = new Date(String(newStartAtRaw));
    if (Number.isNaN(newStartAt.getTime())) throw new BadRequestException('Thoi gian khong hop le');
    if (newStartAt.getTime() <= Date.now()) throw new BadRequestException('Thoi gian moi phai trong tuong lai');

    // thoi_luong_tu_van_phut gia tri lay tu assertBooking (da JOIN vao gdv)
    const duration = Math.max(15, toNumber(booking.thoi_luong_tu_van_phut, 30));
    const newEndAt = new Date(newStartAt.getTime() + duration * 60 * 1000);

    return this.dataSource.transaction(async (manager) => {
      const clash = await manager.query(
        `SELECT id FROM lich_hen
         WHERE (tai_khoan_id = ? OR chuyen_gia_id = ?)
           AND id <> ?
           AND bat_dau_luc < ? AND ket_thuc_luc > ?
           AND trang_thai IN ('cho_xac_nhan','cho_thanh_toan','da_xac_nhan','da_checkin','dang_tu_van')
         LIMIT 1`,
        [booking.tai_khoan_id, booking.chuyen_gia_id, bookingId, newEndAt, newStartAt],
      );
      if (clash.length) throw new BadRequestException('Khung gio moi da duoc dat');

      const weekday = toWeekday(newStartAt);
      const startTime = newStartAt.toTimeString().slice(0, 8);
      const endTime = newEndAt.toTimeString().slice(0, 8);
      const workSlot = await manager.query(
        `SELECT id FROM lich_lam_viec_chuyen_gia
         WHERE chuyen_gia_id = ? AND thu_trong_tuan = ? AND trang_thai = 'hoat_dong'
           AND gio_bat_dau <= ? AND gio_ket_thuc >= ? LIMIT 1`,
        [booking.chuyen_gia_id, weekday, startTime, endTime],
      );
      if (!workSlot.length) throw new BadRequestException('Khung gio ngoai lich lam viec cua chuyen gia');

      const now = new Date();
      await manager.query(
        `UPDATE lich_hen SET ngay_hen=?, gio_bat_dau=?, gio_ket_thuc=?, bat_dau_luc=?, ket_thuc_luc=?,
                trang_thai='cho_xac_nhan', cap_nhat_luc=? WHERE id=?`,
        [formatDateOnly(newStartAt), newStartAt.toTimeString().slice(0,8), newEndAt.toTimeString().slice(0,8),
         newStartAt, newEndAt, now, bookingId],
      );
      await manager.query(
        `INSERT INTO booking_timeline (lich_hen_id,actor_id,su_kien,trang_thai_truoc,trang_thai_sau,ghi_chu,metadata,tao_luc)
         VALUES (?,?,?,?,?,?,?,?)`,
        [bookingId, accountId, 'customer_reschedule', booking.trang_thai, 'cho_xac_nhan',
         body.ly_do ?? null, JSON.stringify({ old_start: booking.bat_dau_luc, new_start: newStartAt }), now],
      );
      await manager.query(
        `INSERT INTO thong_bao (tai_khoan_id,nguoi_gui_id,loai,tieu_de,noi_dung,trang_thai,duong_dan_hanh_dong,entity_type,entity_id,tao_luc,doc_luc,cap_nhat_luc)
         VALUES (?,?,'booking','Khach hang doi lich',?,'chua_doc',?,'lich_hen',?,?,NULL,?)`,
        [booking.expert_account_id, accountId,
         `Booking ${booking.ma_lich_hen} duoc doi sang ${formatDateOnly(newStartAt)}`,
         `/nutritionist/bookings`, bookingId, now, now],
      );
      return this.getBookingDetail(accountId, bookingId);
    });
  }

  async cancelBooking(accountId: number | undefined, bookingId: number, body: Dict) {
    const booking = await this.assertBooking(accountId, bookingId);
    const cancellable = ['cho_xac_nhan', 'cho_thanh_toan', 'da_xac_nhan'];
    if (!cancellable.includes(booking.trang_thai)) {
      throw new BadRequestException('Khong the huy booking o trang thai nay');
    }

    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
      await manager.query(
        `UPDATE lich_hen SET trang_thai='da_huy', ly_do_huy=?, huy_boi='customer', huy_luc=?, cap_nhat_luc=? WHERE id=?`,
        [body.ly_do ?? null, now, now, bookingId],
      );
      await manager.query(
        `INSERT INTO booking_timeline (lich_hen_id,actor_id,su_kien,trang_thai_truoc,trang_thai_sau,ghi_chu,metadata,tao_luc)
         VALUES (?,?,?,?,?,?,?,?)`,
        [bookingId, accountId, 'customer_cancel', booking.trang_thai, 'da_huy',
         body.ly_do ?? null, JSON.stringify({ cancelled_by: 'customer' }), now],
      );

      // Hoàn lượt cho gói
      // Hoàn lượt khi gói còn hiệu lực HOẶC hết lượt (het_luot) vì hủy booking
      // là trả lại đúng lượt đó — không hoàn nếu gói đã hết hạn/hoàn tiền/bị khóa
      const [purchase] = await manager.query(
        'SELECT * FROM goi_da_mua WHERE id = ? FOR UPDATE',
        [booking.goi_da_mua_id],
      );
      const refundableStatuses = ['dang_hieu_luc', 'het_luot'];
      const purchaseStatus = purchase ? this.purchaseRuntimeStatus(purchase) : null;
      if (purchase && refundableStatuses.includes(purchaseStatus as string)) {
        const newRemaining = toNumber(purchase.so_luot_con_lai) + 1;
        const newUsed = Math.max(0, toNumber(purchase.so_luot_da_dung) - 1);
        // Nếu gói đang het_luot và hoàn lượt → cập nhật lại status sang dang_hieu_luc
        const newStatus = purchaseStatus === 'het_luot' ? 'dang_hieu_luc' : purchase.trang_thai;
        await manager.query(
          'UPDATE goi_da_mua SET trang_thai=?, so_luot_da_dung=?, so_luot_con_lai=?, cap_nhat_luc=? WHERE id=?',
          [newStatus, newUsed, newRemaining, now, purchase.id],
        );
        await manager.query(
          `INSERT INTO lich_su_su_dung_goi (goi_da_mua_id,lich_hen_id,loai_su_kien,so_luot_thay_doi,so_luot_con_lai_sau,ghi_chu,tao_luc)
           VALUES (?,?,?,?,?,?,?)`,
          [purchase.id, bookingId, 'hoan_luot', 1, newRemaining, 'Huy booking - hoan luot', now],
        );
      }

      // Thông báo chuyên gia
      await manager.query(
        `INSERT INTO thong_bao (tai_khoan_id,nguoi_gui_id,loai,tieu_de,noi_dung,trang_thai,duong_dan_hanh_dong,entity_type,entity_id,tao_luc,doc_luc,cap_nhat_luc)
         VALUES (?,?,'booking','Khach hang huy lich',?,'chua_doc',?,'lich_hen',?,?,NULL,?)`,
        [booking.expert_account_id, accountId,
         `Booking ${booking.ma_lich_hen} da bi huy. Ly do: ${body.ly_do ?? 'Khong co'}`,
         `/nutritionist/bookings`, bookingId, now, now],
      );
      return { ok: true, message: 'Huy lich thanh cong. Luot da duoc hoan.' };
    });
  }

  async checkInBooking(accountId: number | undefined, bookingId: number) {
    const booking = await this.assertBooking(accountId, bookingId);
    if (booking.trang_thai !== 'da_xac_nhan') {
      throw new BadRequestException('Chi co the check-in booking da xac nhan');
    }
    const startAt = new Date(booking.bat_dau_luc);
    const diffMs = startAt.getTime() - Date.now();

    // Chưa đến giờ: chỉ được check-in trong vòng 15 phút trước
    if (diffMs > 15 * 60 * 1000) {
      throw new BadRequestException('Chi duoc check-in trong vong 15 phut truoc gio bat dau');
    }
    // Đã qua giờ: không được check-in sau 60 phút kể từ giờ hẹn
    if (diffMs < -60 * 60 * 1000) {
      throw new BadRequestException('Da qua 60 phut gio hen, booking bi bo lo - lien he chuyen gia de ho tro');
    }

    const now = new Date();
    await this.dataSource.query(
      `UPDATE lich_hen SET trang_thai='da_checkin', cap_nhat_luc=? WHERE id=?`,
      [now, bookingId],
    );
    await this.dataSource.query(
      `INSERT INTO booking_timeline (lich_hen_id,actor_id,su_kien,trang_thai_truoc,trang_thai_sau,ghi_chu,metadata,tao_luc)
       VALUES (?,?,?,?,?,NULL,NULL,?)`,
      [bookingId, accountId, 'customer_checkin', 'da_xac_nhan', 'da_checkin', now],
    );
    return this.getBookingDetail(accountId, bookingId);
  }

  // ─── 07: Đánh giá chuyên gia ───

  async createReview(accountId: number | undefined, body: Dict) {
    const userId = await this.assertAccount(accountId);
    const bookingId = toNumber(body.lich_hen_id ?? body.booking_id);
    if (!bookingId) throw new BadRequestException('Thieu booking_id');

    const [booking] = await this.dataSource.query(
      `SELECT * FROM lich_hen WHERE id = ? AND tai_khoan_id = ? AND trang_thai = 'hoan_thanh'`,
      [bookingId, userId],
    );
    if (!booking) throw new BadRequestException('Chi danh gia duoc booking da hoan thanh cua ban');

    const [existing] = await this.dataSource.query(
      'SELECT id FROM danh_gia WHERE lich_hen_id = ? AND tai_khoan_id = ?',
      [bookingId, userId],
    );
    if (existing) throw new ConflictException('Ban da danh gia booking nay roi');

    const diem = toNumber(body.diem);
    if (diem < 1 || diem > 5) throw new BadRequestException('Diem danh gia phai tu 1 den 5');
    const noiDung = String(body.noi_dung ?? '').trim();

    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
      const result = await manager.query(
        `INSERT INTO danh_gia (tai_khoan_id,chuyen_gia_id,lich_hen_id,diem,noi_dung,tag,trang_thai,tao_luc,cap_nhat_luc)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [userId, booking.chuyen_gia_id, bookingId, diem, noiDung,
         JSON.stringify(body.tag ?? []), 'hien_thi', now, now],
      );

      // Cập nhật aggregate rating chuyên gia
      await manager.query(
        `UPDATE chuyen_gia
         SET so_luot_danh_gia = so_luot_danh_gia + 1,
             diem_danh_gia_trung_binh = (
               SELECT AVG(d.diem) FROM danh_gia d
               WHERE d.chuyen_gia_id = ? AND d.trang_thai = 'hien_thi'
             ),
             cap_nhat_luc = ?
         WHERE id = ?`,
        [booking.chuyen_gia_id, now, booking.chuyen_gia_id],
      );

      // Thông báo chuyên gia
      const [expertAccount] = await manager.query(
        'SELECT tai_khoan_id FROM chuyen_gia WHERE id = ?', [booking.chuyen_gia_id],
      );
      if (expertAccount) {
        await manager.query(
          `INSERT INTO thong_bao (tai_khoan_id,nguoi_gui_id,loai,tieu_de,noi_dung,trang_thai,duong_dan_hanh_dong,entity_type,entity_id,tao_luc,doc_luc,cap_nhat_luc)
           VALUES (?,?,'review','Danh gia moi tu khach hang',?,'chua_doc',?,'danh_gia',?,?,NULL,?)`,
          [expertAccount.tai_khoan_id, userId,
           `Khach hang danh gia ${diem}/5 sao cho booking ${booking.ma_lich_hen}`,
           `/nutritionist/reviews`, result.insertId, now, now],
        );
      }

      const [review] = await manager.query('SELECT * FROM danh_gia WHERE id = ?', [result.insertId]);
      return review;
    });
  }

  async listReviews(accountId: number | undefined, query: Dict) {
    const userId = await this.assertAccount(accountId);
    const where = ['dg.tai_khoan_id = ?'];
    const params: unknown[] = [userId];
    if (query.status) { where.push('dg.trang_thai = ?'); params.push(query.status); }

    return this.dataSource.query(
      `SELECT dg.*, lh.ma_lich_hen, lh.ngay_hen, tk.ho_ten AS expert_name, cg.anh_dai_dien_url, gdv.ten_goi
       FROM danh_gia dg
       JOIN lich_hen lh ON lh.id = dg.lich_hen_id
       JOIN chuyen_gia cg ON cg.id = dg.chuyen_gia_id
       JOIN tai_khoan tk ON tk.id = cg.tai_khoan_id
       JOIN goi_dich_vu gdv ON gdv.id = lh.goi_dich_vu_id
       WHERE ${where.join(' AND ')}
       ORDER BY dg.tao_luc DESC`,
      params,
    );
  }

  async updateReview(accountId: number | undefined, reviewId: number, body: Dict) {
    const userId = await this.assertAccount(accountId);
    const [review] = await this.dataSource.query(
      'SELECT * FROM danh_gia WHERE id = ? AND tai_khoan_id = ?', [reviewId, userId],
    );
    if (!review) throw new NotFoundException('Khong tim thay danh gia');

    const editDeadline = new Date(review.tao_luc);
    editDeadline.setDate(editDeadline.getDate() + 7);
    if (Date.now() > editDeadline.getTime()) throw new BadRequestException('Da het han sua danh gia (7 ngay)');

    const diem = body.diem !== undefined ? toNumber(body.diem) : toNumber(review.diem);
    if (diem < 1 || diem > 5) throw new BadRequestException('Diem phai tu 1 den 5');

    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
      await manager.query(
        'UPDATE danh_gia SET diem=?, noi_dung=?, tag=?, cap_nhat_luc=? WHERE id=?',
        [diem, String(body.noi_dung ?? review.noi_dung ?? '').trim(),
         JSON.stringify(body.tag ?? parseJson(review.tag) ?? []), now, reviewId],
      );
      await manager.query(
        `UPDATE chuyen_gia
         SET diem_danh_gia_trung_binh = (
           SELECT AVG(d.diem) FROM danh_gia d WHERE d.chuyen_gia_id = ? AND d.trang_thai = 'hien_thi'
         ), cap_nhat_luc = ? WHERE id = ?`,
        [review.chuyen_gia_id, now, review.chuyen_gia_id],
      );
      const [updated] = await manager.query('SELECT * FROM danh_gia WHERE id = ?', [reviewId]);
      return updated;
    });
  }

  async deleteReview(accountId: number | undefined, reviewId: number) {
    const userId = await this.assertAccount(accountId);
    const [review] = await this.dataSource.query(
      'SELECT * FROM danh_gia WHERE id = ? AND tai_khoan_id = ?', [reviewId, userId],
    );
    if (!review) throw new NotFoundException('Khong tim thay danh gia');

    await this.dataSource.transaction(async (manager) => {
      const now = new Date();
      // Theo spec: xóa mềm — dùng trạng thái 'da_xoa' (không xóa vật lý)
      await manager.query(
        "UPDATE danh_gia SET trang_thai='da_xoa', cap_nhat_luc=? WHERE id=?", [now, reviewId],
      );
      await manager.query(
        `UPDATE chuyen_gia
         SET so_luot_danh_gia = so_luot_danh_gia - 1,
             diem_danh_gia_trung_binh = COALESCE(
               (SELECT AVG(d.diem) FROM danh_gia d WHERE d.chuyen_gia_id = ? AND d.trang_thai = 'hien_thi'),0
             ), cap_nhat_luc = ? WHERE id = ?`,
        [review.chuyen_gia_id, now, review.chuyen_gia_id],
      );
    });
    return { ok: true };
  }

  // ─── 08: Khiếu nại / hỗ trợ ───

  async createComplaint(accountId: number | undefined, body: Dict) {
    const userId = await this.assertAccount(accountId);
    const loai = String(body.loai ?? '').trim();
    const validTypes = ['booking', 'thanh_toan', 'danh_gia', 'khac'];
    if (!validTypes.includes(loai)) throw new BadRequestException('Loai khieu nai khong hop le');
    const noiDung = String(body.noi_dung ?? '').trim();
    if (!noiDung) throw new BadRequestException('Vui long nhap noi dung khieu nai');

    const now = new Date();
    const maTicket = makeCode('KN').slice(0, 50);

    const result = await this.dataSource.query(
      `INSERT INTO khieu_nai (tai_khoan_id,loai,doi_tuong_id,ma_ticket,tieu_de,noi_dung,bang_chung_url,trang_thai,tao_luc,cap_nhat_luc)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [userId, loai, toNumber(body.doi_tuong_id) || null, maTicket,
       String(body.tieu_de ?? noiDung).slice(0, 255), noiDung,
       JSON.stringify(body.bang_chung_url ?? []), 'moi', now, now],
    );

    // Thông báo admin
    const admins = await this.dataSource.query(
      `SELECT id FROM tai_khoan WHERE vai_tro = 'admin' LIMIT 3`,
    );
    for (const admin of admins) {
      await this.dataSource.query(
        `INSERT INTO thong_bao (tai_khoan_id,nguoi_gui_id,loai,tieu_de,noi_dung,trang_thai,duong_dan_hanh_dong,entity_type,entity_id,tao_luc,doc_luc,cap_nhat_luc)
         VALUES (?,?,'khieu_nai','Khieu nai moi tu khach hang',?,'chua_doc',?,'khieu_nai',?,?,NULL,?)`,
        [admin.id, userId, `[${maTicket}] ${String(body.tieu_de ?? noiDung).slice(0, 100)}`,
         `/admin/complaints`, result.insertId, now, now],
      );
    }

    const [ticket] = await this.dataSource.query('SELECT * FROM khieu_nai WHERE id = ?', [result.insertId]);
    return ticket;
  }

  async listComplaints(accountId: number | undefined, query: Dict) {
    const userId = await this.assertAccount(accountId);
    const where = ['kn.tai_khoan_id = ?'];
    const params: unknown[] = [userId];
    if (query.status) { where.push('kn.trang_thai = ?'); params.push(query.status); }

    return this.dataSource.query(
      `SELECT kn.*,
              (SELECT COUNT(*) FROM khieu_nai_tin_nhan knm WHERE knm.khieu_nai_id = kn.id) AS so_tin_nhan
       FROM khieu_nai kn
       WHERE ${where.join(' AND ')}
       ORDER BY kn.tao_luc DESC`,
      params,
    );
  }

  async getComplaint(accountId: number | undefined, complaintId: number) {
    const userId = await this.assertAccount(accountId);
    const [complaint] = await this.dataSource.query(
      'SELECT * FROM khieu_nai WHERE id = ? AND tai_khoan_id = ?', [complaintId, userId],
    );
    if (!complaint) throw new NotFoundException('Khong tim thay khieu nai');

    const messages = await this.dataSource.query(
      `SELECT knm.*, tk.ho_ten AS sender_name, tk.vai_tro AS sender_role
       FROM khieu_nai_tin_nhan knm
       JOIN tai_khoan tk ON tk.id = knm.nguoi_gui_id
       WHERE knm.khieu_nai_id = ?
       ORDER BY knm.tao_luc ASC`,
      [complaintId],
    );
    return { ...complaint, bang_chung_url: parseJson(complaint.bang_chung_url) ?? [], messages };
  }

  async addComplaintMessage(accountId: number | undefined, complaintId: number, body: Dict) {
    const userId = await this.assertAccount(accountId);
    const [complaint] = await this.dataSource.query(
      'SELECT * FROM khieu_nai WHERE id = ? AND tai_khoan_id = ?', [complaintId, userId],
    );
    if (!complaint) throw new NotFoundException('Khong tim thay khieu nai');
    if (['da_dong', 'da_huy'].includes(complaint.trang_thai)) {
      throw new BadRequestException('Khieu nai da dong, khong the gui them tin nhan');
    }

    const content = String(body.noi_dung ?? '').trim();
    if (!content) throw new BadRequestException('Noi dung khong duoc trong');

    const now = new Date();
    await this.dataSource.query(
      `INSERT INTO khieu_nai_tin_nhan (khieu_nai_id,nguoi_gui_id,noi_dung,tep_dinh_kem,tao_luc,cap_nhat_luc)
       VALUES (?,?,?,?,?,?)`,
      [complaintId, userId, content, JSON.stringify(body.tep_dinh_kem ?? []), now, now],
    );

    // Cập nhật khiếu nại: nếu đang 'dang_xu_ly' thì giữ, nếu 'moi' thì giữ
    await this.dataSource.query(
      `UPDATE khieu_nai SET cap_nhat_luc=? WHERE id=?`, [now, complaintId],
    );

    return this.getComplaint(accountId, complaintId);
  }

  // ─── 09: Chatbox AI sức khỏe ───

  private async assertAiSession(accountId: number | undefined, sessionId: number) {
    const userId = await this.assertAccount(accountId);
    const [session] = await this.dataSource.query(
      'SELECT * FROM phien_chat_ai WHERE id = ? AND tai_khoan_id = ?',
      [sessionId, userId],
    );
    if (!session) throw new NotFoundException('Khong tim thay phien chat AI');
    return { userId, session };
  }

  async listAiChatSessions(accountId: number | undefined, query: Dict) {
    const userId = await this.assertAccount(accountId);
    const where = ['tai_khoan_id = ?'];
    const params: unknown[] = [userId];
    if (query.status) {
      where.push('trang_thai = ?');
      params.push(query.status);
    }
    const rows = await this.dataSource.query(
      `SELECT * FROM phien_chat_ai WHERE ${where.join(' AND ')} ORDER BY cap_nhat_luc DESC LIMIT 50`,
      params,
    );
    return rows.map((row: Dict) => ({
      ...row,
      context_snapshot: parseJson(row.context_snapshot) ?? null,
    }));
  }

  async createAiChatSession(accountId: number | undefined, body: Dict) {
    const userId = await this.assertAccount(accountId);
    const validContextTypes = ['suc_khoe', 'dinh_duong', 'tap_luyen', 'tu_van_chung'];
    const loaiContext = String(body.loai_context ?? 'tu_van_chung');
    if (!validContextTypes.includes(loaiContext)) {
      throw new BadRequestException('Loai context AI khong hop le');
    }

    const now = new Date();
    const [profile] = await this.dataSource.query(
      'SELECT gioi_tinh, muc_tieu_suc_khoe, muc_do_van_dong FROM ho_so_suc_khoe WHERE tai_khoan_id = ?',
      [userId],
    );
    const contextSnapshot = {
      loai_context: loaiContext,
      profile: profile ?? null,
      created_at: now.toISOString(),
    };
    const result = await this.dataSource.query(
      `INSERT INTO phien_chat_ai (tai_khoan_id, tieu_de, loai_context, context_snapshot, trang_thai, tao_luc, cap_nhat_luc)
       VALUES (?, ?, ?, ?, 'dang_mo', ?, ?)`,
      [userId, String(body.tieu_de ?? 'Phien chat AI moi').slice(0, 191), loaiContext, JSON.stringify(contextSnapshot), now, now],
    );
    const [session] = await this.dataSource.query('SELECT * FROM phien_chat_ai WHERE id = ?', [result.insertId]);
    return { ...session, context_snapshot: parseJson(session.context_snapshot) ?? null };
  }

  async getAiChatMessages(accountId: number | undefined, sessionId: number) {
    await this.assertAiSession(accountId, sessionId);
    return this.dataSource.query(
      `SELECT * FROM tin_nhan_chat_ai WHERE phien_chat_ai_id = ? ORDER BY tao_luc ASC`,
      [sessionId],
    );
  }

  private buildAiReply(question: string, contextType: string) {
    const disclaimer =
      'Luu y: Noi dung chi mang tinh tham khao, khong thay the chan doan y khoa. Neu co dau hieu bat thuong, hay lien he bac si.';
    const base =
      contextType === 'dinh_duong'
        ? 'Goi y nhanh: uu tien dam-protein nac, rau xanh, han che duong tinh luyen, theo doi calo hang ngay.'
        : contextType === 'tap_luyen'
          ? 'Goi y nhanh: ket hop cardio + suc manh 3-5 buoi/tuan, khoi dong ky, tang tai tu tu.'
          : contextType === 'suc_khoe'
            ? 'Goi y nhanh: ngu 7-8 tieng, theo doi can nang/huyet ap dinh ky, duy tri van dong deu dan.'
            : 'Goi y nhanh: toi uu che do an, tap luyen va theo doi chi so suc khoe de dat muc tieu ben vung.';
    return `${base} Cau hoi cua ban: "${question.slice(0, 180)}". ${disclaimer}`;
  }

  async sendAiChatMessage(accountId: number | undefined, sessionId: number, body: Dict) {
    const { userId, session } = await this.assertAiSession(accountId, sessionId);
    if (session.trang_thai === 'da_luu_tru') {
      throw new BadRequestException('Phien chat da luu tru, khong the gui them tin nhan');
    }
    const content = String(body.noi_dung ?? '').trim();
    if (!content) throw new BadRequestException('Noi dung cau hoi khong duoc trong');

    const now = new Date();
    const aiReply = this.buildAiReply(content, String(session.loai_context ?? 'tu_van_chung'));

    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `INSERT INTO tin_nhan_chat_ai (phien_chat_ai_id, vai_tro, noi_dung, model, token_input, token_output, trang_thai, loi, metadata, tao_luc)
         VALUES (?, 'user', ?, NULL, NULL, NULL, 'thanh_cong', NULL, NULL, ?)`,
        [sessionId, content, now],
      );
      await manager.query(
        `INSERT INTO tin_nhan_chat_ai (phien_chat_ai_id, vai_tro, noi_dung, model, token_input, token_output, trang_thai, loi, metadata, tao_luc)
         VALUES (?, 'assistant', ?, ?, NULL, NULL, 'thanh_cong', NULL, ?, ?)`,
        [sessionId, aiReply, 'rule-based-assistant', JSON.stringify({ disclaimer: true }), new Date()],
      );
      await manager.query('UPDATE phien_chat_ai SET cap_nhat_luc = ? WHERE id = ?', [new Date(), sessionId]);
    });

    return this.getAiChatMessages(userId, sessionId);
  }

  async archiveAiChatSession(accountId: number | undefined, sessionId: number) {
    await this.assertAiSession(accountId, sessionId);
    await this.dataSource.query(
      `UPDATE phien_chat_ai SET trang_thai = 'da_luu_tru', cap_nhat_luc = ? WHERE id = ?`,
      [new Date(), sessionId],
    );
    return { ok: true };
  }

  // ─── 10: Quản lý hồ sơ sức khỏe ───

  async getHealthProfile(accountId: number | undefined) {
    const userId = await this.assertAccount(accountId);
    const [profile] = await this.dataSource.query(
      'SELECT * FROM ho_so_suc_khoe WHERE tai_khoan_id = ?', [userId],
    );
    if (!profile) return { exists: false, profile: null, completion: this.calcProfileCompletion(null) };
    return {
      exists: true,
      profile: {
        ...profile,
        tinh_trang_suc_khoe: parseJson(profile.tinh_trang_suc_khoe) ?? [],
        di_ung: parseJson(profile.di_ung) ?? [],
        che_do_an_uu_tien: parseJson(profile.che_do_an_uu_tien) ?? [],
        thuc_pham_khong_dung: parseJson(profile.thuc_pham_khong_dung) ?? [],
      },
      completion: this.calcProfileCompletion(profile),
    };
  }

  private calcProfileCompletion(profile: Dict | null) {
    if (!profile) return { percent: 0, missing: ['gioi_tinh','ngay_sinh','chieu_cao_cm','can_nang_hien_tai_kg','muc_do_van_dong','muc_tieu_suc_khoe'] };
    const required = ['gioi_tinh','ngay_sinh','chieu_cao_cm','can_nang_hien_tai_kg','muc_do_van_dong','muc_tieu_suc_khoe'];
    const missing = required.filter(f => !profile[f]);
    return { percent: Math.round(((required.length - missing.length) / required.length) * 100), missing };
  }

  async upsertHealthProfile(accountId: number | undefined, body: Dict) {
    const userId = await this.assertAccount(accountId);

    // Validate
    const validGender = ['nam', 'nu', 'khac'];
    if (body.gioi_tinh && !validGender.includes(body.gioi_tinh)) throw new BadRequestException('Gioi tinh khong hop le');

    const validActivity = ['it_van_dong', 'van_dong_nhe', 'van_dong_vua', 'nang_dong', 'rat_nang_dong'];
    if (body.muc_do_van_dong && !validActivity.includes(body.muc_do_van_dong)) throw new BadRequestException('Muc do van dong khong hop le');

    const validGoals = ['giam_can', 'tang_can', 'giu_can', 'cai_thien_suc_khoe'];
    if (body.muc_tieu_suc_khoe && !validGoals.includes(body.muc_tieu_suc_khoe)) throw new BadRequestException('Muc tieu suc khoe khong hop le');

    const h = toNumber(body.chieu_cao_cm);
    if (body.chieu_cao_cm !== undefined && body.chieu_cao_cm !== null && (h < 50 || h > 300)) throw new BadRequestException('Chieu cao phai tu 50 den 300 cm');
    const w = toNumber(body.can_nang_hien_tai_kg);
    if (body.can_nang_hien_tai_kg !== undefined && body.can_nang_hien_tai_kg !== null && (w < 10 || w > 500)) throw new BadRequestException('Can nang phai tu 10 den 500 kg');

    if (body.ngay_sinh) {
      const dob = new Date(String(body.ngay_sinh));
      if (Number.isNaN(dob.getTime())) throw new BadRequestException('Ngay sinh khong hop le');
      if (dob.getTime() > Date.now()) throw new BadRequestException('Ngay sinh phai trong qua khu');
    }

    const now = new Date();
    const [existing] = await this.dataSource.query(
      'SELECT id, da_hoan_thanh FROM ho_so_suc_khoe WHERE tai_khoan_id = ?', [userId],
    );

    const fields = {
      gioi_tinh: body.gioi_tinh ?? null,
      ngay_sinh: body.ngay_sinh ? formatDateOnly(new Date(String(body.ngay_sinh))) : null,
      chieu_cao_cm: body.chieu_cao_cm ?? null,
      can_nang_hien_tai_kg: body.can_nang_hien_tai_kg ?? null,
      muc_do_van_dong: body.muc_do_van_dong ?? null,
      muc_tieu_suc_khoe: body.muc_tieu_suc_khoe ?? null,
      tinh_trang_suc_khoe: JSON.stringify(body.tinh_trang_suc_khoe ?? []),
      di_ung: JSON.stringify(body.di_ung ?? []),
      che_do_an_uu_tien: JSON.stringify(body.che_do_an_uu_tien ?? []),
      thuc_pham_khong_dung: JSON.stringify(body.thuc_pham_khong_dung ?? []),
      ghi_chu_cho_chuyen_gia: body.ghi_chu_cho_chuyen_gia ?? null,
    };

    // Tính da_hoan_thanh
    const daHoanThanh = fields.gioi_tinh && fields.ngay_sinh && fields.chieu_cao_cm && fields.can_nang_hien_tai_kg && fields.muc_do_van_dong && fields.muc_tieu_suc_khoe ? 1 : 0;

    if (existing) {
      await this.dataSource.query(
        `UPDATE ho_so_suc_khoe SET gioi_tinh=?,ngay_sinh=?,chieu_cao_cm=?,can_nang_hien_tai_kg=?,
         muc_do_van_dong=?,muc_tieu_suc_khoe=?,tinh_trang_suc_khoe=?,di_ung=?,che_do_an_uu_tien=?,
         thuc_pham_khong_dung=?,ghi_chu_cho_chuyen_gia=?,da_hoan_thanh=?,cap_nhat_luc=? WHERE id=?`,
        [fields.gioi_tinh, fields.ngay_sinh, fields.chieu_cao_cm, fields.can_nang_hien_tai_kg,
         fields.muc_do_van_dong, fields.muc_tieu_suc_khoe, fields.tinh_trang_suc_khoe,
         fields.di_ung, fields.che_do_an_uu_tien, fields.thuc_pham_khong_dung,
         fields.ghi_chu_cho_chuyen_gia, daHoanThanh, now, existing.id],
      );
    } else {
      await this.dataSource.query(
        `INSERT INTO ho_so_suc_khoe (tai_khoan_id,gioi_tinh,ngay_sinh,chieu_cao_cm,can_nang_hien_tai_kg,
         muc_do_van_dong,muc_tieu_suc_khoe,tinh_trang_suc_khoe,di_ung,che_do_an_uu_tien,
         thuc_pham_khong_dung,ghi_chu_cho_chuyen_gia,da_hoan_thanh,tao_luc,cap_nhat_luc)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [userId, fields.gioi_tinh, fields.ngay_sinh, fields.chieu_cao_cm, fields.can_nang_hien_tai_kg,
         fields.muc_do_van_dong, fields.muc_tieu_suc_khoe, fields.tinh_trang_suc_khoe,
         fields.di_ung, fields.che_do_an_uu_tien, fields.thuc_pham_khong_dung,
         fields.ghi_chu_cho_chuyen_gia, daHoanThanh, now, now],
      );
    }

    // Ghi audit log
    await this.dataSource.query(
      `INSERT INTO audit_log (actor_id,actor_role,action,resource_type,resource_id,new_value,tao_luc)
       VALUES (?,?,?,?,?,?,?)`,
      [userId, 'customer', existing ? 'update_health_profile' : 'create_health_profile',
       'ho_so_suc_khoe', existing?.id ?? null, JSON.stringify(fields), now],
    );

    return this.getHealthProfile(accountId);
  }

  // ─── 11: Theo dõi chỉ số sức khỏe ───

  async listHealthMetrics(accountId: number | undefined, query: Dict) {
    const userId = await this.assertAccount(accountId);
    const limit = Math.min(toNumber(query.limit, 50), 200);
    const offset = toNumber(query.offset, 0);

    const rows = await this.dataSource.query(
      `SELECT * FROM chi_so_suc_khoe WHERE tai_khoan_id = ? AND xoa_luc IS NULL
       ORDER BY do_luc DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset],
    );
    return rows.map((r: Dict) => ({ ...r, canh_bao: parseJson(r.canh_bao) ?? [] }));
  }

  async getLatestMetric(accountId: number | undefined) {
    const userId = await this.assertAccount(accountId);
    const [row] = await this.dataSource.query(
      'SELECT * FROM chi_so_suc_khoe WHERE tai_khoan_id = ? AND xoa_luc IS NULL ORDER BY do_luc DESC LIMIT 1',
      [userId],
    );
    return row ? { ...row, canh_bao: parseJson(row.canh_bao) ?? [] } : null;
  }

  async getHealthSummary(accountId: number | undefined) {
    const userId = await this.assertAccount(accountId);
    const [profile] = await this.dataSource.query(
      'SELECT chieu_cao_cm FROM ho_so_suc_khoe WHERE tai_khoan_id = ?', [userId],
    );
    const latest = await this.getLatestMetric(accountId);
    const rows = await this.dataSource.query(
      `SELECT can_nang_kg, do_luc FROM chi_so_suc_khoe
       WHERE tai_khoan_id = ? AND xoa_luc IS NULL AND can_nang_kg IS NOT NULL
       ORDER BY do_luc DESC LIMIT 10`,
      [userId],
    );

    const heightCm = toNumber(profile?.chieu_cao_cm);
    const currentWeight = toNumber(latest?.can_nang_kg);
    let bmi: number | null = null;
    let bmiCategory = '';
    if (heightCm > 0 && currentWeight > 0) {
      const heightM = heightCm / 100;
      bmi = Math.round((currentWeight / (heightM * heightM)) * 10) / 10;
      if (bmi < 18.5) bmiCategory = 'Thiếu cân';
      else if (bmi < 25) bmiCategory = 'Bình thường';
      else if (bmi < 30) bmiCategory = 'Thừa cân';
      else bmiCategory = 'Béo phì';
    }

    let weightTrend = 'khong_du_du_lieu';
    if (rows.length >= 2) {
      const newest = toNumber(rows[0].can_nang_kg);
      const oldest = toNumber(rows[rows.length - 1].can_nang_kg);
      if (newest > oldest + 0.5) weightTrend = 'tang';
      else if (newest < oldest - 0.5) weightTrend = 'giam';
      else weightTrend = 'on_dinh';
    }

    const warnings: string[] = [];
    if (latest) {
      if (toNumber(latest.huyet_ap_tam_thu) > 140) warnings.push('Huyết áp tâm thu cao (>140 mmHg) - nên kiểm tra y tế');
      if (toNumber(latest.huyet_ap_tam_truong) > 90) warnings.push('Huyết áp tâm trương cao (>90 mmHg)');
      if (toNumber(latest.nhip_tim) > 100) warnings.push('Nhịp tim nhanh (>100 bpm)');
      if (toNumber(latest.nhip_tim) > 0 && toNumber(latest.nhip_tim) < 50) warnings.push('Nhịp tim chậm (<50 bpm)');
      if (toNumber(latest.duong_huyet) > 7) warnings.push('Đường huyết cao (>7 mmol/L)');
      if (bmi && bmi > 30) warnings.push('BMI > 30 - nguy cơ béo phì, nên tư vấn chuyên gia');
      if (bmi && bmi < 16) warnings.push('BMI < 16 - thiếu cân nghiêm trọng, cần khám bác sĩ');
    }

    return { bmi, bmiCategory, weightTrend, warnings, latestMetric: latest, recentWeights: rows };
  }

  async createHealthMetric(accountId: number | undefined, body: Dict) {
    const userId = await this.assertAccount(accountId);

    // Validate ranges
    const w = body.can_nang_kg !== undefined ? toNumber(body.can_nang_kg) : null;
    if (w !== null && (w < 10 || w > 500)) throw new BadRequestException('Can nang phai tu 10 den 500 kg');
    const we = body.vong_eo_cm !== undefined ? toNumber(body.vong_eo_cm) : null;
    if (we !== null && (we < 20 || we > 300)) throw new BadRequestException('Vong eo phai tu 20 den 300 cm');
    const wm = body.vong_mong_cm !== undefined ? toNumber(body.vong_mong_cm) : null;
    if (wm !== null && (wm < 20 || wm > 300)) throw new BadRequestException('Vong mong phai tu 20 den 300 cm');
    const sys = body.huyet_ap_tam_thu !== undefined ? toNumber(body.huyet_ap_tam_thu) : null;
    if (sys !== null && (sys < 50 || sys > 300)) throw new BadRequestException('Huyet ap tam thu phai tu 50 den 300');
    const dia = body.huyet_ap_tam_truong !== undefined ? toNumber(body.huyet_ap_tam_truong) : null;
    if (dia !== null && (dia < 30 || dia > 200)) throw new BadRequestException('Huyet ap tam truong phai tu 30 den 200');
    const hr = body.nhip_tim !== undefined ? toNumber(body.nhip_tim) : null;
    if (hr !== null && (hr < 20 || hr > 250)) throw new BadRequestException('Nhip tim phai tu 20 den 250');
    const bg = body.duong_huyet !== undefined ? toNumber(body.duong_huyet) : null;
    if (bg !== null && (bg < 1 || bg > 50)) throw new BadRequestException('Duong huyet phai tu 1 den 50 mmol/L');
    const sleep = body.chat_luong_giac_ngu !== undefined ? toNumber(body.chat_luong_giac_ngu) : null;
    if (sleep !== null && (sleep < 1 || sleep > 10)) throw new BadRequestException('Chat luong giac ngu phai tu 1 den 10');
    const energy = body.muc_nang_luong !== undefined ? toNumber(body.muc_nang_luong) : null;
    if (energy !== null && (energy < 1 || energy > 10)) throw new BadRequestException('Muc nang luong phai tu 1 den 10');

    // Tính BMI nếu có đủ dữ liệu
    let bmi: number | null = null;
    if (w) {
      const [profile] = await this.dataSource.query(
        'SELECT chieu_cao_cm FROM ho_so_suc_khoe WHERE tai_khoan_id = ?', [userId],
      );
      const heightCm = toNumber(profile?.chieu_cao_cm);
      if (heightCm > 0) {
        const heightM = heightCm / 100;
        bmi = Math.round((w / (heightM * heightM)) * 10) / 10;
      }
    }

    // Tạo cảnh báo tự động
    const warnings: string[] = [];
    if (sys && sys > 140) warnings.push('Huyết áp tâm thu cao');
    if (dia && dia > 90) warnings.push('Huyết áp tâm trương cao');
    if (hr && hr > 100) warnings.push('Nhịp tim nhanh');
    if (bg && bg > 7) warnings.push('Đường huyết cao');
    if (bmi && bmi > 30) warnings.push('BMI cao - béo phì');
    if (bmi && bmi < 16) warnings.push('BMI thấp - thiếu cân nghiêm trọng');

    const doLuc = body.do_luc ? new Date(String(body.do_luc)) : new Date();
    if (Number.isNaN(doLuc.getTime())) throw new BadRequestException('Thoi gian do khong hop le');
    const now = new Date();

    const result = await this.dataSource.query(
      `INSERT INTO chi_so_suc_khoe (tai_khoan_id,do_luc,can_nang_kg,vong_eo_cm,vong_mong_cm,
       huyet_ap_tam_thu,huyet_ap_tam_truong,nhip_tim,duong_huyet,chat_luong_giac_ngu,
       muc_nang_luong,bmi,canh_bao,ghi_chu,tao_luc,cap_nhat_luc)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [userId, doLuc, w, we, wm, sys, dia, hr, bg, sleep, energy, bmi,
       JSON.stringify(warnings), body.ghi_chu ?? null, now, now],
    );

    // Cập nhật cân nặng hiện tại trong hồ sơ nếu có
    if (w) {
      await this.dataSource.query(
        'UPDATE ho_so_suc_khoe SET can_nang_hien_tai_kg=?, cap_nhat_luc=? WHERE tai_khoan_id=?',
        [w, now, userId],
      );
    }

    const [created] = await this.dataSource.query('SELECT * FROM chi_so_suc_khoe WHERE id = ?', [result.insertId]);
    return { ...created, canh_bao: parseJson(created.canh_bao) ?? [], warnings_text: warnings };
  }

  async updateHealthMetric(accountId: number | undefined, metricId: number, body: Dict) {
    const userId = await this.assertAccount(accountId);
    const [metric] = await this.dataSource.query(
      'SELECT * FROM chi_so_suc_khoe WHERE id = ? AND tai_khoan_id = ? AND xoa_luc IS NULL',
      [metricId, userId],
    );
    if (!metric) throw new NotFoundException('Khong tim thay chi so');

    const w = body.can_nang_kg !== undefined ? toNumber(body.can_nang_kg) : toNumber(metric.can_nang_kg);
    if (w && (w < 10 || w > 500)) throw new BadRequestException('Can nang phai tu 10 den 500 kg');

    const now = new Date();
    await this.dataSource.query(
      `UPDATE chi_so_suc_khoe SET can_nang_kg=?,vong_eo_cm=?,vong_mong_cm=?,
       huyet_ap_tam_thu=?,huyet_ap_tam_truong=?,nhip_tim=?,duong_huyet=?,
       chat_luong_giac_ngu=?,muc_nang_luong=?,ghi_chu=?,cap_nhat_luc=? WHERE id=?`,
      [body.can_nang_kg ?? metric.can_nang_kg, body.vong_eo_cm ?? metric.vong_eo_cm,
       body.vong_mong_cm ?? metric.vong_mong_cm, body.huyet_ap_tam_thu ?? metric.huyet_ap_tam_thu,
       body.huyet_ap_tam_truong ?? metric.huyet_ap_tam_truong, body.nhip_tim ?? metric.nhip_tim,
       body.duong_huyet ?? metric.duong_huyet, body.chat_luong_giac_ngu ?? metric.chat_luong_giac_ngu,
       body.muc_nang_luong ?? metric.muc_nang_luong, body.ghi_chu ?? metric.ghi_chu, now, metricId],
    );

    const [updated] = await this.dataSource.query('SELECT * FROM chi_so_suc_khoe WHERE id = ?', [metricId]);
    return { ...updated, canh_bao: parseJson(updated.canh_bao) ?? [] };
  }

  async deleteHealthMetric(accountId: number | undefined, metricId: number) {
    const userId = await this.assertAccount(accountId);
    const [metric] = await this.dataSource.query(
      'SELECT * FROM chi_so_suc_khoe WHERE id = ? AND tai_khoan_id = ? AND xoa_luc IS NULL',
      [metricId, userId],
    );
    if (!metric) throw new NotFoundException('Khong tim thay chi so');

    await this.dataSource.query(
      'UPDATE chi_so_suc_khoe SET xoa_luc=?, cap_nhat_luc=? WHERE id=?',
      [new Date(), new Date(), metricId],
    );
    return { ok: true };
  }

  // ─── 12: Gợi ý kế hoạch sức khỏe ───

  private normalizeStringList(value: unknown): string[] {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    if (typeof value === 'string') {
      const parsed = parseJson(value);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
      const trimmed = value.trim();
      return trimmed ? trimmed.split(',').map((item) => item.trim()).filter(Boolean) : [];
    }
    return [];
  }

  private healthRecommendationSignature(profile: Dict, latest: Dict | null, summary: Dict) {
    return {
      profile_updated_at: profile.cap_nhat_luc ? new Date(profile.cap_nhat_luc).toISOString() : null,
      metric_id: latest?.id ?? null,
      metric_time: latest?.do_luc ?? null,
      muc_tieu_suc_khoe: profile.muc_tieu_suc_khoe ?? null,
      muc_do_van_dong: profile.muc_do_van_dong ?? null,
      chieu_cao_cm: profile.chieu_cao_cm ?? null,
      can_nang_hien_tai_kg: profile.can_nang_hien_tai_kg ?? null,
      tinh_trang_suc_khoe: this.normalizeStringList(profile.tinh_trang_suc_khoe),
      bmi: summary.bmi ?? null,
      bmiCategory: summary.bmiCategory ?? null,
      weightTrend: summary.weightTrend ?? null,
      warnings: summary.warnings ?? [],
    };
  }

  private wellnessRecommendationSignature(profile: Dict, summary: Dict) {
    return {
      profile_updated_at: profile.cap_nhat_luc ? new Date(profile.cap_nhat_luc).toISOString() : null,
      muc_tieu_suc_khoe: profile.muc_tieu_suc_khoe ?? null,
      muc_do_van_dong: profile.muc_do_van_dong ?? null,
      gioi_tinh: profile.gioi_tinh ?? null,
      ngay_sinh: profile.ngay_sinh ?? null,
      chieu_cao_cm: profile.chieu_cao_cm ?? null,
      can_nang_hien_tai_kg: profile.can_nang_hien_tai_kg ?? null,
      di_ung: this.normalizeStringList(profile.di_ung),
      thuc_pham_khong_dung: this.normalizeStringList(profile.thuc_pham_khong_dung),
      che_do_an_uu_tien: this.normalizeStringList(profile.che_do_an_uu_tien),
      tinh_trang_suc_khoe: this.normalizeStringList(profile.tinh_trang_suc_khoe),
      bmi: summary.bmi ?? null,
      weightTrend: summary.weightTrend ?? null,
      warnings: summary.warnings ?? [],
    };
  }

  private signatureChanged(prev: unknown, next: unknown) {
    return JSON.stringify(prev ?? null) !== JSON.stringify(next ?? null);
  }

  async listHealthRecommendations(accountId: number | undefined) {
    const userId = await this.assertAccount(accountId);
    const rows = await this.dataSource.query(
      `SELECT * FROM goi_y_suc_khoe WHERE tai_khoan_id = ? ORDER BY tao_luc DESC LIMIT 20`,
      [userId],
    );
    return rows.map((r: Dict) => ({
      ...r,
      input_snapshot: parseJson(r.input_snapshot),
      noi_dung_goi_y: parseJson(r.noi_dung_goi_y),
      canh_bao: parseJson(r.canh_bao) ?? [],
    }));
  }

  async getLatestHealthRecommendation(accountId: number | undefined) {
    const userId = await this.assertAccount(accountId);
    const [profile] = await this.dataSource.query(
      'SELECT * FROM ho_so_suc_khoe WHERE tai_khoan_id = ?',
      [userId],
    );
    const completion = this.calcProfileCompletion(profile ?? null);
    if (!profile || !profile.da_hoan_thanh) {
      return {
        data_ready: false,
        completion,
        recommendation: null,
      };
    }

    const latestMetric = await this.getLatestMetric(accountId);
    const summary = await this.getHealthSummary(accountId);
    const currentSignature = this.healthRecommendationSignature(profile, latestMetric, summary);

    const [row] = await this.dataSource.query(
      `SELECT * FROM goi_y_suc_khoe WHERE tai_khoan_id = ? ORDER BY tao_luc DESC LIMIT 1`,
      [userId],
    );

    if (!row) {
      const autoCreated = await this.generateHealthRecommendation(accountId);
      return { data_ready: true, completion, auto_generated: true, recommendation: autoCreated };
    }

    const mapped = {
      ...row,
      input_snapshot: parseJson(row.input_snapshot),
      noi_dung_goi_y: parseJson(row.noi_dung_goi_y),
      canh_bao: parseJson(row.canh_bao) ?? [],
    };
    const prevSignature = mapped.input_snapshot?.input_signature ?? null;
    if (this.signatureChanged(prevSignature, currentSignature)) {
      const autoCreated = await this.generateHealthRecommendation(accountId);
      return { data_ready: true, completion, auto_generated: true, recommendation: autoCreated };
    }
    return { data_ready: true, completion, auto_generated: false, recommendation: mapped };
  }

  async generateHealthRecommendation(accountId: number | undefined) {
    const userId = await this.assertAccount(accountId);

    // Lấy hồ sơ
    const [profile] = await this.dataSource.query(
      'SELECT * FROM ho_so_suc_khoe WHERE tai_khoan_id = ?', [userId],
    );
    if (!profile || !profile.da_hoan_thanh) {
      const completion = this.calcProfileCompletion(profile);
      throw new BadRequestException(`Vui long bo sung ho so suc khoe truoc khi tao goi y. Thieu: ${completion.missing.join(', ')}`);
    }

    // Lấy chỉ số mới nhất
    const latest = await this.getLatestMetric(accountId);
    const summary = await this.getHealthSummary(accountId);

    // Snapshot input
    const inputSnapshot = {
      profile: {
        gioi_tinh: profile.gioi_tinh,
        ngay_sinh: profile.ngay_sinh,
        chieu_cao_cm: profile.chieu_cao_cm,
        can_nang_hien_tai_kg: profile.can_nang_hien_tai_kg,
        muc_do_van_dong: profile.muc_do_van_dong,
        muc_tieu_suc_khoe: profile.muc_tieu_suc_khoe,
        tinh_trang_suc_khoe: parseJson(profile.tinh_trang_suc_khoe) ?? [],
      },
      latest_metric: latest,
      bmi: summary.bmi,
      bmi_category: summary.bmiCategory,
      weight_trend: summary.weightTrend,
      input_signature: this.healthRecommendationSignature(profile, latest, summary),
      generated_at: new Date().toISOString(),
    };

    // Rule-based recommendation
    const actions: Array<Record<string, unknown>> = [];
    const warnings: string[] = [];
    const mucTieu = profile.muc_tieu_suc_khoe;
    const bmi = summary.bmi;
    const sleepScore = toNumber(latest?.chat_luong_giac_ngu);
    const stressScore = toNumber(latest?.muc_do_cang_thang);

    actions.push({
      nhom: 'tong_quan',
      hanh_dong: 'Theo dõi cân nặng và vòng eo cố định 2 lần/tuần',
      muc_do: 'trung_binh',
      ly_do: 'Duy trì dữ liệu liên tục giúp recommendation bám sát thực tế',
      tan_suat: '2 lan/tuần',
      thoi_diem_goi_y: 'Buổi sáng sau khi ngủ dậy',
      chi_so_theo_doi: ['can_nang_kg', 'vong_eo_cm'],
    });

    if (mucTieu === 'giam_can') {
      actions.push({ nhom: 'muc_tieu', hanh_dong: 'Giảm 300-500 kcal/ngày so với TDEE', muc_do: 'cao', ly_do: 'Mục tiêu giảm cân an toàn 0.3-0.7kg/tuần', tan_suat: 'Hang ngay', ket_qua_ky_vong: 'Giảm 1-2kg/tháng' });
      actions.push({ nhom: 'van_dong', hanh_dong: 'Tập cardio 30-45 phút, 5 ngày/tuần', muc_do: 'cao', ly_do: 'Tăng tiêu hao năng lượng và cải thiện tim mạch', tan_suat: '5 buoi/tuần' });
      actions.push({ nhom: 'thoi_quen', hanh_dong: 'Uống đủ 30-35ml nước/kg/ngày', muc_do: 'trung_binh', ly_do: 'Hỗ trợ kiểm soát cơn đói và trao đổi chất', tan_suat: 'Hang ngay' });
    } else if (mucTieu === 'tang_can') {
      actions.push({ nhom: 'muc_tieu', hanh_dong: 'Tăng 300-500 kcal/ngày so với TDEE', muc_do: 'cao', ly_do: 'Tăng cân thiên về cơ, hạn chế mỡ', tan_suat: 'Hang ngay', ket_qua_ky_vong: 'Tăng 1-2kg/tháng' });
      actions.push({ nhom: 'van_dong', hanh_dong: 'Tập resistance training 4 buổi/tuần', muc_do: 'cao', ly_do: 'Tăng cơ bắp thay vì tăng mỡ', tan_suat: '4 buoi/tuần' });
      actions.push({ nhom: 'dinh_duong', hanh_dong: 'Ưu tiên bữa phụ giàu protein giữa 2 bữa chính', muc_do: 'trung_binh', ly_do: 'Giúp đạt tổng kcal và protein mục tiêu', tan_suat: '1-2 bua phu/ngay' });
    } else if (mucTieu === 'giu_can') {
      actions.push({ nhom: 'muc_tieu', hanh_dong: 'Duy trì calories quanh mức TDEE', muc_do: 'trung_binh', ly_do: 'Giữ cân nặng ổn định và bền vững', tan_suat: 'Hang ngay' });
      actions.push({ nhom: 'van_dong', hanh_dong: 'Tập luyện đều 3-4 ngày/tuần', muc_do: 'trung_binh', ly_do: 'Duy trì chuyển hóa và sức khỏe tổng thể', tan_suat: '3-4 buoi/tuần' });
      actions.push({ nhom: 'thoi_quen', hanh_dong: 'Đặt giờ ngủ cố định, lệch không quá 1 giờ', muc_do: 'trung_binh', ly_do: 'Ổn định hormone ảnh hưởng cân nặng', tan_suat: 'Hang ngay' });
    } else {
      actions.push({ nhom: 'muc_tieu', hanh_dong: 'Xây dựng chế độ ăn cân bằng 4 nhóm chất', muc_do: 'cao', ly_do: 'Cải thiện sức khỏe toàn diện', tan_suat: 'Hang ngay' });
      actions.push({ nhom: 'thoi_quen', hanh_dong: 'Ngủ đủ 7-8 tiếng/đêm', muc_do: 'cao', ly_do: 'Giấc ngủ ảnh hưởng trực tiếp miễn dịch và phục hồi', tan_suat: 'Hang ngay' });
      actions.push({ nhom: 'van_dong', hanh_dong: 'Vận động tối thiểu 150 phút/tuần', muc_do: 'trung_binh', ly_do: 'Khuyến nghị nền tảng để bảo vệ tim mạch', tan_suat: 'Hang tuan' });
    }

    if (bmi && bmi > 30) {
      warnings.push('BMI cao - nên tham khảo ý kiến chuyên gia dinh dưỡng');
      actions.push({ nhom: 'can_thiep', hanh_dong: 'Đặt lịch tư vấn chuyên gia dinh dưỡng', muc_do: 'cao', ly_do: 'BMI > 30 cần được hỗ trợ chuyên môn', tan_suat: 'Som nhat co the' });
    }
    if (bmi && bmi < 16) {
      warnings.push('BMI rất thấp - cần khám bác sĩ ngay');
      actions.push({ nhom: 'can_thiep', hanh_dong: 'Khám bác sĩ để sàng lọc nguyên nhân thiếu cân', muc_do: 'cao', ly_do: 'BMI < 16 có thể liên quan nguy cơ sức khỏe', tan_suat: 'Som nhat co the' });
    }

    if (sleepScore > 0 && sleepScore <= 2) {
      warnings.push('Chất lượng giấc ngủ thấp, nên ưu tiên cải thiện giấc ngủ');
      actions.push({ nhom: 'giac_ngu', hanh_dong: 'Giảm caffeine sau 14:00 và tắt màn hình trước ngủ 60 phút', muc_do: 'trung_binh', ly_do: 'Cải thiện chất lượng giấc ngủ', tan_suat: 'Hang ngay' });
    }
    if (stressScore >= 4) {
      warnings.push('Mức độ căng thẳng cao, nên kết hợp thư giãn và vận động nhẹ');
      actions.push({ nhom: 'cang_thang', hanh_dong: 'Thực hành thở sâu 10 phút/ngày hoặc đi bộ nhẹ sau bữa tối', muc_do: 'trung_binh', ly_do: 'Giảm stress giúp ổn định hành vi ăn uống', tan_suat: 'Hang ngay' });
    }

    // Cảnh báo từ chỉ số
    warnings.push(...(summary.warnings || []));

    const priority = warnings.length > 0 ? 'cao' : 'trung_binh';
    const now = new Date();

    const result = await this.dataSource.query(
      `INSERT INTO goi_y_suc_khoe (tai_khoan_id,phien_chat_ai_id,loai_goi_y,input_snapshot,
       noi_dung_goi_y,muc_do_uu_tien,canh_bao,ly_do,trang_thai,tao_luc,cap_nhat_luc)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [userId, null, 'ke_hoach_suc_khoe', JSON.stringify(inputSnapshot),
       JSON.stringify(actions), priority, JSON.stringify(warnings),
       `Goi y dua tren ho so va chi so moi nhat - BMI: ${bmi ?? 'chua co'}`,
       'moi_tao', now, now],
    );

    const [created] = await this.dataSource.query('SELECT * FROM goi_y_suc_khoe WHERE id = ?', [result.insertId]);
    return {
      ...created,
      input_snapshot: parseJson(created.input_snapshot),
      noi_dung_goi_y: parseJson(created.noi_dung_goi_y),
      canh_bao: parseJson(created.canh_bao) ?? [],
    };
  }

  async applyHealthRecommendation(accountId: number | undefined, recId: number) {
    const userId = await this.assertAccount(accountId);
    const [rec] = await this.dataSource.query(
      'SELECT * FROM goi_y_suc_khoe WHERE id = ? AND tai_khoan_id = ?', [recId, userId],
    );
    if (!rec) throw new NotFoundException('Khong tim thay goi y');
    if (rec.trang_thai === 'da_ap_dung') throw new BadRequestException('Goi y da duoc ap dung');

    const now = new Date();
    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `UPDATE goi_y_suc_khoe
         SET trang_thai='luu_tru', cap_nhat_luc=?
         WHERE tai_khoan_id=? AND trang_thai='da_ap_dung' AND id<>?`,
        [now, userId, recId],
      );
      await manager.query(
        `UPDATE goi_y_suc_khoe SET trang_thai='da_ap_dung', ap_dung_luc=?, cap_nhat_luc=? WHERE id=?`,
        [now, now, recId],
      );
    });
    return { ok: true, message: 'Da chon ke hoach suc khoe dang ap dung', active_recommendation_id: recId };
  }

  async archiveHealthRecommendation(accountId: number | undefined, recId: number) {
    const userId = await this.assertAccount(accountId);
    const [rec] = await this.dataSource.query(
      'SELECT * FROM goi_y_suc_khoe WHERE id = ? AND tai_khoan_id = ?', [recId, userId],
    );
    if (!rec) throw new NotFoundException('Khong tim thay goi y');

    await this.dataSource.query(
      `UPDATE goi_y_suc_khoe SET trang_thai='luu_tru', cap_nhat_luc=? WHERE id=?`,
      [new Date(), recId],
    );
    return { ok: true };
  }

  // ─── 13: Gợi ý dinh dưỡng & tập luyện ───

  async listWellnessRecommendations(accountId: number | undefined) {
    const userId = await this.assertAccount(accountId);
    const rows = await this.dataSource.query(
      `SELECT * FROM goi_y_dinh_duong_tap_luyen WHERE tai_khoan_id = ? ORDER BY tao_luc DESC LIMIT 20`,
      [userId],
    );
    return rows.map((r: Dict) => ({
      ...r,
      input_snapshot: parseJson(r.input_snapshot),
      goi_y_dinh_duong: parseJson(r.goi_y_dinh_duong) ?? [],
      goi_y_tap_luyen: parseJson(r.goi_y_tap_luyen) ?? [],
      canh_bao: parseJson(r.canh_bao) ?? [],
    }));
  }

  async getLatestWellnessRecommendation(accountId: number | undefined) {
    const userId = await this.assertAccount(accountId);
    const [profile] = await this.dataSource.query(
      'SELECT * FROM ho_so_suc_khoe WHERE tai_khoan_id = ?',
      [userId],
    );
    const completion = this.calcProfileCompletion(profile ?? null);
    const hasMinimumData = !!(profile && profile.chieu_cao_cm && profile.can_nang_hien_tai_kg);
    if (!hasMinimumData) {
      return {
        data_ready: false,
        completion,
        recommendation: null,
      };
    }

    const summary = await this.getHealthSummary(accountId);
    const currentSignature = this.wellnessRecommendationSignature(profile, summary);
    const [row] = await this.dataSource.query(
      `SELECT * FROM goi_y_dinh_duong_tap_luyen WHERE tai_khoan_id = ? ORDER BY tao_luc DESC LIMIT 1`,
      [userId],
    );
    if (!row) {
      const autoCreated = await this.generateWellnessRecommendation(accountId);
      return { data_ready: true, completion, auto_generated: true, recommendation: autoCreated };
    }
    const mapped = {
      ...row,
      input_snapshot: parseJson(row.input_snapshot),
      goi_y_dinh_duong: parseJson(row.goi_y_dinh_duong) ?? [],
      goi_y_tap_luyen: parseJson(row.goi_y_tap_luyen) ?? [],
      canh_bao: parseJson(row.canh_bao) ?? [],
    };
    const prevSignature = mapped.input_snapshot?.input_signature ?? null;
    if (this.signatureChanged(prevSignature, currentSignature)) {
      const autoCreated = await this.generateWellnessRecommendation(accountId);
      return { data_ready: true, completion, auto_generated: true, recommendation: autoCreated };
    }
    return { data_ready: true, completion, auto_generated: false, recommendation: mapped };
  }

  async generateWellnessRecommendation(accountId: number | undefined) {
    const userId = await this.assertAccount(accountId);

    const [profile] = await this.dataSource.query(
      'SELECT * FROM ho_so_suc_khoe WHERE tai_khoan_id = ?', [userId],
    );
    if (!profile || !profile.chieu_cao_cm || !profile.can_nang_hien_tai_kg) {
      throw new BadRequestException('Can bo sung chieu cao va can nang trong ho so suc khoe truoc');
    }

    const summary = await this.getHealthSummary(accountId);
    const diUng: string[] = this.normalizeStringList(profile.di_ung);
    const khongDung: string[] = this.normalizeStringList(profile.thuc_pham_khong_dung);
    const cheDoAn: string[] = this.normalizeStringList(profile.che_do_an_uu_tien);
    const tinhTrang: string[] = this.normalizeStringList(profile.tinh_trang_suc_khoe);

    // Tính TDEE (Mifflin-St Jeor)
    const weightKg = toNumber(profile.can_nang_hien_tai_kg);
    const heightCm = toNumber(profile.chieu_cao_cm);
    const age = profile.ngay_sinh ? Math.floor((Date.now() - new Date(profile.ngay_sinh).getTime()) / (365.25 * 24 * 3600 * 1000)) : 30;
    let bmr: number;
    if (profile.gioi_tinh === 'nu') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    }

    const activityMultiplier: Record<string, number> = {
      it_van_dong: 1.2, van_dong_nhe: 1.375, van_dong_vua: 1.55,
      nang_dong: 1.725, rat_nang_dong: 1.9,
    };
    const tdee = Math.round(bmr * (activityMultiplier[profile.muc_do_van_dong] ?? 1.375));

    let targetCalories = tdee;
    const mucTieu = profile.muc_tieu_suc_khoe;
    if (mucTieu === 'giam_can') targetCalories = tdee - 400;
    else if (mucTieu === 'tang_can') targetCalories = tdee + 400;

    // Macros (tỷ lệ chuẩn)
    const proteinG = Math.round((targetCalories * 0.3) / 4);
    const carbG = Math.round((targetCalories * 0.4) / 4);
    const fatG = Math.round((targetCalories * 0.3) / 9);

    // Gợi ý dinh dưỡng
    const nutritionItems: Array<Record<string, unknown>> = [];
    nutritionItems.push({ goi_y: 'Ăn đủ rau xanh và trái cây (5 phần/ngày)', loai: 'uu_tien', ly_do: 'Cung cấp vitamin, khoáng chất và chất xơ', tan_suat: 'Hang ngay', bua_goi_y: 'Trưa/Tối' });
    nutritionItems.push({ goi_y: 'Protein nạc: ức gà, cá, đậu, trứng', loai: 'uu_tien', ly_do: `Đạt mục tiêu ${proteinG}g protein/ngày`, tan_suat: '2-3 bua/ngay' });
    nutritionItems.push({ goi_y: 'Hạn chế đường tinh luyện và thức ăn chế biến sẵn', loai: 'han_che', ly_do: 'Giảm lượng calo rỗng', tan_suat: 'Lien tuc' });

    if (diUng.length > 0) {
      nutritionItems.push({ goi_y: `Tránh tuyệt đối: ${diUng.join(', ')}`, loai: 'tranh', ly_do: 'Dị ứng đã khai báo', do_uu_tien: 'bat_buoc' });
    }
    if (khongDung.length > 0) {
      nutritionItems.push({ goi_y: `Hạn chế: ${khongDung.join(', ')}`, loai: 'han_che', ly_do: 'Thực phẩm không dùng theo sở thích', thay_the_goi_y: 'Ưu tiên nguồn đạm nạc hoặc thực phẩm tương đương' });
    }
    if (cheDoAn.length > 0) {
      nutritionItems.push({ goi_y: `Ưu tiên theo chế độ ăn: ${cheDoAn.join(', ')}`, loai: 'uu_tien', ly_do: 'Tôn trọng chế độ ăn đã khai báo' });
    }
    if (mucTieu === 'giam_can') {
      nutritionItems.push({ goi_y: 'Áp dụng nguyên tắc đĩa ăn 1/2 rau - 1/4 đạm - 1/4 tinh bột', loai: 'uu_tien', ly_do: 'Dễ duy trì thâm hụt kcal mà vẫn no', bua_goi_y: 'Trưa/Tối' });
    }
    if (mucTieu === 'tang_can') {
      nutritionItems.push({ goi_y: 'Thêm 1 bữa phụ sau tập với sữa chua Hy Lạp + chuối + hạt', loai: 'uu_tien', ly_do: 'Tăng năng lượng và phục hồi cơ', bua_goi_y: 'Sau tập' });
    }

    // Gợi ý tập luyện
    const exerciseItems: Array<Record<string, unknown>> = [];
    const vanDong = profile.muc_do_van_dong;

    if (vanDong === 'it_van_dong') {
      exerciseItems.push({ goi_y: 'Đi bộ 30 phút/ngày', muc_do: 'nhe', ly_do: 'Bắt đầu nhẹ nhàng để tạo thói quen', tan_suat: '5-6 ngay/tuần', thoi_luong: '30 phut' });
      exerciseItems.push({ goi_y: 'Yoga hoặc stretching 15 phút/ngày', muc_do: 'nhe', ly_do: 'Cải thiện linh hoạt cơ thể', tan_suat: 'Hang ngay', thoi_luong: '15 phut' });
    } else if (vanDong === 'van_dong_nhe' || vanDong === 'van_dong_vua') {
      exerciseItems.push({ goi_y: 'Cardio 30-45 phút', muc_do: 'vua', ly_do: 'Duy trì sức khỏe tim mạch', tan_suat: '4-5 ngay/tuần', thoi_luong: '30-45 phut' });
      exerciseItems.push({ goi_y: 'Tập tạ/bodyweight', muc_do: 'vua', ly_do: 'Tăng cường cơ bắp', tan_suat: '3 ngay/tuần', thoi_luong: '40 phut' });
    } else {
      exerciseItems.push({ goi_y: 'HIIT 3 ngày + Strength 3 ngày/tuần', muc_do: 'nang', ly_do: 'Tối ưu hiệu suất tập luyện', tan_suat: '6 ngay/tuần', thoi_luong: '45-60 phut' });
      exerciseItems.push({ goi_y: 'Nghỉ ngơi chủ động ít nhất 1 ngày/tuần', muc_do: 'quan_trong', ly_do: 'Phục hồi cơ bắp và giảm chấn thương', tan_suat: '1 ngay/tuần' });
    }

    // Cảnh báo
    const warnings: string[] = [];
    if (tinhTrang.length > 0) {
      warnings.push(`Lưu ý tình trạng sức khỏe: ${tinhTrang.join(', ')} - nên tham khảo chuyên gia trước khi áp dụng`);
      exerciseItems.push({ goi_y: 'Giữ cường độ tập ở mức nhẹ-vừa, theo dõi phản ứng cơ thể', muc_do: 'quan_trong', ly_do: 'Có tình trạng sức khỏe cần lưu ý' });
    }
    if (summary.bmi && summary.bmi > 35) {
      warnings.push('BMI rất cao - nên tư vấn bác sĩ trước khi tập luyện cường độ cao');
    }
    warnings.push(...(summary.warnings || []));

    const inputSnapshot = {
      profile: { gioi_tinh: profile.gioi_tinh, chieu_cao_cm: heightCm, can_nang_kg: weightKg, muc_do_van_dong: vanDong, muc_tieu: mucTieu, di_ung: diUng, khong_dung: khongDung, che_do_an: cheDoAn, tinh_trang: tinhTrang },
      calculated: { bmr: Math.round(bmr), tdee, target_calories: targetCalories, bmi: summary.bmi },
      input_signature: this.wellnessRecommendationSignature(profile, summary),
      generated_at: new Date().toISOString(),
    };

    const now = new Date();
    const result = await this.dataSource.query(
      `INSERT INTO goi_y_dinh_duong_tap_luyen (tai_khoan_id,phien_chat_ai_id,input_snapshot,
       muc_tieu_calories,muc_tieu_protein_g,muc_tieu_carb_g,muc_tieu_fat_g,
       goi_y_dinh_duong,goi_y_tap_luyen,canh_bao,ly_do,trang_thai,tao_luc,cap_nhat_luc)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [userId, null, JSON.stringify(inputSnapshot), targetCalories, proteinG, carbG, fatG,
       JSON.stringify(nutritionItems), JSON.stringify(exerciseItems), JSON.stringify(warnings),
       `Goi y theo TDEE ${tdee} kcal, muc tieu: ${mucTieu}`, 'moi_tao', now, now],
    );

    const [created] = await this.dataSource.query('SELECT * FROM goi_y_dinh_duong_tap_luyen WHERE id = ?', [result.insertId]);
    return {
      ...created,
      input_snapshot: parseJson(created.input_snapshot),
      goi_y_dinh_duong: parseJson(created.goi_y_dinh_duong) ?? [],
      goi_y_tap_luyen: parseJson(created.goi_y_tap_luyen) ?? [],
      canh_bao: parseJson(created.canh_bao) ?? [],
    };
  }

  async applyWellnessRecommendation(accountId: number | undefined, recId: number) {
    const userId = await this.assertAccount(accountId);
    const [rec] = await this.dataSource.query(
      'SELECT * FROM goi_y_dinh_duong_tap_luyen WHERE id = ? AND tai_khoan_id = ?', [recId, userId],
    );
    if (!rec) throw new NotFoundException('Khong tim thay goi y');
    if (rec.trang_thai === 'da_ap_dung') throw new BadRequestException('Goi y da duoc ap dung');

    const now = new Date();
    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `UPDATE goi_y_dinh_duong_tap_luyen
         SET trang_thai='luu_tru', cap_nhat_luc=?
         WHERE tai_khoan_id=? AND trang_thai='da_ap_dung' AND id<>?`,
        [now, userId, recId],
      );
      await manager.query(
        `UPDATE goi_y_dinh_duong_tap_luyen SET trang_thai='da_ap_dung', ap_dung_luc=?, cap_nhat_luc=? WHERE id=?`,
        [now, now, recId],
      );
    });
    return { ok: true, message: 'Da chon ke hoach dinh duong/tap luyen dang ap dung', active_recommendation_id: recId };
  }

  async askExpertAboutRecommendation(accountId: number | undefined, recId: number) {
    const userId = await this.assertAccount(accountId);
    const [rec] = await this.dataSource.query(
      'SELECT * FROM goi_y_dinh_duong_tap_luyen WHERE id = ? AND tai_khoan_id = ?', [recId, userId],
    );
    if (!rec) throw new NotFoundException('Khong tim thay goi y');

    // Kiểm tra có gói dịch vụ đang hoạt động
    const [activePkg] = await this.dataSource.query(
      `SELECT gdm.id FROM goi_da_mua gdm WHERE gdm.tai_khoan_id = ? AND gdm.trang_thai = 'dang_hieu_luc' AND gdm.so_luot_con_lai > 0 LIMIT 1`,
      [userId],
    );

    return {
      has_active_package: !!activePkg,
      package_purchase_id: activePkg?.id ?? null,
      message: activePkg
        ? 'Ban co goi dich vu dang hoat dong. Hay dat lich voi chuyen gia de duoc tu van chi tiet.'
        : 'Ban chua co goi dich vu. Hay mua goi de duoc tu van boi chuyen gia.',
      recommendation_id: recId,
    };
  }
}
