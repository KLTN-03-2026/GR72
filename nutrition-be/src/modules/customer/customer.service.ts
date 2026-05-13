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
import { OpenAiService } from '../../common/openai/openai.service';

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
    private readonly openAi: OpenAiService,
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

  async listServicePackages(accountId: number | undefined, query: Dict) {
    const userId = accountId ? await this.assertAccount(accountId) : null;
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

    const ownershipColumns = userId
      ? `,
              EXISTS(
                SELECT 1
                FROM goi_da_mua gdm
                WHERE gdm.tai_khoan_id = ?
                  AND gdm.goi_dich_vu_id = gdv.id
                  AND gdm.trang_thai IN ('dang_hieu_luc', 'het_luot', 'cho_thanh_toan')
                  AND (
                    gdm.trang_thai = 'cho_thanh_toan'
                    OR gdm.het_han_luc IS NULL
                    OR gdm.het_han_luc >= NOW()
                  )
              ) AS da_so_huu,
              EXISTS(
                SELECT 1
                FROM goi_da_mua gdm2
                JOIN goi_dich_vu gdv2 ON gdv2.id = gdm2.goi_dich_vu_id
                WHERE gdm2.tai_khoan_id = ?
                  AND gdv2.loai_goi = gdv.loai_goi
                  AND gdm2.trang_thai IN ('dang_hieu_luc', 'het_luot')
                  AND (gdm2.het_han_luc IS NULL OR gdm2.het_han_luc >= NOW())
              ) AS da_co_goi_cung_loai`
      : `,
              0 AS da_so_huu,
              0 AS da_co_goi_cung_loai`;

    const rows = await this.dataSource.query(
      `SELECT gdv.*${ownershipColumns},
              COUNT(DISTINCT gdcg.chuyen_gia_id) AS so_chuyen_gia,
              COALESCE(AVG(cg.diem_danh_gia_trung_binh), 0) AS rating_trung_binh
       FROM goi_dich_vu gdv
       LEFT JOIN goi_dich_vu_chuyen_gia gdcg ON gdcg.goi_dich_vu_id = gdv.id AND gdcg.trang_thai = 'hoat_dong'
       LEFT JOIN chuyen_gia cg ON cg.id = gdcg.chuyen_gia_id AND cg.trang_thai = 'hoat_dong' AND cg.nhan_booking = 1
       WHERE ${where.join(' AND ')}
       GROUP BY gdv.id
       ORDER BY gdv.thu_tu_hien_thi ASC, gdv.id DESC`,
      userId ? [userId, userId, ...params] : params,
    );
    return rows.map((row: Dict) => ({
      ...row,
      quyen_loi: parseJson(row.quyen_loi) ?? [],
      so_chuyen_gia: toNumber(row.so_chuyen_gia),
      rating_trung_binh: Number(row.rating_trung_binh ?? 0),
      da_so_huu: !!toNumber(row.da_so_huu),
      da_co_goi_cung_loai: !!toNumber(row.da_co_goi_cung_loai),
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

      const pending = await manager.query(
        `SELECT gdm.id AS purchase_id, tt.id AS payment_id, tt.payment_url, tt.txn_ref, tt.so_tien, tt.trang_thai
         FROM goi_da_mua gdm
         JOIN thanh_toan tt ON tt.loai_thanh_toan = 'mua_goi' AND tt.doi_tuong_id = gdm.id
         WHERE gdm.tai_khoan_id = ?
           AND gdm.goi_dich_vu_id = ?
           AND gdm.trang_thai = 'cho_thanh_toan'
           AND tt.trang_thai = 'cho_thanh_toan'
           AND (tt.het_han_luc IS NULL OR tt.het_han_luc >= NOW())
         ORDER BY tt.tao_luc DESC
         LIMIT 1`,
        [userId, packageId],
      );
      if (pending.length) {
        const row = pending[0];
        return {
          package_purchase_id: row.purchase_id,
          payment_id: row.payment_id,
          payment_url: row.payment_url,
          txn_ref: row.txn_ref,
          amount: Number(row.so_tien),
          status: row.trang_thai,
          message: 'Ban dang co don mua goi nay cho thanh toan. Vui long hoan tat truoc khi tao don moi.',
        };
      }

      const activeSamePackage = await manager.query(
        `SELECT id
         FROM goi_da_mua
         WHERE tai_khoan_id = ?
           AND goi_dich_vu_id = ?
           AND trang_thai IN ('dang_hieu_luc', 'het_luot')
           AND (het_han_luc IS NULL OR het_han_luc >= NOW())
         LIMIT 1`,
        [userId, packageId],
      );
      if (activeSamePackage.length) {
        throw new BadRequestException('Ban da so huu goi nay va van con hieu luc');
      }

      const activeSameType = await manager.query(
        `SELECT gdm.id
         FROM goi_da_mua gdm
         JOIN goi_dich_vu gdv ON gdv.id = gdm.goi_dich_vu_id
         WHERE gdm.tai_khoan_id = ?
           AND gdv.loai_goi = ?
           AND gdm.trang_thai IN ('dang_hieu_luc', 'het_luot')
           AND (gdm.het_han_luc IS NULL OR gdm.het_han_luc >= NOW())
         LIMIT 1`,
        [userId, pkg.loai_goi],
      );
      if (activeSameType.length) {
        throw new BadRequestException('Ban dang co goi cung loai con hieu luc. Vui long su dung het hoac doi den khi het han.');
      }

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

        // Buffer 30 phút: chuyên gia cần thời gian chuẩn bị, không cho book sát giờ
        const MIN_LEAD_TIME_MS = 30 * 60 * 1000;
        const minBookableTime = Date.now() + MIN_LEAD_TIME_MS;

        while (cursor.getTime() + duration * 60 * 1000 <= endTime.getTime()) {
          const candidateStart = cursor.getTime();
          const candidateEnd = candidateStart + duration * 60 * 1000;
          const isBusy = busyRanges.some((range) => candidateStart < range.end && candidateEnd > range.start);
          if (!isBusy && candidateStart > minBookableTime) {
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

      const [booking] = await manager.query(
        `SELECT lh.*, gdv.ten_goi, tk.ho_ten AS expert_name, tk.email AS expert_email
         FROM lich_hen lh
         JOIN goi_dich_vu gdv ON gdv.id = lh.goi_dich_vu_id
         JOIN chuyen_gia cg ON cg.id = lh.chuyen_gia_id
         JOIN tai_khoan tk ON tk.id = cg.tai_khoan_id
         WHERE lh.id = ? AND lh.tai_khoan_id = ?`,
        [result.insertId, userId],
      );
      if (!booking) throw new NotFoundException('Khong tim thay booking cua khach hang');

      const timeline = await manager.query(
        'SELECT * FROM booking_timeline WHERE lich_hen_id = ? ORDER BY tao_luc ASC',
        [result.insertId],
      );
      const payment = await manager.query(
        `SELECT * FROM thanh_toan WHERE loai_thanh_toan = 'booking' AND doi_tuong_id = ? ORDER BY tao_luc DESC LIMIT 1`,
        [result.insertId],
      );

      return { booking, timeline, payment: payment[0] ?? null };
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
      `SELECT tt.*, gdm.ma_goi_da_mua, gdm.so_luot_tong, gdm.so_luot_da_dung, gdm.so_luot_con_lai,
              gdm.bat_dau_luc AS goi_bat_dau_luc, gdm.het_han_luc AS goi_het_han_luc,
              gdv.ten_goi, gdv.loai_goi, gdv.thoi_han_ngay, gdv.so_luot_tu_van, gdv.thoi_luong_tu_van_phut, gdv.thumbnail_url AS goi_thumbnail_url
       FROM thanh_toan tt
       LEFT JOIN goi_da_mua gdm ON tt.loai_thanh_toan = 'mua_goi' AND gdm.id = tt.doi_tuong_id
       LEFT JOIN goi_dich_vu gdv ON gdv.id = gdm.goi_dich_vu_id
       WHERE tt.id = ? AND tt.tai_khoan_id = ?`,
      [paymentId, userId],
    );
    if (!payment) throw new NotFoundException('Khong tim thay giao dich');

    const webhooks = await this.dataSource.query(
      `SELECT id, loai_webhook, hop_le, tao_luc FROM payment_webhook_log WHERE thanh_toan_id = ? ORDER BY tao_luc DESC`,
      [paymentId],
    );
    const refunds = await this.dataSource.query(
      `SELECT id, so_tien AS so_tien_hoan, ly_do, trang_thai, tao_luc, xu_ly_luc AS hoan_tat_luc FROM refund WHERE thanh_toan_id = ? ORDER BY tao_luc DESC`,
      [paymentId],
    );
    return { ...payment, webhooks, refunds };
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
    const userId = await this.assertAccount(accountId);
    const booking = await this.assertBooking(accountId, bookingId);
    const cancellable = ['cho_xac_nhan', 'cho_thanh_toan', 'da_xac_nhan'];
    if (!cancellable.includes(booking.trang_thai)) {
      throw new BadRequestException('Khong the huy booking o trang thai nay');
    }

    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
      await manager.query(
        `UPDATE lich_hen SET trang_thai='da_huy', ly_do_huy=?, huy_boi=?, huy_luc=?, cap_nhat_luc=? WHERE id=?`,
        [body.ly_do ?? null, userId, now, now, bookingId],
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
    const maTicket = makeCode('KN').slice(0, 80);
    const mucUuTien = ['thap', 'trung_binh', 'cao'].includes(String(body.muc_uu_tien ?? ''))
      ? String(body.muc_uu_tien)
      : 'trung_binh';

    const result = await this.dataSource.query(
      `INSERT INTO khieu_nai (nguoi_gui_id,loai_khieu_nai,doi_tuong_id,ma_khieu_nai,tieu_de,noi_dung,muc_uu_tien,trang_thai,tao_luc,cap_nhat_luc)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [userId, loai, toNumber(body.doi_tuong_id) || null, maTicket,
       String(body.tieu_de ?? noiDung).slice(0, 191), noiDung,
       mucUuTien, 'moi', now, now],
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

    const [ticket] = await this.dataSource.query(
      `SELECT kn.*,
              kn.loai_khieu_nai AS loai,
              kn.ma_khieu_nai AS ma_ticket,
              '[]' AS bang_chung_url
       FROM khieu_nai kn
       WHERE kn.id = ?`,
      [result.insertId],
    );
    return ticket ?? null;
  }

  async listComplaints(accountId: number | undefined, query: Dict) {
    const userId = await this.assertAccount(accountId);
    const where = ['kn.nguoi_gui_id = ?'];
    const params: unknown[] = [userId];
    if (query.status) { where.push('kn.trang_thai = ?'); params.push(query.status); }

    return this.dataSource.query(
      `SELECT kn.*,
              kn.loai_khieu_nai AS loai,
              kn.ma_khieu_nai AS ma_ticket,
              '[]' AS bang_chung_url,
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
      `SELECT kn.*,
              kn.loai_khieu_nai AS loai,
              kn.ma_khieu_nai AS ma_ticket,
              '[]' AS bang_chung_url
       FROM khieu_nai kn
       WHERE kn.id = ? AND kn.nguoi_gui_id = ?`,
      [complaintId, userId],
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
    return { ...complaint, bang_chung_url: [], messages };
  }

  async addComplaintMessage(accountId: number | undefined, complaintId: number, body: Dict) {
    const userId = await this.assertAccount(accountId);
    const [complaint] = await this.dataSource.query(
      'SELECT * FROM khieu_nai WHERE id = ? AND nguoi_gui_id = ?', [complaintId, userId],
    );
    if (!complaint) throw new NotFoundException('Khong tim thay khieu nai');
    if (['da_dong', 'da_giai_quyet'].includes(String(complaint.trang_thai))) {
      throw new BadRequestException('Khieu nai da dong, khong the gui them tin nhan');
    }

    const content = String(body.noi_dung ?? '').trim();
    if (!content) throw new BadRequestException('Noi dung khong duoc trong');

    const now = new Date();
    await this.dataSource.query(
      `INSERT INTO khieu_nai_tin_nhan (khieu_nai_id,nguoi_gui_id,noi_dung,tep_dinh_kem,tao_luc)
       VALUES (?,?,?,?,?)`,
      [complaintId, userId, content, JSON.stringify(body.tep_dinh_kem ?? []), now],
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

  private async loadAiContext(userId: number, contextType: string) {
    const [profile] = await this.dataSource.query(
      `SELECT gioi_tinh, ngay_sinh, chieu_cao_cm, can_nang_hien_tai_kg, muc_do_van_dong, muc_tieu_suc_khoe
       FROM ho_so_suc_khoe WHERE tai_khoan_id = ?`,
      [userId],
    );
    const [latestMetric] = await this.dataSource.query(
      `SELECT can_nang_kg, bmi, huyet_ap_tam_thu, huyet_ap_tam_truong
       FROM chi_so_suc_khoe WHERE tai_khoan_id = ? ORDER BY do_luc DESC LIMIT 1`,
      [userId],
    );
    return {
      loaiContext: contextType,
      profile: profile ?? null,
      latestMetric: latestMetric ?? null,
    };
  }

  async sendAiChatMessage(accountId: number | undefined, sessionId: number, body: Dict) {
    const { userId, session } = await this.assertAiSession(accountId, sessionId);
    if (session.trang_thai === 'da_luu_tru') {
      throw new BadRequestException('Phien chat da luu tru, khong the gui them tin nhan');
    }
    const content = String(body.noi_dung ?? '').trim();
    if (!content) throw new BadRequestException('Noi dung cau hoi khong duoc trong');

    const contextType = String(session.loai_context ?? 'tu_van_chung');
    const aiContext = await this.loadAiContext(userId, contextType);

    // Lấy lịch sử 10 message gần nhất để giữ ngữ cảnh hội thoại
    const historyRows: Dict[] = await this.dataSource.query(
      `SELECT vai_tro, noi_dung FROM tin_nhan_chat_ai
       WHERE phien_chat_ai_id = ? ORDER BY tao_luc DESC LIMIT 10`,
      [sessionId],
    );
    const history = historyRows
      .reverse()
      .map((row) => ({
        role: row.vai_tro === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: String(row.noi_dung ?? ''),
      }));

    const reply = await this.openAi.generateReply(content, history, aiContext);
    const now = new Date();

    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `INSERT INTO tin_nhan_chat_ai (phien_chat_ai_id, vai_tro, noi_dung, model, token_input, token_output, trang_thai, loi, metadata, tao_luc)
         VALUES (?, 'user', ?, NULL, NULL, NULL, 'thanh_cong', NULL, NULL, ?)`,
        [sessionId, content, now],
      );
      await manager.query(
        `INSERT INTO tin_nhan_chat_ai (phien_chat_ai_id, vai_tro, noi_dung, model, token_input, token_output, trang_thai, loi, metadata, tao_luc)
         VALUES (?, 'assistant', ?, ?, ?, ?, 'thanh_cong', NULL, ?, ?)`,
        [
          sessionId,
          reply.content,
          reply.model,
          reply.tokenInput ?? null,
          reply.tokenOutput ?? null,
          JSON.stringify({ fallback: reply.fallback, disclaimer: true }),
          new Date(),
        ],
      );
      await manager.query('UPDATE phien_chat_ai SET cap_nhat_luc = ? WHERE id = ?', [new Date(), sessionId]);
    });

    return this.getAiChatMessages(userId, sessionId);
  }

  async getAiSuggestedQuestions(accountId: number | undefined, sessionId: number | null) {
    const userId = await this.assertAccount(accountId);
    let contextType = 'tu_van_chung';
    if (sessionId) {
      const [session] = await this.dataSource.query(
        'SELECT loai_context FROM phien_chat_ai WHERE id = ? AND tai_khoan_id = ?',
        [sessionId, userId],
      );
      if (session?.loai_context) contextType = String(session.loai_context);
    }
    const aiContext = await this.loadAiContext(userId, contextType);
    const questions = await this.openAi.generateSuggestedQuestions(aiContext);
    return { context_type: contextType, questions };
  }

  async archiveAiChatSession(accountId: number | undefined, sessionId: number) {
    await this.assertAiSession(accountId, sessionId);
    await this.dataSource.query(
      `UPDATE phien_chat_ai SET trang_thai = 'da_luu_tru', cap_nhat_luc = ? WHERE id = ?`,
      [new Date(), sessionId],
    );
    return { ok: true };
  }

  async getProfile(accountId: number | undefined) {
    const userId = await this.assertAccount(accountId);
    const [row] = await this.dataSource.query(
      `SELECT tk.id, tk.email, tk.ho_ten, tk.so_dien_thoai, tk.vai_tro, tk.trang_thai,
              hsc.gioi_tinh, hsc.ngay_sinh, hsc.anh_dai_dien_url, hsc.ghi_chu_suc_khoe
       FROM tai_khoan tk
       LEFT JOIN ho_so_customer hsc ON hsc.tai_khoan_id = tk.id
       WHERE tk.id = ?`,
      [userId],
    );
    if (!row) throw new NotFoundException('Khong tim thay tai khoan');
    return row;
  }

  async updateProfile(accountId: number | undefined, body: Dict) {
    const userId = await this.assertAccount(accountId);
    const hoTen = typeof body.ho_ten === 'string' ? body.ho_ten.trim() : '';
    const soDienThoai = typeof body.so_dien_thoai === 'string' ? body.so_dien_thoai.trim() : '';
    const gioiTinh = typeof body.gioi_tinh === 'string' ? body.gioi_tinh.trim() : '';
    const ngaySinh = typeof body.ngay_sinh === 'string' ? body.ngay_sinh.trim() : '';
    const ghiChu = typeof body.ghi_chu_suc_khoe === 'string' ? body.ghi_chu_suc_khoe.trim() : '';

    if (!hoTen) throw new BadRequestException('Ho ten khong duoc de trong');
    if (hoTen.length > 150) throw new BadRequestException('Ho ten qua dai');
    if (soDienThoai && soDienThoai.length > 30) throw new BadRequestException('So dien thoai khong hop le');
    if (gioiTinh && !['nam', 'nu', 'khac'].includes(gioiTinh)) throw new BadRequestException('Gioi tinh khong hop le');
    if (ngaySinh && Number.isNaN(new Date(ngaySinh).getTime())) throw new BadRequestException('Ngay sinh khong hop le');

    const now = new Date();
    await this.dataSource.transaction(async (manager) => {
      await manager.query('UPDATE tai_khoan SET ho_ten = ?, so_dien_thoai = ?, cap_nhat_luc = ? WHERE id = ?', [
        hoTen,
        soDienThoai || null,
        now,
        userId,
      ]);

      const [existing] = await manager.query('SELECT id FROM ho_so_customer WHERE tai_khoan_id = ? LIMIT 1', [userId]);
      if (!existing) {
        await manager.query(
          `INSERT INTO ho_so_customer (tai_khoan_id, gioi_tinh, ngay_sinh, anh_dai_dien_url, ghi_chu_suc_khoe, tao_luc, cap_nhat_luc)
           VALUES (?, ?, ?, NULL, ?, ?, ?)`,
          [userId, gioiTinh || null, ngaySinh || null, ghiChu || null, now, now],
        );
      } else {
        await manager.query(
          `UPDATE ho_so_customer
           SET gioi_tinh = ?, ngay_sinh = ?, ghi_chu_suc_khoe = ?, cap_nhat_luc = ?
           WHERE tai_khoan_id = ?`,
          [gioiTinh || null, ngaySinh || null, ghiChu || null, now, userId],
        );
      }
    });

    return this.getProfile(userId);
  }

  async updateAvatar(accountId: number | undefined, avatarUrl: string) {
    const userId = await this.assertAccount(accountId);
    if (!avatarUrl) throw new BadRequestException('Anh dai dien khong hop le');
    const now = new Date();

    await this.dataSource.transaction(async (manager) => {
      const [existing] = await manager.query('SELECT id FROM ho_so_customer WHERE tai_khoan_id = ? LIMIT 1', [userId]);
      if (!existing) {
        await manager.query(
          `INSERT INTO ho_so_customer (tai_khoan_id, gioi_tinh, ngay_sinh, anh_dai_dien_url, ghi_chu_suc_khoe, tao_luc, cap_nhat_luc)
           VALUES (?, NULL, NULL, ?, NULL, ?, ?)`,
          [userId, avatarUrl, now, now],
        );
      } else {
        await manager.query(
          `UPDATE ho_so_customer SET anh_dai_dien_url = ?, cap_nhat_luc = ? WHERE tai_khoan_id = ?`,
          [avatarUrl, now, userId],
        );
      }
    });

    return this.getProfile(userId);
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

    const [profile] = await this.dataSource.query(
      'SELECT * FROM ho_so_suc_khoe WHERE tai_khoan_id = ?', [userId],
    );

    // Chỉ yêu cầu 4 trường cốt lõi, không block toàn bộ khi thiếu trường phụ
    const coreFields = ['gioi_tinh', 'ngay_sinh', 'chieu_cao_cm', 'muc_tieu_suc_khoe'];
    const missingCore = coreFields.filter((f) => !profile?.[f]);
    if (!profile || missingCore.length > 0) {
      const completion = this.calcProfileCompletion(profile);
      throw new BadRequestException(`Vui long bo sung ho so suc khoe. Thieu: ${(missingCore.length ? missingCore : completion.missing).join(', ')}`);
    }

    const latest = await this.getLatestMetric(accountId);
    const summary = await this.getHealthSummary(accountId);

    const mucTieu  = profile.muc_tieu_suc_khoe as string;
    const vanDong  = profile.muc_do_van_dong as string;
    const gioi     = profile.gioi_tinh as string;
    const bmi      = summary.bmi as number | null;
    const bmiCat   = summary.bmiCategory as string;
    const trend    = summary.weightTrend as string;
    const age      = profile.ngay_sinh
      ? Math.floor((Date.now() - new Date(profile.ngay_sinh).getTime()) / (365.25 * 24 * 3600 * 1000))
      : 30;

    const tinhTrang: string[] = this.normalizeStringList(profile.tinh_trang_suc_khoe);
    const diUng: string[]     = this.normalizeStringList(profile.di_ung);
    const ghi_chu: string     = profile.ghi_chu_cho_chuyen_gia ?? '';

    const sleepScore  = toNumber(latest?.chat_luong_giac_ngu);
    const stressScore = toNumber(latest?.muc_do_cang_thang);
    const energyScore = toNumber(latest?.muc_nang_luong);
    const waistCm     = toNumber(latest?.vong_eo_cm);
    const bloodSugar  = toNumber(latest?.duong_huyet);
    const systolic    = toNumber(latest?.huyet_ap_tam_thu);
    const heartRate   = toNumber(latest?.nhip_tim);
    const currentWeight = toNumber(latest?.can_nang_kg ?? profile.can_nang_hien_tai_kg);

    const actions: Array<Record<string, unknown>> = [];
    const warnings: string[] = [...(summary.warnings ?? [])];

    // ── 1. Mục tiêu cân nặng (tuỳ goal + BMI + trend) ──────────────────────
    if (mucTieu === 'giam_can') {
      const deficit = bmi && bmi > 35 ? '500-600' : '300-500';
      actions.push({ nhom: 'muc_tieu', hanh_dong: `Giảm ${deficit} kcal/ngày so với TDEE`, muc_do: 'cao',
        ly_do: `BMI ${bmi ?? '?'} (${bmiCat}) — cần giảm từ từ để bảo toàn cơ`, tan_suat: 'Hàng ngày', ket_qua_ky_vong: 'Giảm 0.5–1 kg/tuần' });
      if (trend === 'tang') {
        actions.push({ nhom: 'muc_tieu', hanh_dong: 'Cân nặng đang tăng — ưu tiên cắt tinh bột tinh chế trước', muc_do: 'cao',
          ly_do: 'Xu hướng tăng cân cần can thiệp ngay để đảo chiều', tan_suat: 'Hàng ngày' });
      }
      if (trend === 'giam') {
        actions.push({ nhom: 'muc_tieu', hanh_dong: 'Đang giảm cân tốt — duy trì thâm hụt calo ổn định', muc_do: 'trung_binh',
          ly_do: 'Xu hướng giảm cân đúng hướng, không cần thay đổi lớn', tan_suat: 'Hàng ngày' });
      }
    } else if (mucTieu === 'tang_can') {
      actions.push({ nhom: 'muc_tieu', hanh_dong: 'Tăng 300–400 kcal/ngày bằng thực phẩm giàu dinh dưỡng', muc_do: 'cao',
        ly_do: `BMI ${bmi ?? '?'} (${bmiCat}) — tăng cân lành mạnh thiên về cơ`, tan_suat: 'Hàng ngày', ket_qua_ky_vong: 'Tăng 0.3–0.5 kg/tuần' });
      if (trend === 'giam') {
        actions.push({ nhom: 'muc_tieu', hanh_dong: 'Cân nặng đang giảm — kiểm tra lại khẩu phần ăn ngay', muc_do: 'cao',
          ly_do: 'Ngược chiều mục tiêu, cần tăng ngay lượng calo nạp vào', tan_suat: 'Hàng ngày' });
      }
    } else if (mucTieu === 'giu_can') {
      actions.push({ nhom: 'muc_tieu', hanh_dong: 'Ăn đúng với TDEE, theo dõi cân nặng mỗi tuần', muc_do: 'trung_binh',
        ly_do: `Giữ BMI ổn định ở mức ${bmiCat}`, tan_suat: 'Hàng ngày' });
    } else {
      actions.push({ nhom: 'muc_tieu', hanh_dong: 'Xây dựng thói quen ăn uống cân bằng 4 nhóm chất', muc_do: 'cao',
        ly_do: 'Nền tảng cho sức khoẻ toàn diện', tan_suat: 'Hàng ngày' });
    }

    // ── 2. Vận động (tuỳ activity level + goal + BMI) ───────────────────────
    if (vanDong === 'it_van_dong') {
      actions.push({ nhom: 'van_dong', hanh_dong: 'Bắt đầu bằng đi bộ 20–30 phút/ngày', muc_do: 'cao',
        ly_do: 'Ít vận động là yếu tố nguy cơ hàng đầu, cần tạo thói quen nền', tan_suat: '5–6 ngày/tuần', thoi_luong: '20–30 phút' });
      actions.push({ nhom: 'van_dong', hanh_dong: 'Thêm stretching hoặc yoga nhẹ buổi tối', muc_do: 'trung_binh',
        ly_do: 'Cải thiện linh hoạt và giảm đau nhức do ngồi nhiều', tan_suat: 'Hàng ngày', thoi_luong: '10–15 phút' });
    } else if (vanDong === 'van_dong_nhe') {
      actions.push({ nhom: 'van_dong', hanh_dong: mucTieu === 'giam_can'
        ? 'Tăng lên cardio 40 phút, 5 ngày/tuần' : 'Cardio nhẹ 30 phút, 4 ngày/tuần', muc_do: 'cao',
        ly_do: 'Nâng dần cường độ để khai thác tiềm năng sức khoẻ tim mạch', tan_suat: '4–5 ngày/tuần', thoi_luong: '30–40 phút' });
      actions.push({ nhom: 'van_dong', hanh_dong: 'Thêm 2 buổi tập sức mạnh/tuần (squat, push-up, plank)', muc_do: 'trung_binh',
        ly_do: 'Cơ bắp giúp tăng trao đổi chất cơ bản', tan_suat: '2 ngày/tuần', thoi_luong: '30 phút' });
    } else if (vanDong === 'van_dong_vua') {
      if (mucTieu === 'giam_can') {
        actions.push({ nhom: 'van_dong', hanh_dong: 'Kết hợp HIIT 2 buổi + cardio bền 3 buổi/tuần', muc_do: 'cao',
          ly_do: 'HIIT đốt calo cao sau tập, cardio bền duy trì nền trao đổi chất', tan_suat: '5 ngày/tuần', thoi_luong: '35–45 phút' });
      } else {
        actions.push({ nhom: 'van_dong', hanh_dong: 'Duy trì 4–5 buổi/tuần, xen kẽ cardio và tạ', muc_do: 'trung_binh',
          ly_do: 'Mức vận động hiện tại phù hợp, chỉ cần duy trì đều đặn', tan_suat: '4–5 ngày/tuần' });
      }
    } else {
      actions.push({ nhom: 'van_dong', hanh_dong: 'Đảm bảo 1–2 ngày nghỉ tích cực/tuần (yoga, đi bộ nhẹ)', muc_do: 'cao',
        ly_do: 'Người tập nặng thường bỏ qua hồi phục — đây là lỗi phổ biến nhất', tan_suat: '1–2 ngày/tuần' });
      actions.push({ nhom: 'van_dong', hanh_dong: 'Theo dõi nhịp tim khi tập để tối ưu vùng đốt mỡ', muc_do: 'trung_binh',
        ly_do: 'Nhịp tim mục tiêu: 65–85% nhịp tim tối đa', tan_suat: 'Mỗi buổi tập' });
    }

    // ── 3. Dinh dưỡng (tuỳ goal + điều kiện + di ứng) ──────────────────────
    actions.push({ nhom: 'dinh_duong', hanh_dong: 'Uống đủ 35–40 ml nước/kg cân nặng/ngày', muc_do: 'trung_binh',
      ly_do: `Với ${currentWeight > 0 ? currentWeight : '?'}kg bạn cần ~${currentWeight > 0 ? Math.round(currentWeight * 37) : '?'}ml/ngày`, tan_suat: 'Hàng ngày',
      ket_qua_ky_vong: 'Cải thiện trao đổi chất và kiểm soát cơn đói' });

    if (mucTieu === 'giam_can') {
      actions.push({ nhom: 'dinh_duong', hanh_dong: 'Áp dụng đĩa ăn: 1/2 rau — 1/4 đạm — 1/4 tinh bột', muc_do: 'cao',
        ly_do: 'Phương pháp trực quan, dễ thực hiện mà không cần đếm calo', tan_suat: 'Mỗi bữa chính' });
      actions.push({ nhom: 'dinh_duong', hanh_dong: 'Ăn chậm và nhai kỹ — đặt đũa xuống giữa các miếng', muc_do: 'trung_binh',
        ly_do: 'Não cần 20 phút để nhận tín hiệu no, ăn chậm giúp giảm lượng ăn 10–20%', tan_suat: 'Mỗi bữa' });
    } else if (mucTieu === 'tang_can') {
      actions.push({ nhom: 'dinh_duong', hanh_dong: 'Thêm 1–2 bữa phụ: chuối + bơ đậu phộng + sữa tươi', muc_do: 'cao',
        ly_do: 'Tăng năng lượng nạp vào từ thực phẩm nguyên chất, không từ junk food', tan_suat: 'Giữa buổi sáng và sau tập' });
    }

    if (diUng.length > 0) {
      actions.push({ nhom: 'dinh_duong', hanh_dong: `Tuyệt đối tránh: ${diUng.join(', ')}`, muc_do: 'cao',
        ly_do: 'Dị ứng đã khai báo — có thể gây phản ứng nghiêm trọng', tan_suat: 'Luôn luôn' });
    }

    // ── 4. Giấc ngủ ──────────────────────────────────────────────────────────
    if (sleepScore > 0 && sleepScore <= 3) {
      warnings.push(`Chất lượng giấc ngủ thấp (${sleepScore}/10) ảnh hưởng trực tiếp đến hormone đói/no và phục hồi cơ`);
      actions.push({ nhom: 'giac_ngu', hanh_dong: 'Đặt giờ ngủ cố định, không dùng màn hình 1 giờ trước ngủ', muc_do: 'cao',
        ly_do: `Điểm giấc ngủ ${sleepScore}/10 — cải thiện giấc ngủ là ưu tiên cao nhất lúc này`, tan_suat: 'Hàng đêm', ket_qua_ky_vong: 'Cải thiện phục hồi và kiểm soát cân nặng' });
      actions.push({ nhom: 'giac_ngu', hanh_dong: 'Không uống caffeine sau 14:00, tránh alcohol trước ngủ', muc_do: 'trung_binh',
        ly_do: 'Caffeine tồn tại 6–8 giờ trong cơ thể, alcohol làm giảm chất lượng REM', tan_suat: 'Hàng ngày' });
    } else if (sleepScore >= 4 && sleepScore <= 6) {
      actions.push({ nhom: 'giac_ngu', hanh_dong: 'Cải thiện môi trường ngủ: tối, mát, yên tĩnh', muc_do: 'trung_binh',
        ly_do: `Điểm giấc ngủ ${sleepScore}/10 — còn dư địa cải thiện đáng kể`, tan_suat: 'Hàng đêm' });
    }

    // ── 5. Căng thẳng & năng lượng ───────────────────────────────────────────
    if (stressScore >= 7) {
      warnings.push(`Mức căng thẳng cao (${stressScore}/10) — cortisol cao gây tích mỡ bụng và giảm hiệu quả tập luyện`);
      actions.push({ nhom: 'cang_thang', hanh_dong: 'Thực hành thở 4-7-8 hoặc thiền 10 phút/ngày', muc_do: 'cao',
        ly_do: `Stress ${stressScore}/10 gây cortisol cao — trực tiếp cản trở mục tiêu ${mucTieu}`, tan_suat: 'Sáng hoặc tối' });
      actions.push({ nhom: 'cang_thang', hanh_dong: 'Đi bộ nhẹ 15–20 phút sau bữa tối thay vì ngồi xem điện thoại', muc_do: 'trung_binh',
        ly_do: 'Giảm cortisol tự nhiên và hỗ trợ tiêu hóa', tan_suat: 'Hàng tối' });
    } else if (stressScore >= 4) {
      actions.push({ nhom: 'cang_thang', hanh_dong: 'Dành 15 phút mỗi ngày cho hoạt động thư giãn (đọc sách, nghe nhạc)', muc_do: 'trung_binh',
        ly_do: `Stress ${stressScore}/10 — phòng ngừa tăng trước khi ảnh hưởng đến sức khoẻ`, tan_suat: 'Hàng ngày' });
    }

    if (energyScore > 0 && energyScore <= 4) {
      actions.push({ nhom: 'cang_thang', hanh_dong: 'Kiểm tra lại bữa sáng — ưu tiên protein + tinh bột phức hợp', muc_do: 'trung_binh',
        ly_do: `Năng lượng thấp (${energyScore}/10) thường do bỏ bữa sáng hoặc ăn tinh bột đơn`, tan_suat: 'Mỗi sáng' });
    }

    // ── 6. Cảnh báo từ chỉ số đo lường ─────────────────────────────────────
    if (systolic > 130 && systolic <= 140) {
      actions.push({ nhom: 'can_thiep', hanh_dong: 'Giảm muối xuống dưới 5g/ngày và tăng kali từ rau củ', muc_do: 'cao',
        ly_do: `Huyết áp ${systolic} mmHg — biên giới cao, cần điều chỉnh ngay qua ăn uống`, tan_suat: 'Hàng ngày' });
    }
    if (systolic > 140) {
      warnings.push(`Huyết áp tâm thu ${systolic} mmHg — cần theo dõi y tế`);
      actions.push({ nhom: 'can_thiep', hanh_dong: 'Tham khảo bác sĩ về huyết áp cao trước khi tập cường độ cao', muc_do: 'cao',
        ly_do: `Huyết áp ${systolic} mmHg cần được kiểm soát y tế song song với lối sống`, tan_suat: 'Ngay khi có thể' });
    }

    if (bloodSugar > 5.6 && bloodSugar <= 7) {
      actions.push({ nhom: 'dinh_duong', hanh_dong: 'Giảm tinh bột trắng, ưu tiên ngũ cốc nguyên hạt và rau xanh', muc_do: 'cao',
        ly_do: `Đường huyết ${bloodSugar} mmol/L — vùng tiền tiểu đường, kiểm soát được qua ăn uống`, tan_suat: 'Hàng ngày' });
    }
    if (bloodSugar > 7) {
      warnings.push(`Đường huyết ${bloodSugar} mmol/L — cao, nên khám bác sĩ`);
    }

    if (waistCm > 0) {
      const riskWaist = gioi === 'nu' ? 88 : 102;
      if (waistCm > riskWaist) {
        warnings.push(`Vòng eo ${waistCm} cm — nguy cơ mỡ nội tạng cao`);
        actions.push({ nhom: 'can_thiep', hanh_dong: 'Ưu tiên bài tập HIIT và giảm tinh bột để giảm mỡ bụng', muc_do: 'cao',
          ly_do: `Vòng eo ${waistCm}cm > ngưỡng an toàn ${riskWaist}cm — mỡ nội tạng làm tăng nguy cơ tim mạch`, tan_suat: '5 ngày/tuần' });
      }
    }

    // ── 7. BMI cực đoan ───────────────────────────────────────────────────────
    if (bmi && bmi > 30) {
      actions.push({ nhom: 'can_thiep', hanh_dong: 'Đặt lịch tư vấn chuyên gia dinh dưỡng để có kế hoạch sát hơn', muc_do: 'cao',
        ly_do: `BMI ${bmi} — béo phì cần hỗ trợ chuyên môn để giảm cân an toàn và bền vững`, tan_suat: 'Càng sớm càng tốt' });
    }
    if (bmi && bmi < 16) {
      warnings.push('BMI rất thấp — thiếu cân nghiêm trọng, cần khám bác sĩ ngay');
      actions.push({ nhom: 'can_thiep', hanh_dong: 'Khám bác sĩ để loại trừ nguyên nhân thiếu cân bệnh lý', muc_do: 'cao',
        ly_do: `BMI ${bmi} < 16 có thể liên quan đến rối loạn ăn uống hoặc bệnh lý nền`, tan_suat: 'Ngay lập tức' });
    }

    // ── 8. Tuổi & giới tính ──────────────────────────────────────────────────
    if (age >= 50) {
      actions.push({ nhom: 'van_dong', hanh_dong: 'Ưu tiên bài tập tăng cường xương khớp: bơi lội, đạp xe, tạ nhẹ', muc_do: 'trung_binh',
        ly_do: 'Sau 50 tuổi mật độ xương giảm nhanh, cần kích thích xương bằng vận động chịu lực', tan_suat: '3–4 ngày/tuần' });
    }
    if (gioi === 'nu' && age >= 40) {
      actions.push({ nhom: 'dinh_duong', hanh_dong: 'Bổ sung canxi từ sữa, cải bó xôi, đậu phụ — 1000–1200mg/ngày', muc_do: 'trung_binh',
        ly_do: 'Phụ nữ sau 40 tuổi nguy cơ loãng xương tăng cao', tan_suat: 'Hàng ngày' });
    }

    // ── 9. Tình trạng sức khoẻ đặc biệt ─────────────────────────────────────
    if (tinhTrang.length > 0) {
      warnings.push(`Lưu ý tình trạng sức khoẻ: ${tinhTrang.join(', ')} — tham khảo chuyên gia trước khi thay đổi chế độ lớn`);
      actions.push({ nhom: 'can_thiep', hanh_dong: 'Chia sẻ kế hoạch này với bác sĩ hoặc chuyên gia dinh dưỡng', muc_do: 'cao',
        ly_do: `Có tình trạng: ${tinhTrang.join(', ')} — cần điều chỉnh kế hoạch cho phù hợp`, tan_suat: 'Trước khi bắt đầu' });
    }

    if (ghi_chu) {
      actions.push({ nhom: 'can_thiep', hanh_dong: `Lưu ý thêm: ${ghi_chu}`, muc_do: 'trung_binh',
        ly_do: 'Thông tin bổ sung từ hồ sơ cá nhân', tan_suat: 'Theo tình huống' });
    }

    // ── 10. Theo dõi tiến độ ─────────────────────────────────────────────────
    actions.push({ nhom: 'tong_quan', hanh_dong: 'Cập nhật cân nặng và vòng eo mỗi tuần vào buổi sáng', muc_do: 'trung_binh',
      ly_do: 'Dữ liệu liên tục giúp phát hiện sớm xu hướng và điều chỉnh kịp thời', tan_suat: '1–2 lần/tuần', thoi_diem_goi_y: 'Sáng sau ngủ dậy, trước ăn sáng',
      chi_so_theo_doi: ['can_nang_kg', 'vong_eo_cm'] });

    if (heartRate > 0 && heartRate < 60) {
      actions.push({ nhom: 'tong_quan', hanh_dong: 'Theo dõi nhịp tim nghỉ ngơi hàng tuần', muc_do: 'trung_binh',
        ly_do: `Nhịp tim ${heartRate} bpm — có thể phản ánh sức khoẻ tim mạch tốt hoặc cần theo dõi thêm`, tan_suat: 'Hàng tuần' });
    }

    const ly_do_gen = [
      `Mục tiêu: ${mucTieu}`,
      bmi ? `BMI ${bmi} (${bmiCat})` : null,
      trend !== 'khong_du_du_lieu' ? `Xu hướng cân: ${trend}` : null,
      latest ? `Dữ liệu đo ngày ${String(latest.do_luc).slice(0, 10)}` : 'Chưa có chỉ số đo',
    ].filter(Boolean).join(' · ');

    const priority = warnings.length >= 3 ? 'cao' : warnings.length >= 1 ? 'trung_binh' : 'thap';
    const now = new Date();

    const inputSnapshot = {
      profile: { gioi_tinh: gioi, ngay_sinh: profile.ngay_sinh, chieu_cao_cm: profile.chieu_cao_cm, can_nang_hien_tai_kg: profile.can_nang_hien_tai_kg, muc_do_van_dong: vanDong, muc_tieu_suc_khoe: mucTieu, tinh_trang_suc_khoe: tinhTrang, di_ung: diUng },
      latest_metric: latest ? { can_nang_kg: latest.can_nang_kg, vong_eo_cm: latest.vong_eo_cm, chat_luong_giac_ngu: latest.chat_luong_giac_ngu, muc_do_cang_thang: latest.muc_do_cang_thang, muc_nang_luong: latest.muc_nang_luong, huyet_ap_tam_thu: latest.huyet_ap_tam_thu, nhip_tim: latest.nhip_tim, duong_huyet: latest.duong_huyet, do_luc: latest.do_luc } : null,
      bmi, bmi_category: bmiCat, weight_trend: trend, age,
      input_signature: this.healthRecommendationSignature(profile, latest, summary),
      generated_at: now.toISOString(),
    };

    const result = await this.dataSource.query(
      `INSERT INTO goi_y_suc_khoe (tai_khoan_id,phien_chat_ai_id,loai_goi_y,input_snapshot,
       noi_dung_goi_y,muc_do_uu_tien,canh_bao,ly_do,trang_thai,tao_luc,cap_nhat_luc)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [userId, null, 'ke_hoach_suc_khoe', JSON.stringify(inputSnapshot),
       JSON.stringify(actions), priority, JSON.stringify([...new Set(warnings)]),
       ly_do_gen, 'moi_tao', now, now],
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
    if (!profile || !profile.chieu_cao_cm) {
      throw new BadRequestException('Can bo sung chieu cao trong ho so suc khoe truoc');
    }

    const summary  = await this.getHealthSummary(accountId);
    const latest   = await this.getLatestMetric(accountId);

    const diUng: string[]     = this.normalizeStringList(profile.di_ung);
    const khongDung: string[] = this.normalizeStringList(profile.thuc_pham_khong_dung);
    const cheDoAn: string[]   = this.normalizeStringList(profile.che_do_an_uu_tien);
    const tinhTrang: string[] = this.normalizeStringList(profile.tinh_trang_suc_khoe);

    // Dùng cân nặng mới nhất từ chỉ số đo, fallback về hồ sơ
    const heightCm  = toNumber(profile.chieu_cao_cm);
    const weightKg  = toNumber(latest?.can_nang_kg ?? profile.can_nang_hien_tai_kg);
    if (!weightKg) throw new BadRequestException('Can bo sung can nang trong ho so hoac do chi so suc khoe');

    const age = profile.ngay_sinh
      ? Math.floor((Date.now() - new Date(profile.ngay_sinh).getTime()) / (365.25 * 24 * 3600 * 1000))
      : 30;

    // Mifflin-St Jeor
    const bmr = profile.gioi_tinh === 'nu'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
      : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

    const activityMultiplier: Record<string, number> = {
      it_van_dong: 1.2, van_dong_nhe: 1.375, van_dong_vua: 1.55,
      nang_dong: 1.725, rat_nang_dong: 1.9,
    };
    const tdee = Math.round(bmr * (activityMultiplier[profile.muc_do_van_dong] ?? 1.375));

    const mucTieu = profile.muc_tieu_suc_khoe as string;
    const vanDong = profile.muc_do_van_dong as string;
    const bmi     = summary.bmi as number | null;
    const trend   = summary.weightTrend as string;

    // Deficit/surplus tuỳ BMI
    let targetCalories = tdee;
    if (mucTieu === 'giam_can') {
      const deficit = bmi && bmi > 35 ? 500 : bmi && bmi > 30 ? 450 : 350;
      targetCalories = tdee - deficit;
    } else if (mucTieu === 'tang_can') {
      const surplus = bmi && bmi < 16 ? 500 : 350;
      targetCalories = tdee + surplus;
    }
    targetCalories = Math.max(targetCalories, 1200); // không xuống dưới 1200

    // Macro tỷ lệ tuỳ mục tiêu
    let proteinRatio = 0.30, carbRatio = 0.40, fatRatio = 0.30;
    if (mucTieu === 'tang_can') { proteinRatio = 0.30; carbRatio = 0.45; fatRatio = 0.25; }
    if (mucTieu === 'giam_can') { proteinRatio = 0.35; carbRatio = 0.35; fatRatio = 0.30; }
    if (tinhTrang.some((t) => t.toLowerCase().includes('tieu duong') || t.toLowerCase().includes('đái tháo đường'))) {
      carbRatio = 0.30; proteinRatio = 0.35; fatRatio = 0.35;
    }

    const proteinG = Math.round((targetCalories * proteinRatio) / 4);
    const carbG    = Math.round((targetCalories * carbRatio) / 4);
    const fatG     = Math.round((targetCalories * fatRatio) / 9);

    const warnings: string[] = [...(summary.warnings ?? [])];
    const nutritionItems: Array<Record<string, unknown>> = [];
    const exerciseItems: Array<Record<string, unknown>>  = [];

    // ── DINH DƯỠNG ──────────────────────────────────────────────────────────

    // 1. Dị ứng — ưu tiên hàng đầu
    if (diUng.length > 0) {
      nutritionItems.push({ goi_y: `Tuyệt đối tránh: ${diUng.join(', ')}`, loai: 'tranh',
        ly_do: 'Dị ứng đã khai báo — có thể gây phản ứng nguy hiểm', tan_suat: 'Luôn luôn' });
    }

    // 2. Thực phẩm không dùng
    if (khongDung.length > 0) {
      nutritionItems.push({ goi_y: `Hạn chế: ${khongDung.join(', ')}`, loai: 'han_che',
        ly_do: 'Theo sở thích đã khai báo', thay_the_goi_y: 'Chọn thực phẩm tương đương về dinh dưỡng' });
    }

    // 3. Chế độ ăn ưu tiên
    if (cheDoAn.length > 0) {
      nutritionItems.push({ goi_y: `Tuân theo chế độ: ${cheDoAn.join(', ')}`, loai: 'uu_tien',
        ly_do: 'Phù hợp với chế độ ăn đã đăng ký của bạn', tan_suat: 'Hàng ngày' });
    }

    // 4. Protein — tuỳ mục tiêu
    const proteinFoods = tinhTrang.some((t) => t.includes('than') || t.includes('thận'))
      ? 'cá hồi, trứng, đậu hũ (hạn chế thịt đỏ)'
      : 'ức gà, cá, trứng, đậu phụ, tôm';
    nutritionItems.push({ goi_y: `Protein nạc: ${proteinFoods}`, loai: 'uu_tien',
      ly_do: `Mục tiêu ${proteinG}g protein/ngày — ${mucTieu === 'tang_can' ? 'tăng cơ' : mucTieu === 'giam_can' ? 'giữ cơ khi giảm cân' : 'duy trì sức khoẻ'}`,
      tan_suat: '2–3 bữa/ngày', bua_goi_y: 'Trưa và tối' });

    // 5. Rau củ — luôn ưu tiên
    nutritionItems.push({ goi_y: 'Rau xanh và trái cây đa màu sắc — ít nhất 400g/ngày', loai: 'uu_tien',
      ly_do: 'Cung cấp vitamin, khoáng chất, chất xơ và chất chống oxy hoá', tan_suat: 'Hàng ngày', bua_goi_y: 'Trưa/Tối' });

    // 6. Tinh bột — tuỳ mục tiêu và tình trạng đường huyết
    const bloodSugar = toNumber(latest?.duong_huyet);
    if (bloodSugar > 5.6 || tinhTrang.some((t) => t.includes('duong') || t.includes('đường'))) {
      nutritionItems.push({ goi_y: 'Thay cơm trắng bằng gạo lứt, khoai lang, yến mạch', loai: 'uu_tien',
        ly_do: 'Tinh bột phức hợp giúp kiểm soát đường huyết ổn định sau bữa ăn', tan_suat: 'Mỗi bữa', bua_goi_y: 'Trưa/Tối' });
      nutritionItems.push({ goi_y: 'Tránh nước ngọt, bánh kẹo, đồ ăn ngọt', loai: 'tranh',
        ly_do: `Đường huyết ${bloodSugar > 5.6 ? bloodSugar + ' mmol/L' : 'cần kiểm soát'} — đường đơn gây tăng đột biến nguy hiểm`, tan_suat: 'Luôn luôn' });
    } else if (mucTieu === 'giam_can') {
      nutritionItems.push({ goi_y: 'Ưu tiên tinh bột phức: gạo lứt, khoai, yến mạch thay cơm trắng', loai: 'uu_tien',
        ly_do: 'No lâu hơn, hỗ trợ duy trì thâm hụt calo bền vững', tan_suat: 'Mỗi bữa chính', bua_goi_y: 'Trưa' });
      nutritionItems.push({ goi_y: 'Hạn chế cơm trắng, bánh mì trắng, bún, phở nhiều tinh bột', loai: 'han_che',
        ly_do: 'Tinh bột tinh chế đẩy insulin cao, cản trở đốt mỡ', tan_suat: 'Hàng ngày' });
    } else if (mucTieu === 'tang_can') {
      nutritionItems.push({ goi_y: 'Thêm 1–2 bữa phụ: chuối + bơ đậu phộng + sữa tươi hoặc bơ + bánh mì nguyên cám', loai: 'uu_tien',
        ly_do: `Cần thêm ~${targetCalories - tdee + 400} kcal/ngày — bữa phụ giàu dinh dưỡng là cách dễ nhất`, tan_suat: '1–2 bữa phụ/ngày', bua_goi_y: 'Giữa sáng và sau tập' });
    }

    // 7. Chất béo lành mạnh
    nutritionItems.push({ goi_y: 'Chất béo lành mạnh: dầu ô liu, bơ, hạt óc chó, cá hồi', loai: 'uu_tien',
      ly_do: 'Omega-3 và chất béo không bão hoà hỗ trợ tim mạch và hấp thu vitamin', tan_suat: 'Hàng ngày' });
    nutritionItems.push({ goi_y: 'Hạn chế đồ chiên, thức ăn nhanh, dầu tái chế nhiều lần', loai: 'han_che',
      ly_do: 'Chất béo trans và bão hoà làm tăng nguy cơ tim mạch', tan_suat: 'Hàng ngày' });

    // 8. Nước
    const waterMl = Math.round(weightKg * 35);
    nutritionItems.push({ goi_y: `Uống đủ nước — khoảng ${waterMl}ml/ngày (${Math.round(waterMl / 250)} ly 250ml)`, loai: 'uu_tien',
      ly_do: 'Cơ thể mất nước 1% đã giảm hiệu suất vận động 10%', tan_suat: 'Rải đều cả ngày', bua_goi_y: 'Uống 1 ly ngay khi thức dậy' });

    // ── TẬP LUYỆN ───────────────────────────────────────────────────────────

    if (vanDong === 'it_van_dong') {
      exerciseItems.push({ goi_y: 'Đi bộ 20–30 phút/ngày (bất kỳ thời điểm nào)', muc_do: 'thap',
        ly_do: 'Bước đầu tạo thói quen vận động — không cần đến phòng gym', tan_suat: '5–7 ngày/tuần', thoi_luong: '20–30 phút' });
      exerciseItems.push({ goi_y: 'Stretching toàn thân 10 phút buổi sáng', muc_do: 'thap',
        ly_do: 'Giảm cứng cơ, cải thiện tư thế và tuần hoàn máu', tan_suat: 'Hàng ngày', thoi_luong: '10 phút' });
      if (mucTieu === 'giam_can') {
        exerciseItems.push({ goi_y: 'Tăng dần lên 45 phút đi bộ nhanh sau 2 tuần', muc_do: 'trung_binh',
          ly_do: 'Tăng tiêu hao calo dần dần, tránh chấn thương do tập quá sức', tan_suat: '4–5 ngày/tuần', thoi_luong: '45 phút' });
      }
    } else if (vanDong === 'van_dong_nhe') {
      exerciseItems.push({ goi_y: 'Cardio vừa phải: đạp xe, bơi lội, hoặc chạy bộ nhẹ', muc_do: 'trung_binh',
        ly_do: 'Cải thiện sức bền tim phổi và đốt calo hiệu quả', tan_suat: '4 ngày/tuần', thoi_luong: '30–40 phút' });
      exerciseItems.push({ goi_y: 'Tập sức mạnh bodyweight: squat, push-up, plank, lunge', muc_do: 'trung_binh',
        ly_do: 'Tăng cơ bắp giúp trao đổi chất cơ bản tăng 5–10%', tan_suat: '2–3 ngày/tuần', thoi_luong: '25–30 phút' });
    } else if (vanDong === 'van_dong_vua') {
      if (mucTieu === 'giam_can') {
        exerciseItems.push({ goi_y: 'HIIT 20–25 phút (30 giây bứt tốc — 90 giây nghỉ × 8–10 vòng)', muc_do: 'cao',
          ly_do: 'HIIT đốt 25–30% calo nhiều hơn cardio thông thường và tạo hiệu ứng đốt mỡ hậu tập', tan_suat: '2–3 ngày/tuần', thoi_luong: '20–25 phút' });
        exerciseItems.push({ goi_y: 'Cardio bền vừa 40 phút', muc_do: 'trung_binh',
          ly_do: 'Bổ sung cardio bền để đốt mỡ ở vùng đốt béo tối ưu (65–70% nhịp tim tối đa)', tan_suat: '2 ngày/tuần', thoi_luong: '40 phút' });
      } else if (mucTieu === 'tang_can') {
        exerciseItems.push({ goi_y: 'Progressive overload: tăng tạ 2.5–5% mỗi 1–2 tuần', muc_do: 'cao',
          ly_do: 'Kích thích cơ bắp phát triển liên tục — nguyên tắc quan trọng nhất khi tăng cơ', tan_suat: '4 ngày/tuần', thoi_luong: '45–50 phút' });
        exerciseItems.push({ goi_y: 'Tập chia nhóm cơ: Ngực-Vai-Tay-Lưng-Chân theo tuần', muc_do: 'trung_binh',
          ly_do: 'Cho mỗi nhóm cơ 48–72 giờ phục hồi trước khi tập lại', tan_suat: '4 ngày/tuần' });
      } else {
        exerciseItems.push({ goi_y: 'Duy trì 4–5 buổi/tuần, xen kẽ cardio và tập tạ', muc_do: 'trung_binh',
          ly_do: 'Cân bằng giữa sức bền và sức mạnh để duy trì sức khoẻ toàn diện', tan_suat: '4–5 ngày/tuần' });
      }
    } else { // nang_dong, rat_nang_dong
      exerciseItems.push({ goi_y: 'Bắt buộc có 1–2 ngày nghỉ tích cực/tuần (yoga, bơi nhẹ)', muc_do: 'cao',
        ly_do: 'Overtraining làm giảm hiệu suất, tăng nguy cơ chấn thương và mất cơ', tan_suat: '1–2 ngày/tuần' });
      exerciseItems.push({ goi_y: 'Theo dõi HRV (Heart Rate Variability) để tối ưu lịch tập', muc_do: 'trung_binh',
        ly_do: 'HRV thấp là tín hiệu cơ thể chưa phục hồi, nên giảm cường độ hôm đó', tan_suat: 'Mỗi sáng' });
      if (mucTieu === 'giam_can') {
        exerciseItems.push({ goi_y: 'Thêm cardio fasted 20–30 phút vào sáng sớm (trước ăn)', muc_do: 'trung_binh',
          ly_do: 'Cardio lúc đói giúp đốt mỡ hiệu quả hơn cho người tập nặng', tan_suat: '3–4 sáng/tuần', thoi_luong: '20–30 phút' });
      }
    }

    // Tình trạng sức khỏe — điều chỉnh tập luyện
    if (tinhTrang.length > 0) {
      warnings.push(`Lưu ý tình trạng: ${tinhTrang.join(', ')} — tham khảo bác sĩ trước khi thực hiện`);
      exerciseItems.push({ goi_y: 'Giữ cường độ tập ở mức nhẹ-vừa, dừng ngay nếu thấy đau/chóng mặt', muc_do: 'cao',
        ly_do: `Có tình trạng sức khoẻ: ${tinhTrang.join(', ')}`, tan_suat: 'Mỗi buổi tập' });
    }

    // Huyết áp cao — điều chỉnh tập
    const systolic = toNumber(latest?.huyet_ap_tam_thu);
    if (systolic > 140) {
      warnings.push(`Huyết áp ${systolic} mmHg — tránh tập cường độ cao, ưu tiên cardio nhẹ`);
      exerciseItems.push({ goi_y: 'Tránh tập nín thở (Valsalva) và động tác gắng sức đột ngột', muc_do: 'cao',
        ly_do: 'Huyết áp cao có thể tăng vọt khi gắng sức, nguy hiểm cho mạch máu não', tan_suat: 'Mỗi buổi tập' });
    }

    // BMI rất cao — điều chỉnh bài tập
    if (bmi && bmi > 35) {
      warnings.push('BMI > 35 — ưu tiên bài tập không chịu lực để bảo vệ khớp gối');
      exerciseItems.push({ goi_y: 'Ưu tiên bơi lội, đạp xe đạp, đi bộ dưới nước thay vì chạy bộ', muc_do: 'cao',
        ly_do: `BMI ${bmi} — cân nặng cao tạo áp lực lớn lên khớp gối khi chạy bộ`, tan_suat: '4–5 ngày/tuần', thoi_luong: '30–45 phút' });
    }

    const inputSnapshot = {
      profile: { gioi_tinh: profile.gioi_tinh, chieu_cao_cm: heightCm, can_nang_kg: weightKg, muc_do_van_dong: vanDong, muc_tieu: mucTieu, di_ung: diUng, khong_dung: khongDung, che_do_an: cheDoAn, tinh_trang: tinhTrang, age },
      calculated: { bmr: Math.round(bmr), tdee, target_calories: targetCalories, bmi, protein_ratio: proteinRatio, carb_ratio: carbRatio, fat_ratio: fatRatio },
      metric_used: latest ? { can_nang_kg: latest.can_nang_kg, do_luc: latest.do_luc, duong_huyet: latest.duong_huyet, huyet_ap_tam_thu: latest.huyet_ap_tam_thu } : null,
      weight_trend: trend,
      input_signature: this.wellnessRecommendationSignature(profile, summary),
      generated_at: new Date().toISOString(),
    };

    const ly_do_gen = `TDEE ${tdee} kcal → mục tiêu ${targetCalories} kcal/ngày · ${mucTieu} · BMI ${bmi ?? '?'} · cân ${weightKg}kg (${latest?.can_nang_kg ? 'từ chỉ số đo' : 'từ hồ sơ'})`;

    const now = new Date();
    const result = await this.dataSource.query(
      `INSERT INTO goi_y_dinh_duong_tap_luyen (tai_khoan_id,phien_chat_ai_id,input_snapshot,
       muc_tieu_calories,muc_tieu_protein_g,muc_tieu_carb_g,muc_tieu_fat_g,
       goi_y_dinh_duong,goi_y_tap_luyen,canh_bao,ly_do,trang_thai,tao_luc,cap_nhat_luc)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [userId, null, JSON.stringify(inputSnapshot), targetCalories, proteinG, carbG, fatG,
       JSON.stringify(nutritionItems), JSON.stringify(exerciseItems),
       JSON.stringify([...new Set(warnings)]), ly_do_gen, 'moi_tao', now, now],
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
