import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Brackets,
  DataSource,
  FindOptionsWhere,
  In,
  IsNull,
  Repository,
} from 'typeorm';
import { ChuyenGiaDinhDuongEntity } from '../../Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import { GoiTuVanEntity } from '../../Admin/ChuyenGiaDinhDuong/entities/goi-tu-van.entity';
import { DanhGiaEntity } from '../../Admin/Booking/entities/danh-gia.entity';
import { LichHenEntity } from '../../Admin/Booking/entities/lich-hen.entity';
import { ThanhToanTuVanEntity } from '../../Admin/Booking/entities/thanh-toan-tu-van.entity';
import { TaiKhoanEntity } from '../../Admin/User/entities/tai-khoan.entity';
import { ThongBaoEntity } from '../../Admin/FoodReview/entities/thong-bao.entity';
import { PhanBoDoanhThuBookingEntity } from '../../Admin/Booking/entities/phan-bo-doanh-thu-booking.entity';
import {
  generatePaymentUrl,
  isVnpaySuccess,
  queryVnpayTransaction,
  verifyIpnSignature,
  verifyReturnSignature,
  refundVnpayTransaction,
} from '../../../common/vnpay/vnpay.util';
import { NutritionistQueryDto } from './dto/nutritionist-query.dto';
import { UserBookingQueryDto } from './dto/booking-query.dto';
import {
  CancelUserBookingDto,
  CreateBookingDto,
} from './dto/create-booking.dto';
import { ConsultationPaymentQueryDto } from './dto/consultation-payment.dto';
import {
  CreateReviewDto,
  UpdateReviewDto,
  UserReviewQueryDto,
} from './dto/review.dto';

const ACTIVE_BOOKING_STATUSES = [
  'da_xac_nhan',
  'da_checkin',
  'dang_tu_van',
] as const;
const HOLD_WINDOW_MS = 60 * 60 * 1000;
const COMMISSION_RATE = 0.05;
const COMMISSION_RATE_PERCENT = 5;
const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const MIN_PACKAGE_DURATION_MINUTES = 15;
const MAX_PACKAGE_DURATION_MINUTES = 240;
const USED_PACKAGE_BOOKING_STATUSES = [
  'da_xac_nhan',
  'da_checkin',
  'dang_tu_van',
  'hoan_thanh',
] as const;

type WorkingHourSlot = {
  start: string;
  end: string;
};

type WorkingHoursMap = Partial<
  Record<(typeof WEEKDAY_KEYS)[number], WorkingHourSlot[]>
>;

type RefundResult = {
  status: 'not_required' | 'not_eligible' | 'processing' | 'success' | 'failed';
  message: string | null;
  response?: Record<string, string>;
};

const REVIEW_EDIT_WINDOW_DAYS = 7;

@Injectable()
export class UserConsultationService {
  constructor(
    @InjectRepository(TaiKhoanEntity)
    private readonly userRepo: Repository<TaiKhoanEntity>,
    @InjectRepository(ChuyenGiaDinhDuongEntity)
    private readonly expertRepo: Repository<ChuyenGiaDinhDuongEntity>,
    @InjectRepository(GoiTuVanEntity)
    private readonly packageRepo: Repository<GoiTuVanEntity>,
    @InjectRepository(DanhGiaEntity)
    private readonly reviewRepo: Repository<DanhGiaEntity>,
    @InjectRepository(LichHenEntity)
    private readonly bookingRepo: Repository<LichHenEntity>,
    @InjectRepository(ThanhToanTuVanEntity)
    private readonly paymentRepo: Repository<ThanhToanTuVanEntity>,
    @InjectRepository(PhanBoDoanhThuBookingEntity)
    private readonly allocationRepo: Repository<PhanBoDoanhThuBookingEntity>,
    @InjectRepository(ThongBaoEntity)
    private readonly notifRepo: Repository<ThongBaoEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getPublicNutritionists(
    userId: number | undefined,
    query: NutritionistQueryDto,
  ) {
    await this.getActiveUser(userId);

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(50, query.limit ?? 10));

    const qb = this.expertRepo
      .createQueryBuilder('cg')
      .innerJoin('cg.tai_khoan', 'tk')
      .leftJoin(
        GoiTuVanEntity,
        'gtv',
        'gtv.chuyen_gia_dinh_duong_id = cg.id AND gtv.trang_thai = :packageStatus AND gtv.xoa_luc IS NULL',
        { packageStatus: 'dang_ban' },
      )
      .where('cg.trang_thai = :expertStatus', { expertStatus: 'hoat_dong' })
      .andWhere('tk.trang_thai = :accountStatus', {
        accountStatus: 'hoat_dong',
      });

    if (query.search?.trim()) {
      const keyword = `%${query.search.trim()}%`;
      qb.andWhere(
        new Brackets((subQuery) => {
          subQuery
            .where('tk.ho_ten LIKE :keyword', { keyword })
            .orWhere('cg.chuyen_mon LIKE :keyword', { keyword });
        }),
      );
    }

    if (query.chuyenMon?.trim()) {
      qb.andWhere('cg.chuyen_mon LIKE :chuyenMon', {
        chuyenMon: `%${query.chuyenMon.trim()}%`,
      });
    }

    if (query.minPrice !== undefined) {
      qb.andWhere('gtv.gia >= :minPrice', { minPrice: query.minPrice });
    }

    if (query.maxPrice !== undefined) {
      qb.andWhere('gtv.gia <= :maxPrice', { maxPrice: query.maxPrice });
    }

    qb.select([
      'cg.id as id',
      'tk.ho_ten as ho_ten',
      'cg.anh_dai_dien_url as anh_dai_dien_url',
      'cg.chuyen_mon as chuyen_mon',
      'cg.mo_ta as mo_ta',
      'cg.diem_danh_gia_trung_binh as diem_danh_gia_trung_binh',
      'cg.so_luot_danh_gia as so_luot_danh_gia',
      'MIN(gtv.gia) as gia_bat_dau',
      'COUNT(gtv.id) as so_goi_dang_ban',
    ])
      .groupBy('cg.id')
      .addGroupBy('tk.ho_ten')
      .addGroupBy('cg.anh_dai_dien_url')
      .addGroupBy('cg.chuyen_mon')
      .addGroupBy('cg.mo_ta')
      .addGroupBy('cg.diem_danh_gia_trung_binh')
      .addGroupBy('cg.so_luot_danh_gia')
      .orderBy('so_goi_dang_ban', 'DESC')
      .addOrderBy('cg.diem_danh_gia_trung_binh', 'DESC')
      .addOrderBy('cg.id', 'DESC');

    const total = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'total')
      .from(`(${qb.getQuery()})`, 'nutritionists')
      .setParameters(qb.getParameters())
      .getRawOne<{ total: string }>();

    const items = await qb
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<{
        id: string;
        ho_ten: string;
        anh_dai_dien_url: string | null;
        chuyen_mon: string | null;
        mo_ta: string | null;
        diem_danh_gia_trung_binh: string | null;
        so_luot_danh_gia: string | null;
        gia_bat_dau: string | null;
        so_goi_dang_ban: string | null;
      }>();

    return {
      success: true,
      message: 'Lấy danh sách nutritionist thành công',
      data: {
        items: items.map((item) => ({
          id: Number(item.id),
          ho_ten: item.ho_ten,
          anh_dai_dien_url: item.anh_dai_dien_url,
          chuyen_mon: item.chuyen_mon,
          mo_ta: item.mo_ta,
          diem_danh_gia_trung_binh: Number(item.diem_danh_gia_trung_binh ?? 0),
          so_luot_danh_gia: Number(item.so_luot_danh_gia ?? 0),
          gia_bat_dau: item.gia_bat_dau ? Number(item.gia_bat_dau) : null,
          so_goi_dang_ban: Number(item.so_goi_dang_ban ?? 0),
          co_the_dat_lich: Number(item.so_goi_dang_ban ?? 0) > 0,
        })),
        pagination: {
          page,
          limit,
          total: Number(total?.total ?? 0),
        },
      },
    };
  }

  async getPublicNutritionistDetail(
    userId: number | undefined,
    nutritionistId: number,
  ) {
    await this.getActiveUser(userId);
    const expert = await this.getPublicNutritionistOrThrow(nutritionistId);

    const packages = await this.packageRepo.find({
      where: {
        chuyen_gia_dinh_duong_id: expert.id,
        trang_thai: 'dang_ban' as any,
        xoa_luc: IsNull(),
      },
      order: {
        gia: 'ASC',
        id: 'ASC',
      },
    });

    const usageCountMap = await this.getPackageUsageCountMap(
      packages.map((item) => item.id),
    );

    const reviews = await this.reviewRepo
      .createQueryBuilder('review')
      .innerJoin('review.lich_hen', 'booking')
      .innerJoin('review.tai_khoan', 'user')
      .where('review.chuyen_gia_dinh_duong_id = :expertId', {
        expertId: expert.id,
      })
      .andWhere('booking.trang_thai = :bookingStatus', {
        bookingStatus: 'hoan_thanh',
      })
      .orderBy('review.tao_luc', 'DESC')
      .limit(10)
      .select([
        'review.id as id',
        'review.diem as diem',
        'review.noi_dung as noi_dung',
        'review.tao_luc as tao_luc',
        'user.ho_ten as ho_ten_user',
      ])
      .getRawMany();

    return {
      success: true,
      message: 'Lấy chi tiết nutritionist thành công',
      data: {
        id: expert.id,
        ho_ten: expert.tai_khoan.ho_ten,
        anh_dai_dien_url: expert.anh_dai_dien_url,
        chuyen_mon: expert.chuyen_mon,
        mo_ta: expert.mo_ta,
        hoc_vi: expert.hoc_vi,
        chung_chi: expert.chung_chi,
        kinh_nghiem: expert.kinh_nghiem,
        diem_danh_gia_trung_binh: Number(expert.diem_danh_gia_trung_binh ?? 0),
        so_luot_danh_gia: expert.so_luot_danh_gia,
        gio_lam_viec: expert.gio_lam_viec,
        gio_lam_viec_parsed: this.parseWorkingHours(expert.gio_lam_viec),
        co_the_dat_lich: packages.length > 0,
        goi_tu_van: packages.map((item) => ({
          id: item.id,
          ten: item.ten,
          mo_ta: item.mo_ta,
          gia: Number(item.gia),
          thoi_luong_phut: item.thoi_luong_phut,
          so_lan_dung_mien_phi: item.so_lan_dung_mien_phi,
          so_luot_su_dung: usageCountMap.get(item.id) ?? 0,
        })),
        danh_gia: reviews.map((item) => ({
          id: Number(item.id),
          diem: Number(item.diem),
          noi_dung: item.noi_dung,
          tao_luc: item.tao_luc,
          ho_ten_user: item.ho_ten_user,
        })),
      },
    };
  }

  async createBooking(userId: number | undefined, dto: CreateBookingDto) {
    const user = await this.getActiveUser(userId);
    const packageEntity = await this.getActivePackage(
      dto.nutritionistId,
      dto.goiTuVanId,
    );
    const expert = await this.getPublicNutritionistOrThrow(dto.nutritionistId);

    const startTime = this.normalizeTime(dto.gioBatDau);
    const endTime = this.calculateEndTime(
      startTime,
      packageEntity.thoi_luong_phut,
    );
    this.validateBookingDateTime(dto.ngayHen, startTime);
    this.assertWithinWorkingHours(
      expert.gio_lam_viec,
      dto.ngayHen,
      startTime,
      endTime,
    );

    const existingPending = await this.findReusablePendingBooking(
      user.id,
      expert.id,
      packageEntity.id,
      dto.ngayHen,
      startTime,
      endTime,
    );
    if (existingPending) {
      return this.getUserBooking(user.id, existingPending.id);
    }

    await this.assertNoBookingOverlap(
      user.id,
      expert.id,
      dto.ngayHen,
      startTime,
      endTime,
    );

    const booking = await this.bookingRepo.save(
      this.bookingRepo.create({
        tai_khoan_id: user.id,
        chuyen_gia_dinh_duong_id: expert.id,
        goi_tu_van_id: packageEntity.id,
        ma_lich_hen: this.generateBookingCode(),
        muc_dich: dto.mucDich?.trim() || null,
        ngay_hen: dto.ngayHen,
        gio_bat_dau: `${startTime}:00`,
        gio_ket_thuc: `${endTime}:00`,
        dia_diem: 'Online qua hệ thống',
        trang_thai: 'cho_thanh_toan',
        tao_luc: new Date(),
        cap_nhat_luc: new Date(),
      }),
    );

    await this.createNotification(
      expert.tai_khoan_id,
      user.id,
      'Co booking moi cho thanh toan',
      `Nguoi dung ${user.ho_ten} vua tao lich hen ${booking.ma_lich_hen} va dang thuc hien thanh toan.`,
      `/nutritionist/bookings/${booking.id}`,
    );

    return this.getUserBooking(user.id, booking.id);
  }

  async getUserBookings(
    userId: number | undefined,
    query: UserBookingQueryDto,
  ) {
    const user = await this.getActiveUser(userId);
    await this.expirePendingBookings(user.id);

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(50, query.limit ?? 10));

    const where: FindOptionsWhere<LichHenEntity> = {
      tai_khoan_id: user.id,
    } as FindOptionsWhere<LichHenEntity>;

    if (query.trangThai) {
      where.trang_thai = query.trangThai as any;
    }

    const [items, total] = await this.bookingRepo.findAndCount({
      where,
      relations: [
        'chuyen_gia_dinh_duong',
        'chuyen_gia_dinh_duong.tai_khoan',
        'goi_tu_van',
      ],
      order: {
        ngay_hen: 'DESC',
        gio_bat_dau: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const financeMap = await this.getPaymentMap(items.map((item) => item.id));

    return {
      success: true,
      message: 'Lấy danh sách booking thành công',
      data: {
        items: items.map((item) =>
          this.toUserBookingResponse(item, financeMap.get(item.id) ?? []),
        ),
        pagination: { page, limit, total },
      },
    };
  }

  async getUserBooking(userId: number | undefined, bookingId: number) {
    const user = await this.getActiveUser(userId);
    await this.expirePendingBookings(user.id, bookingId);

    const booking = await this.bookingRepo.findOne({
      where: {
        id: bookingId,
        tai_khoan_id: user.id,
      } as FindOptionsWhere<LichHenEntity>,
      relations: [
        'chuyen_gia_dinh_duong',
        'chuyen_gia_dinh_duong.tai_khoan',
        'goi_tu_van',
      ],
    });

    if (!booking) {
      throw new NotFoundException('Khong tim thay booking');
    }

    let payments = await this.getPaymentsForBooking(booking.id);
    payments = await this.syncRefundPaymentsIfNeeded(booking, payments);
    return {
      success: true,
      message: 'Lấy chi tiết booking thành công',
      data: this.toUserBookingResponse(booking, payments, true),
    };
  }

  async fakeRefundSuccess(userId: number | undefined, bookingId: number) {
    const user = await this.getActiveUser(userId);

    const booking = await this.bookingRepo.findOne({
      where: {
        id: bookingId,
        tai_khoan_id: user.id,
      } as FindOptionsWhere<LichHenEntity>,
      relations: [
        'chuyen_gia_dinh_duong',
        'chuyen_gia_dinh_duong.tai_khoan',
        'goi_tu_van',
      ],
    });

    if (!booking) {
      throw new NotFoundException('Khong tim thay booking');
    }

    await this.dataSource.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(ThanhToanTuVanEntity);
      const allocationRepo = manager.getRepository(PhanBoDoanhThuBookingEntity);
      const notifRepo = manager.getRepository(ThongBaoEntity);

      const payment = await paymentRepo.findOne({
        where: { lich_hen_id: booking.id },
        order: { tao_luc: 'DESC' },
      });

      if (!payment) {
        throw new BadRequestException(
          'Booking nay chua co giao dich thanh toan',
        );
      }

      const refundStatus = this.readRefundStatus(payment);
      if (!['processing', 'bank_sent'].includes(refundStatus ?? '')) {
        if (payment.trang_thai === 'da_hoan_tien') {
          return;
        }
        throw new BadRequestException(
          'Khong co giao dich hoan tien dang cho xu ly',
        );
      }

      const metadata =
        payment.du_lieu_thanh_toan &&
        typeof payment.du_lieu_thanh_toan === 'object'
          ? { ...(payment.du_lieu_thanh_toan as Record<string, unknown>) }
          : {};
      const currentRefund =
        metadata.refund && typeof metadata.refund === 'object'
          ? { ...(metadata.refund as Record<string, unknown>) }
          : {};
      const currentResponse =
        currentRefund.response && typeof currentRefund.response === 'object'
          ? { ...(currentRefund.response as Record<string, unknown>) }
          : {};
      const currentQueryResponse =
        currentRefund.query_response &&
        typeof currentRefund.query_response === 'object'
          ? { ...(currentRefund.query_response as Record<string, unknown>) }
          : {};
      const now = new Date();

      metadata.refund = {
        ...currentRefund,
        status: 'success',
        success: true,
        message: 'Da gia lap hoan tien thanh cong tren moi truong test.',
        transaction_status: '00',
        fake_success: true,
        fake_confirmed_at: now.toISOString(),
        response: {
          ...currentResponse,
          vnp_TransactionType: '02',
          vnp_TransactionStatus: '00',
        },
        query_response: {
          ...currentQueryResponse,
          vnp_TransactionType: '02',
          vnp_TransactionStatus: '00',
        },
      };

      payment.trang_thai = 'da_hoan_tien' as any;
      payment.cap_nhat_luc = now;
      payment.xac_nhan_luc = now;
      payment.du_lieu_thanh_toan = metadata;
      await paymentRepo.save(payment);

      const allocation = await allocationRepo.findOne({
        where: { lich_hen_id: booking.id },
      });

      if (allocation) {
        allocation.trang_thai = 'da_hoan_tien';
        allocation.cap_nhat_luc = now;
        await allocationRepo.save(allocation);
      }

      await this.createNotification(
        booking.tai_khoan_id,
        user.id,
        'Hoan tien da duoc xac nhan',
        `Khoan hoan tien cho lich hen ${booking.ma_lich_hen} da duoc xac nhan thanh cong trong moi truong test.`,
        `/nutrition/bookings/${booking.id}`,
        notifRepo,
      );

      await this.createNotification(
        booking.chuyen_gia_dinh_duong.tai_khoan_id,
        user.id,
        'Hoan tien booking da duoc xac nhan',
        `Khoan hoan tien cho lich hen ${booking.ma_lich_hen} da duoc xac nhan thanh cong trong moi truong test.`,
        `/nutritionist/bookings/${booking.id}`,
        notifRepo,
      );
    });

    return this.getUserBooking(user.id, bookingId);
  }

  async cancelUserBooking(
    userId: number | undefined,
    bookingId: number,
    dto: CancelUserBookingDto,
  ) {
    const user = await this.getActiveUser(userId);
    const booking = await this.bookingRepo.findOne({
      where: {
        id: bookingId,
        tai_khoan_id: user.id,
      } as FindOptionsWhere<LichHenEntity>,
      relations: [
        'chuyen_gia_dinh_duong',
        'chuyen_gia_dinh_duong.tai_khoan',
        'goi_tu_van',
      ],
    });

    if (!booking) {
      throw new NotFoundException('Khong tim thay booking');
    }

    if (!['cho_thanh_toan', 'da_xac_nhan'].includes(booking.trang_thai)) {
      throw new BadRequestException(
        'Chi co the huy booking o trang thai cho thanh toan hoac da xac nhan',
      );
    }

    const payment = await this.paymentRepo.findOne({
      where: {
        lich_hen_id: booking.id,
        trang_thai: In(['thanh_cong', 'da_hoan_tien', 'dang_xu_ly']) as any,
      },
      order: { thanh_toan_luc: 'DESC', tao_luc: 'DESC' },
    });

    const refundResult = await this.resolveUserCancellationRefund(
      booking,
      payment,
      user.id,
    );

    await this.dataSource.transaction(async (manager) => {
      const bookingRepo = manager.getRepository(LichHenEntity);
      const paymentRepo = manager.getRepository(ThanhToanTuVanEntity);
      const allocationRepo = manager.getRepository(PhanBoDoanhThuBookingEntity);

      booking.trang_thai = 'da_huy';
      booking.ly_do_huy = dto.lyDoHuy.trim();
      booking.huy_boi = user.id;
      booking.huy_luc = new Date();
      booking.cap_nhat_luc = new Date();
      await bookingRepo.save(booking);

      if (
        payment &&
        refundResult.status === 'success' &&
        payment.trang_thai !== 'da_hoan_tien'
      ) {
        payment.trang_thai = 'da_hoan_tien' as any;
        payment.cap_nhat_luc = new Date();
        payment.xac_nhan_boi = user.id;
        payment.xac_nhan_luc = new Date();
        payment.du_lieu_thanh_toan = this.mergeRefundMetadata(
          payment.du_lieu_thanh_toan,
          refundResult,
          dto.lyDoHuy.trim(),
        );
        await paymentRepo.save(payment);
      } else if (payment && refundResult.status === 'processing') {
        payment.trang_thai = 'dang_xu_ly' as any;
        payment.cap_nhat_luc = new Date();
        payment.xac_nhan_boi = user.id;
        payment.xac_nhan_luc = new Date();
        payment.du_lieu_thanh_toan = this.mergeRefundMetadata(
          payment.du_lieu_thanh_toan,
          refundResult,
          dto.lyDoHuy.trim(),
        );
        await paymentRepo.save(payment);
      } else if (payment) {
        payment.cap_nhat_luc = new Date();
        payment.du_lieu_thanh_toan = this.mergeRefundMetadata(
          payment.du_lieu_thanh_toan,
          refundResult,
          dto.lyDoHuy.trim(),
        );
        await paymentRepo.save(payment);
      }

      if (payment && ['success', 'processing'].includes(refundResult.status)) {
        const allocation = await allocationRepo.findOne({
          where: { lich_hen_id: booking.id },
        });

        await allocationRepo.save(
          allocationRepo.create({
            id: allocation?.id,
            lich_hen_id: booking.id,
            thanh_toan_tu_van_id: payment.id,
            chuyen_gia_dinh_duong_id: booking.chuyen_gia_dinh_duong_id,
            so_tien_goc: Number(payment.so_tien).toFixed(2),
            ty_le_hoa_hong: COMMISSION_RATE_PERCENT.toFixed(2),
            so_tien_hoa_hong: this.roundMoney(
              Number(payment.so_tien) * COMMISSION_RATE,
            ).toFixed(2),
            so_tien_chuyen_gia_nhan: this.roundMoney(
              Number(payment.so_tien) * (1 - COMMISSION_RATE),
            ).toFixed(2),
            trang_thai:
              refundResult.status === 'success' ? 'da_hoan_tien' : 'tam_giu',
            tao_luc: allocation?.tao_luc ?? new Date(),
            cap_nhat_luc: new Date(),
          }),
        );
      }

      await this.createNotification(
        booking.chuyen_gia_dinh_duong.tai_khoan_id,
        user.id,
        'Booking da bi huy boi user',
        `Nguoi dung ${user.ho_ten} da huy lich hen ${booking.ma_lich_hen}.`,
        `/nutritionist/bookings/${booking.id}`,
        manager.getRepository(ThongBaoEntity),
      );

      await this.createNotification(
        booking.tai_khoan_id,
        user.id,
        'Booking da duoc huy',
        this.buildUserCancellationNotificationMessage(
          booking.ma_lich_hen,
          refundResult,
        ),
        `/nutrition/bookings/${booking.id}`,
        manager.getRepository(ThongBaoEntity),
      );

      if (refundResult.status === 'processing') {
        await this.createNotification(
          booking.tai_khoan_id,
          user.id,
          'Dang xu ly hoan tien',
          `VNPay dang xu ly yeu cau hoan tien cho lich hen ${booking.ma_lich_hen}.`,
          `/nutrition/bookings/${booking.id}`,
          manager.getRepository(ThongBaoEntity),
        );

        await this.createNotification(
          booking.chuyen_gia_dinh_duong.tai_khoan_id,
          user.id,
          'Dang xu ly hoan tien cho booking',
          `VNPay dang xu ly yeu cau hoan tien cho lich hen ${booking.ma_lich_hen}.`,
          `/nutritionist/bookings/${booking.id}`,
          manager.getRepository(ThongBaoEntity),
        );
      }
    });

    return {
      success: true,
      message: refundResult.message ?? 'Hủy booking thành công',
      data: {
        booking_id: booking.id,
        trang_thai: 'da_huy',
        refund_status: refundResult.status,
        refund_message: refundResult.message,
      },
    };
  }

  async createConsultationPayment(
    userId: number | undefined,
    bookingId: number,
  ) {
    const user = await this.getActiveUser(userId);
    const booking = await this.bookingRepo.findOne({
      where: {
        id: bookingId,
        tai_khoan_id: user.id,
      } as FindOptionsWhere<LichHenEntity>,
      relations: [
        'goi_tu_van',
        'chuyen_gia_dinh_duong',
        'chuyen_gia_dinh_duong.tai_khoan',
      ],
    });

    if (!booking) {
      throw new NotFoundException('Khong tim thay booking');
    }

    await this.expireSingleBookingIfNeeded(booking);

    if (booking.trang_thai !== 'cho_thanh_toan') {
      throw new BadRequestException(
        'Chi booking cho thanh toan moi co the thanh toan',
      );
    }

    const now = new Date();
    const expiresAt = this.getBookingExpiresAt(booking);
    if (expiresAt.getTime() <= now.getTime()) {
      throw new BadRequestException(
        'Booking da het han giu cho, khong the thanh toan nua',
      );
    }

    let payment = await this.findActivePendingPayment(booking.id);
    let reused = true;

    if (!payment) {
      payment = await this.paymentRepo.save(
        this.paymentRepo.create({
          lich_hen_id: booking.id,
          tai_khoan_id: user.id,
          ma_giao_dich: this.generatePaymentCode(booking.id),
          phuong_thuc: 'vnpay',
          so_tien: booking.goi_tu_van.gia,
          trang_thai: 'cho_thanh_toan',
          du_lieu_thanh_toan: {
            booking_id: booking.id,
            goi_tu_van_id: booking.goi_tu_van_id,
          },
          tao_luc: now,
          cap_nhat_luc: now,
        }),
      );
      reused = false;
    }

    const paymentUrl = generatePaymentUrl({
      amount: Number(payment.so_tien),
      orderDescription: `Thanh toan booking ${booking.ma_lich_hen}`,
      orderType: 'billpayment',
      txnRef: payment.ma_giao_dich,
    });

    payment.du_lieu_thanh_toan = {
      ...(payment.du_lieu_thanh_toan &&
      typeof payment.du_lieu_thanh_toan === 'object'
        ? (payment.du_lieu_thanh_toan as Record<string, unknown>)
        : {}),
      booking_id: booking.id,
      payment_url: paymentUrl,
      payment_url_generated_at: new Date().toISOString(),
    };
    payment.cap_nhat_luc = new Date();
    await this.paymentRepo.save(payment);

    return {
      success: true,
      message: reused
        ? 'Đã lấy lại thanh toán đang dở'
        : 'Tạo giao dịch thanh toán thành công',
      data: this.toPaymentResponse(
        payment,
        booking,
        paymentUrl,
        expiresAt,
        reused,
      ),
    };
  }

  async getPendingConsultationPayment(
    userId: number | undefined,
    bookingId: number,
  ) {
    const user = await this.getActiveUser(userId);
    const booking = await this.bookingRepo.findOne({
      where: {
        id: bookingId,
        tai_khoan_id: user.id,
      } as FindOptionsWhere<LichHenEntity>,
      relations: [
        'goi_tu_van',
        'chuyen_gia_dinh_duong',
        'chuyen_gia_dinh_duong.tai_khoan',
      ],
    });

    if (!booking) {
      throw new NotFoundException('Khong tim thay booking');
    }

    await this.expireSingleBookingIfNeeded(booking);

    const payment = await this.findActivePendingPayment(booking.id);
    if (!payment) {
      return {
        success: true,
        message: 'Khong co thanh toan dang do',
        data: null,
      };
    }

    const paymentUrl = generatePaymentUrl({
      amount: Number(payment.so_tien),
      orderDescription: `Thanh toan booking ${booking.ma_lich_hen}`,
      orderType: 'billpayment',
      txnRef: payment.ma_giao_dich,
    });

    payment.du_lieu_thanh_toan = {
      ...(payment.du_lieu_thanh_toan &&
      typeof payment.du_lieu_thanh_toan === 'object'
        ? (payment.du_lieu_thanh_toan as Record<string, unknown>)
        : {}),
      booking_id: booking.id,
      payment_url: paymentUrl,
      payment_url_generated_at: new Date().toISOString(),
    };
    payment.cap_nhat_luc = new Date();
    await this.paymentRepo.save(payment);

    return {
      success: true,
      message: 'Lấy thanh toán đang dở thành công',
      data: this.toPaymentResponse(
        payment,
        booking,
        paymentUrl,
        this.getBookingExpiresAt(booking),
        true,
      ),
    };
  }

  async getConsultationPayments(
    userId: number | undefined,
    query: ConsultationPaymentQueryDto,
  ) {
    const user = await this.getActiveUser(userId);
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(50, query.limit ?? 10));

    const qb = this.paymentRepo
      .createQueryBuilder('payment')
      .innerJoinAndSelect('payment.lich_hen', 'booking')
      .innerJoinAndSelect('booking.chuyen_gia_dinh_duong', 'expert')
      .innerJoinAndSelect('expert.tai_khoan', 'expertAccount')
      .innerJoinAndSelect('booking.goi_tu_van', 'package')
      .where('payment.tai_khoan_id = :userId', { userId: user.id });

    if (query.bookingId) {
      qb.andWhere('payment.lich_hen_id = :bookingId', {
        bookingId: query.bookingId,
      });
    }

    const [items, total] = await qb
      .orderBy('payment.tao_luc', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      success: true,
      message: 'Lấy lịch sử thanh toán thành công',
      data: {
        items: items.map((payment) =>
          this.toPaymentResponse(
            payment,
            payment.lich_hen,
            this.readPaymentUrl(payment),
            this.getBookingExpiresAt(payment.lich_hen),
            false,
          ),
        ),
        pagination: { page, limit, total },
      },
    };
  }

  async createUserReview(userId: number | undefined, dto: CreateReviewDto) {
    const user = await this.getActiveUser(userId);

    const booking = await this.bookingRepo.findOne({
      where: {
        id: dto.bookingId,
        tai_khoan_id: user.id,
      } as FindOptionsWhere<LichHenEntity>,
      relations: ['chuyen_gia_dinh_duong'],
    });

    if (!booking) {
      throw new NotFoundException('Khong tim thay booking');
    }

    if (booking.trang_thai !== 'hoan_thanh') {
      throw new BadRequestException('Chi duoc danh gia booking da hoan thanh');
    }

    const existed = await this.reviewRepo.findOne({
      where: { lich_hen_id: booking.id },
    });
    if (existed) {
      throw new BadRequestException('Booking nay da duoc danh gia');
    }

    const now = new Date();
    const review = await this.reviewRepo.save(
      this.reviewRepo.create({
        lich_hen_id: booking.id,
        tai_khoan_id: user.id,
        chuyen_gia_dinh_duong_id: booking.chuyen_gia_dinh_duong_id,
        diem: dto.diem,
        noi_dung: dto.noiDung?.trim() || null,
        tra_loi: null,
        tra_loi_luc: null,
        tao_luc: now,
        cap_nhat_luc: now,
      }),
    );

    await this.recalculateNutritionistRating(booking.chuyen_gia_dinh_duong_id);

    await this.createNotification(
      booking.chuyen_gia_dinh_duong.tai_khoan_id,
      user.id,
      'Danh gia moi tu nguoi dung',
      `Ban vua nhan danh gia ${dto.diem}/5 cho lich hen ${booking.ma_lich_hen}.`,
      `/nutritionist/bookings/${booking.id}`,
    );

    return {
      success: true,
      message: 'Gui danh gia thanh cong',
      data: await this.toUserReviewResponse(review),
    };
  }

  async getUserReviews(userId: number | undefined, query: UserReviewQueryDto) {
    const user = await this.getActiveUser(userId);
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(50, query.limit ?? 10));

    const where: FindOptionsWhere<DanhGiaEntity> = {
      tai_khoan_id: user.id,
    };
    if (query.bookingId) {
      where.lich_hen_id = query.bookingId;
    }

    const [items, total] = await this.reviewRepo.findAndCount({
      where,
      relations: [
        'lich_hen',
        'lich_hen.goi_tu_van',
        'chuyen_gia_dinh_duong',
        'chuyen_gia_dinh_duong.tai_khoan',
      ],
      order: { tao_luc: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      success: true,
      message: 'Lay lich su danh gia thanh cong',
      data: {
        items: await Promise.all(
          items.map((item) => this.toUserReviewResponse(item)),
        ),
        pagination: { page, limit, total },
      },
    };
  }

  async updateUserReview(
    userId: number | undefined,
    reviewId: number,
    dto: UpdateReviewDto,
  ) {
    const user = await this.getActiveUser(userId);

    const review = await this.reviewRepo.findOne({
      where: { id: reviewId, tai_khoan_id: user.id },
      relations: [
        'lich_hen',
        'lich_hen.goi_tu_van',
        'chuyen_gia_dinh_duong',
        'chuyen_gia_dinh_duong.tai_khoan',
      ],
    });
    if (!review) {
      throw new NotFoundException('Khong tim thay danh gia');
    }

    const deadline = new Date(
      review.tao_luc.getTime() + REVIEW_EDIT_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );
    if (Date.now() > deadline.getTime()) {
      throw new BadRequestException(
        'Da qua thoi han cho phep chinh sua danh gia',
      );
    }

    if (dto.diem === undefined && dto.noiDung === undefined) {
      throw new BadRequestException(
        'Can it nhat 1 truong de cap nhat danh gia',
      );
    }

    if (dto.diem !== undefined) {
      review.diem = dto.diem;
    }
    if (dto.noiDung !== undefined) {
      review.noi_dung = dto.noiDung.trim() || null;
    }
    review.cap_nhat_luc = new Date();
    const saved = await this.reviewRepo.save(review);

    await this.recalculateNutritionistRating(saved.chuyen_gia_dinh_duong_id);

    return {
      success: true,
      message: 'Cap nhat danh gia thanh cong',
      data: await this.toUserReviewResponse(saved),
    };
  }

  async handleConsultationPaymentReturn(query: Record<string, string>) {
    if (!verifyReturnSignature(query)) {
      return {
        success: false,
        bookingId: null,
        message: 'Xac minh chu ky thanh toan khong hop le',
      };
    }

    const payment = await this.paymentRepo.findOne({
      where: { ma_giao_dich: query['vnp_TxnRef'] },
      relations: ['lich_hen'],
    });

    if (!payment) {
      return {
        success: false,
        bookingId: null,
        message: 'Khong tim thay giao dich thanh toan',
      };
    }

    const result = await this.syncConsultationPayment(payment, query);
    return {
      success: result.success,
      bookingId: payment.lich_hen_id,
      message: result.message,
    };
  }

  async handleConsultationPaymentIpn(query: Record<string, string>) {
    if (!verifyIpnSignature(query)) {
      return { RspCode: '97', Message: 'Invalid signature' };
    }

    const payment = await this.paymentRepo.findOne({
      where: { ma_giao_dich: query['vnp_TxnRef'] },
      relations: ['lich_hen'],
    });

    if (!payment) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    const result = await this.syncConsultationPayment(payment, query);
    return result.success
      ? { RspCode: '00', Message: 'Success' }
      : { RspCode: '00', Message: result.message };
  }

  private async syncConsultationPayment(
    payment: ThanhToanTuVanEntity,
    query: Record<string, string>,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(ThanhToanTuVanEntity);
      const bookingRepo = manager.getRepository(LichHenEntity);
      const allocationRepo = manager.getRepository(PhanBoDoanhThuBookingEntity);
      const notifRepo = manager.getRepository(ThongBaoEntity);

      const paymentEntity = await paymentRepo.findOne({
        where: { id: payment.id },
      });
      const booking = await bookingRepo.findOne({
        where: { id: payment.lich_hen_id },
        relations: [
          'chuyen_gia_dinh_duong',
          'chuyen_gia_dinh_duong.tai_khoan',
          'tai_khoan',
          'goi_tu_van',
        ],
      });

      if (!paymentEntity || !booking) {
        return {
          success: false,
          message: 'Khong tim thay giao dich hoac booking',
        };
      }

      if (
        booking.trang_thai === 'vo_hieu_hoa' ||
        booking.trang_thai === 'da_huy'
      ) {
        return {
          success: false,
          message: 'Booking khong con hieu luc de ghi nhan thanh toan',
        };
      }

      const now = new Date();
      const mergedPaymentData = {
        ...(paymentEntity.du_lieu_thanh_toan &&
        typeof paymentEntity.du_lieu_thanh_toan === 'object'
          ? (paymentEntity.du_lieu_thanh_toan as Record<string, unknown>)
          : {}),
        ...query,
      };

      if (
        paymentEntity.trang_thai === 'thanh_cong' &&
        booking.trang_thai === 'da_xac_nhan'
      ) {
        return {
          success: true,
          message: 'Thanh toán đã được ghi nhận trước đó',
        };
      }

      if (isVnpaySuccess(query['vnp_TransactionStatus'])) {
        paymentEntity.trang_thai = 'thanh_cong';
        paymentEntity.thanh_toan_luc =
          this.parseVnpayDate(query['vnp_PayDate']) ?? now;
        paymentEntity.cap_nhat_luc = now;
        paymentEntity.du_lieu_thanh_toan = mergedPaymentData;
        await paymentRepo.save(paymentEntity);

        booking.trang_thai = 'da_xac_nhan';
        booking.cap_nhat_luc = now;
        await bookingRepo.save(booking);

        const allocation = await allocationRepo.findOne({
          where: { lich_hen_id: booking.id },
        });
        await allocationRepo.save(
          allocationRepo.create({
            id: allocation?.id,
            lich_hen_id: booking.id,
            thanh_toan_tu_van_id: paymentEntity.id,
            chuyen_gia_dinh_duong_id: booking.chuyen_gia_dinh_duong_id,
            so_tien_goc: Number(paymentEntity.so_tien).toFixed(2),
            ty_le_hoa_hong: COMMISSION_RATE_PERCENT.toFixed(2),
            so_tien_hoa_hong: this.roundMoney(
              Number(paymentEntity.so_tien) * COMMISSION_RATE,
            ).toFixed(2),
            so_tien_chuyen_gia_nhan: this.roundMoney(
              Number(paymentEntity.so_tien) * (1 - COMMISSION_RATE),
            ).toFixed(2),
            trang_thai: 'tam_giu',
            tao_luc: allocation?.tao_luc ?? now,
            cap_nhat_luc: now,
          }),
        );

        await this.createNotification(
          booking.tai_khoan_id,
          booking.tai_khoan_id,
          'Thanh toan booking thanh cong',
          `Booking ${booking.ma_lich_hen} da thanh toan thanh cong va da duoc xac nhan.`,
          `/nutrition/bookings/${booking.id}`,
          notifRepo,
        );

        await this.createNotification(
          booking.chuyen_gia_dinh_duong.tai_khoan_id,
          booking.tai_khoan_id,
          'Co booking moi da thanh toan',
          `Booking ${booking.ma_lich_hen} da thanh toan thanh cong. Ban co the vao xu ly lich hen.`,
          `/nutritionist/bookings/${booking.id}`,
          notifRepo,
        );

        return { success: true, message: 'Thanh toán thành công' };
      }

      paymentEntity.trang_thai = 'that_bai';
      paymentEntity.cap_nhat_luc = now;
      paymentEntity.du_lieu_thanh_toan = mergedPaymentData;
      await paymentRepo.save(paymentEntity);

      return { success: false, message: 'Thanh toán thất bại hoặc bị hủy' };
    });
  }

  private async getActiveUser(userId?: number) {
    if (!userId) {
      throw new UnauthorizedException('Ban chua dang nhap');
    }

    const user = await this.userRepo.findOne({
      where: {
        id: userId,
        vai_tro: 'nguoi_dung' as any,
        xoa_luc: IsNull(),
      },
    });

    if (!user) {
      throw new UnauthorizedException('Khong tim thay nguoi dung hop le');
    }

    if (user.trang_thai !== 'hoat_dong') {
      throw new ForbiddenException('Tai khoan khong o trang thai hoat dong');
    }

    return user;
  }

  private async getPublicNutritionistOrThrow(id: number) {
    const expert = await this.expertRepo.findOne({
      where: {
        id,
        trang_thai: 'hoat_dong' as any,
      },
      relations: ['tai_khoan'],
    });

    if (
      !expert ||
      !expert.tai_khoan ||
      expert.tai_khoan.trang_thai !== 'hoat_dong'
    ) {
      throw new NotFoundException('Khong tim thay nutritionist');
    }

    return expert;
  }

  private async getPackageUsageCountMap(packageIds: number[]) {
    const usageMap = new Map<number, number>();

    if (!packageIds.length) {
      return usageMap;
    }

    const rows = await this.bookingRepo.find({
      select: ['goi_tu_van_id'],
      where: {
        goi_tu_van_id: In(packageIds),
        trang_thai: In([...USED_PACKAGE_BOOKING_STATUSES]) as any,
      },
    });

    for (const row of rows) {
      usageMap.set(
        row.goi_tu_van_id,
        (usageMap.get(row.goi_tu_van_id) ?? 0) + 1,
      );
    }

    return usageMap;
  }

  private async getActivePackage(nutritionistId: number, packageId: number) {
    const item = await this.packageRepo.findOne({
      where: {
        id: packageId,
        chuyen_gia_dinh_duong_id: nutritionistId,
        trang_thai: 'dang_ban' as any,
        xoa_luc: IsNull(),
      },
    });

    if (!item) {
      throw new NotFoundException('Khong tim thay goi tu van hop le');
    }

    if (
      !Number.isInteger(item.thoi_luong_phut) ||
      item.thoi_luong_phut < MIN_PACKAGE_DURATION_MINUTES ||
      item.thoi_luong_phut > MAX_PACKAGE_DURATION_MINUTES
    ) {
      throw new BadRequestException(
        'Goi tu van dang co thoi luong moi buoi khong hop le. Vui long yeu cau nutritionist cap nhat lai goi',
      );
    }

    return item;
  }

  private normalizeTime(value: string) {
    return value.slice(0, 5);
  }

  private calculateEndTime(startTime: string, durationMinutes: number) {
    const [hour, minute] = startTime.split(':').map(Number);
    const totalMinutes = hour * 60 + minute + durationMinutes;
    if (totalMinutes > 24 * 60) {
      throw new BadRequestException(
        'Khung gio dat lich vuot qua gioi han trong ngay',
      );
    }
    const endHour = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const endMinute = String(totalMinutes % 60).padStart(2, '0');
    return `${endHour}:${endMinute}`;
  }

  private validateBookingDateTime(date: string, startTime: string) {
    const startAt = new Date(`${date}T${startTime}:00`);
    if (Number.isNaN(startAt.getTime())) {
      throw new BadRequestException('Ngay gio dat lich khong hop le');
    }
    if (startAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        'Chi duoc dat lich o thoi diem trong tuong lai',
      );
    }
  }

  private parseWorkingHours(raw: string | null): WorkingHoursMap | null {
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as WorkingHoursMap;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private assertWithinWorkingHours(
    rawWorkingHours: string | null,
    bookingDate: string,
    startTime: string,
    endTime: string,
  ) {
    const workingHours = this.parseWorkingHours(rawWorkingHours);
    if (!workingHours) {
      throw new BadRequestException(
        'Nutritionist chua cau hinh gio lam viec hop le',
      );
    }

    const weekdayKey =
      WEEKDAY_KEYS[new Date(`${bookingDate}T00:00:00`).getDay()];
    const slots = workingHours[weekdayKey] ?? [];
    const match = slots.some(
      (slot) => slot.start <= startTime && slot.end >= endTime,
    );

    if (!match) {
      throw new BadRequestException(
        'Khung gio dat lich nam ngoai gio lam viec cua nutritionist',
      );
    }
  }

  private async findReusablePendingBooking(
    userId: number,
    expertId: number,
    packageId: number,
    bookingDate: string,
    startTime: string,
    endTime: string,
  ) {
    const existing = await this.bookingRepo.findOne({
      where: {
        tai_khoan_id: userId,
        chuyen_gia_dinh_duong_id: expertId,
        goi_tu_van_id: packageId,
        ngay_hen: bookingDate,
        gio_bat_dau: `${startTime}:00`,
        gio_ket_thuc: `${endTime}:00`,
        trang_thai: 'cho_thanh_toan' as any,
      } as FindOptionsWhere<LichHenEntity>,
      order: { tao_luc: 'DESC' },
    });

    if (!existing) return null;
    if (this.isBookingExpired(existing)) return null;
    return existing;
  }

  private async assertNoBookingOverlap(
    userId: number,
    expertId: number,
    bookingDate: string,
    startTime: string,
    endTime: string,
  ) {
    const bookingStatuses = [...ACTIVE_BOOKING_STATUSES];
    const overlappedExpert = await this.bookingRepo
      .createQueryBuilder('booking')
      .where('booking.chuyen_gia_dinh_duong_id = :expertId', { expertId })
      .andWhere('booking.ngay_hen = :bookingDate', { bookingDate })
      .andWhere('booking.trang_thai IN (:...statuses)', {
        statuses: bookingStatuses,
      })
      .andWhere('booking.gio_bat_dau < :endTime', { endTime: `${endTime}:00` })
      .andWhere('booking.gio_ket_thuc > :startTime', {
        startTime: `${startTime}:00`,
      })
      .getOne();

    if (overlappedExpert) {
      throw new BadRequestException(
        'Khung gio nay da co booking khac cua nutritionist',
      );
    }

    const overlappedUser = await this.bookingRepo
      .createQueryBuilder('booking')
      .where('booking.tai_khoan_id = :userId', { userId })
      .andWhere('booking.ngay_hen = :bookingDate', { bookingDate })
      .andWhere('booking.trang_thai IN (:...statuses)', {
        statuses: bookingStatuses,
      })
      .andWhere('booking.gio_bat_dau < :endTime', { endTime: `${endTime}:00` })
      .andWhere('booking.gio_ket_thuc > :startTime', {
        startTime: `${startTime}:00`,
      })
      .getOne();

    if (overlappedUser) {
      throw new BadRequestException(
        'Ban da co booking khac trung khung gio nay',
      );
    }
  }

  private getBookingExpiresAt(booking: LichHenEntity) {
    return new Date(booking.tao_luc.getTime() + HOLD_WINDOW_MS);
  }

  private getMinutesRemaining(booking: LichHenEntity) {
    const diffMs = this.getBookingExpiresAt(booking).getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / 60000));
  }

  private isBookingExpired(booking: LichHenEntity) {
    return (
      booking.trang_thai === 'cho_thanh_toan' &&
      this.getBookingExpiresAt(booking).getTime() <= Date.now()
    );
  }

  private async expirePendingBookings(userId: number, bookingId?: number) {
    const qb = this.bookingRepo
      .createQueryBuilder('booking')
      .where('booking.tai_khoan_id = :userId', { userId })
      .andWhere('booking.trang_thai = :status', { status: 'cho_thanh_toan' });

    if (bookingId) {
      qb.andWhere('booking.id = :bookingId', { bookingId });
    }

    const pending = await qb.getMany();
    for (const booking of pending) {
      if (this.isBookingExpired(booking)) {
        booking.trang_thai = 'vo_hieu_hoa';
        booking.cap_nhat_luc = new Date();
        await this.bookingRepo.save(booking);

        await this.paymentRepo
          .createQueryBuilder()
          .update(ThanhToanTuVanEntity)
          .set({
            trang_thai: 'that_bai' as any,
            cap_nhat_luc: new Date(),
          })
          .where('lich_hen_id = :bookingId', { bookingId: booking.id })
          .andWhere('trang_thai IN (:...statuses)', {
            statuses: ['cho_thanh_toan', 'dang_xu_ly'],
          })
          .execute();
      }
    }
  }

  private async expireSingleBookingIfNeeded(booking: LichHenEntity) {
    if (this.isBookingExpired(booking)) {
      booking.trang_thai = 'vo_hieu_hoa';
      booking.cap_nhat_luc = new Date();
      await this.bookingRepo.save(booking);
      await this.paymentRepo
        .createQueryBuilder()
        .update(ThanhToanTuVanEntity)
        .set({
          trang_thai: 'that_bai' as any,
          cap_nhat_luc: new Date(),
        })
        .where('lich_hen_id = :bookingId', { bookingId: booking.id })
        .andWhere('trang_thai IN (:...statuses)', {
          statuses: ['cho_thanh_toan', 'dang_xu_ly'],
        })
        .execute();
    }
  }

  private generateBookingCode() {
    return `LH${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  private generatePaymentCode(bookingId: number) {
    return `BOOKING_${bookingId}_${Date.now()}`;
  }

  private async findActivePendingPayment(bookingId: number) {
    return this.paymentRepo.findOne({
      where: {
        lich_hen_id: bookingId,
        trang_thai: In(['cho_thanh_toan', 'dang_xu_ly']) as any,
      },
      order: { tao_luc: 'DESC' },
    });
  }

  private async getPaymentsForBooking(bookingId: number) {
    return this.paymentRepo.find({
      where: { lich_hen_id: bookingId },
      order: { tao_luc: 'DESC' },
    });
  }

  private async toUserReviewResponse(review: DanhGiaEntity) {
    let booking = review.lich_hen;
    if (!booking || !booking.goi_tu_van) {
      booking = (await this.bookingRepo.findOne({
        where: { id: review.lich_hen_id },
        relations: ['goi_tu_van'],
      })) as LichHenEntity;
    }

    let expert = review.chuyen_gia_dinh_duong;
    if (!expert || !expert.tai_khoan) {
      expert = (await this.expertRepo.findOne({
        where: { id: review.chuyen_gia_dinh_duong_id },
        relations: ['tai_khoan'],
      })) as ChuyenGiaDinhDuongEntity;
    }

    const editDeadline = new Date(
      review.tao_luc.getTime() + REVIEW_EDIT_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );

    return {
      id: review.id,
      booking_id: review.lich_hen_id,
      ma_lich_hen: booking?.ma_lich_hen ?? null,
      nutritionist: expert
        ? {
            id: expert.id,
            ho_ten: expert.tai_khoan?.ho_ten ?? null,
            chuyen_mon: expert.chuyen_mon,
          }
        : null,
      goi_tu_van: booking?.goi_tu_van
        ? {
            id: booking.goi_tu_van.id,
            ten: booking.goi_tu_van.ten,
          }
        : null,
      diem: review.diem,
      noi_dung: review.noi_dung,
      tra_loi: review.tra_loi,
      tao_luc: review.tao_luc,
      cap_nhat_luc: review.cap_nhat_luc,
      co_the_chinh_sua: Date.now() <= editDeadline.getTime(),
      co_the_chinh_sua_den_luc: editDeadline.toISOString(),
    };
  }

  private async recalculateNutritionistRating(chuyenGiaId: number) {
    const aggregate = await this.reviewRepo
      .createQueryBuilder('review')
      .select('COUNT(review.id)', 'count')
      .addSelect('AVG(review.diem)', 'avg')
      .where('review.chuyen_gia_dinh_duong_id = :chuyenGiaId', { chuyenGiaId })
      .getRawOne<{ count: string; avg: string | null }>();

    const count = Number(aggregate?.count ?? 0);
    const avg = Number(aggregate?.avg ?? 0);

    await this.expertRepo.update(chuyenGiaId, {
      so_luot_danh_gia: count,
      diem_danh_gia_trung_binh: avg.toFixed(2),
      cap_nhat_luc: new Date(),
    });
  }

  private async syncRefundPaymentsIfNeeded(
    booking: LichHenEntity,
    payments: ThanhToanTuVanEntity[],
  ) {
    const pendingRefundPayments = payments.filter(
      (payment) =>
        payment.trang_thai === 'dang_xu_ly' ||
        this.readRefundStatus(payment) === 'processing' ||
        (payment.trang_thai === 'da_hoan_tien' &&
          this.readRefundTransactionStatus(payment) === '05'),
    );

    if (pendingRefundPayments.length === 0) {
      return payments;
    }

    for (const payment of pendingRefundPayments) {
      try {
        await this.syncSingleRefundPayment(booking, payment);
      } catch (error) {
        console.error(
          '[UserConsultationService] Failed to sync refund payment status from VNPay',
          {
            bookingId: booking.id,
            paymentId: payment.id,
            paymentCode: payment.ma_giao_dich,
            error,
          },
        );
      }
    }

    return this.getPaymentsForBooking(booking.id);
  }

  private async syncSingleRefundPayment(
    booking: LichHenEntity,
    payment: ThanhToanTuVanEntity,
  ) {
    const paymentData =
      payment.du_lieu_thanh_toan &&
      typeof payment.du_lieu_thanh_toan === 'object'
        ? (payment.du_lieu_thanh_toan as Record<string, unknown>)
        : {};

    const txnRef =
      (typeof paymentData.vnp_TxnRef === 'string' && paymentData.vnp_TxnRef) ||
      payment.ma_giao_dich;
    const transactionDate =
      (typeof paymentData.vnp_PayDate === 'string' &&
        paymentData.vnp_PayDate) ||
      this.toVnpayLikeDate(payment.tao_luc);
    const transactionNo =
      typeof paymentData.vnp_TransactionNo === 'string'
        ? paymentData.vnp_TransactionNo
        : undefined;

    const query = await queryVnpayTransaction({
      txnRef,
      transactionDate,
      transactionNo,
      transactionType: '02',
      orderInfo: `Hoan tien booking ${booking.ma_lich_hen}`,
    });

    const queryResponse =
      query.response && typeof query.response === 'object'
        ? (query.response as Record<string, string>)
        : {};
    const queryStatus = queryResponse['vnp_TransactionStatus'] ?? '';
    const queryTransactionType = queryResponse['vnp_TransactionType'] ?? '';

    await this.dataSource.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(ThanhToanTuVanEntity);
      const allocationRepo = manager.getRepository(PhanBoDoanhThuBookingEntity);
      const notifRepo = manager.getRepository(ThongBaoEntity);

      const paymentEntity = await paymentRepo.findOne({
        where: { id: payment.id },
      });
      if (!paymentEntity) return;

      const metadata =
        paymentEntity.du_lieu_thanh_toan &&
        typeof paymentEntity.du_lieu_thanh_toan === 'object'
          ? { ...(paymentEntity.du_lieu_thanh_toan as Record<string, unknown>) }
          : {};
      const currentRefund =
        metadata.refund && typeof metadata.refund === 'object'
          ? { ...(metadata.refund as Record<string, unknown>) }
          : {};

      metadata.refund = {
        ...currentRefund,
        status:
          queryTransactionType === '02' && queryStatus === '00'
            ? 'success'
            : queryStatus === '06'
              ? 'bank_sent'
              : queryStatus === '09'
                ? 'failed'
                : 'processing',
        message:
          queryTransactionType === '02' && queryStatus === '00'
            ? 'Khoan hoan tien da duoc VNPay xac nhan thanh cong.'
            : queryStatus === '06'
              ? 'Yeu cau hoan tien da duoc VNPay gui sang ngan hang.'
              : queryStatus === '09'
                ? 'Yeu cau hoan tien bi tu choi.'
                : 'VNPay dang xu ly giao dich hoan tien.',
        response: currentRefund.response ?? null,
        query_response: queryResponse,
        transaction_status: queryStatus || null,
        last_checked_at: new Date().toISOString(),
      };

      paymentEntity.du_lieu_thanh_toan = metadata;
      paymentEntity.cap_nhat_luc = new Date();

      const allocation = await allocationRepo.findOne({
        where: { lich_hen_id: booking.id },
      });

      if (queryTransactionType === '02' && queryStatus === '00') {
        const alreadyRefunded = paymentEntity.trang_thai === 'da_hoan_tien';
        paymentEntity.trang_thai = 'da_hoan_tien' as any;
        paymentEntity.xac_nhan_luc = new Date();
        await paymentRepo.save(paymentEntity);

        if (allocation) {
          allocation.trang_thai = 'da_hoan_tien';
          allocation.cap_nhat_luc = new Date();
          await allocationRepo.save(allocation);
        }

        if (!alreadyRefunded) {
          await this.createNotification(
            booking.tai_khoan_id,
            null,
            'Hoan tien da duoc xac nhan',
            `Khoan hoan tien cho lich hen ${booking.ma_lich_hen} da duoc VNPay xac nhan thanh cong.`,
            `/nutrition/bookings/${booking.id}`,
            notifRepo,
          );

          await this.createNotification(
            booking.chuyen_gia_dinh_duong.tai_khoan_id,
            null,
            'Hoan tien booking da duoc xac nhan',
            `Khoan hoan tien cho lich hen ${booking.ma_lich_hen} da duoc VNPay xac nhan thanh cong.`,
            `/nutritionist/bookings/${booking.id}`,
            notifRepo,
          );
        }

        return;
      }

      if (queryStatus === '06') {
        const alreadySentToBank = currentRefund.status === 'bank_sent';
        paymentEntity.trang_thai = 'dang_xu_ly' as any;
        paymentEntity.xac_nhan_luc = new Date();
        await paymentRepo.save(paymentEntity);

        if (allocation) {
          allocation.trang_thai = 'tam_giu';
          allocation.cap_nhat_luc = new Date();
          await allocationRepo.save(allocation);
        }

        if (!alreadySentToBank) {
          await this.createNotification(
            booking.tai_khoan_id,
            null,
            'Yeu cau hoan tien da gui sang ngan hang',
            `Yeu cau hoan tien cho lich hen ${booking.ma_lich_hen} da duoc VNPay gui sang ngan hang.`,
            `/nutrition/bookings/${booking.id}`,
            notifRepo,
          );

          await this.createNotification(
            booking.chuyen_gia_dinh_duong.tai_khoan_id,
            null,
            'Yeu cau hoan tien booking da gui sang ngan hang',
            `Yeu cau hoan tien cho lich hen ${booking.ma_lich_hen} da duoc VNPay gui sang ngan hang.`,
            `/nutritionist/bookings/${booking.id}`,
            notifRepo,
          );
        }

        return;
      }

      if (queryStatus === '00' || queryStatus === '05') {
        paymentEntity.trang_thai = 'dang_xu_ly' as any;
        await paymentRepo.save(paymentEntity);
        return;
      }

      if (queryStatus === '09') {
        paymentEntity.trang_thai = 'thanh_cong' as any;
        await paymentRepo.save(paymentEntity);

        if (allocation) {
          allocation.trang_thai = 'tam_giu';
          allocation.cap_nhat_luc = new Date();
          await allocationRepo.save(allocation);
        }

        await this.createNotification(
          booking.tai_khoan_id,
          null,
          'Hoan tien chua thanh cong',
          `VNPay tu choi yeu cau hoan tien cho lich hen ${booking.ma_lich_hen}. He thong se can xu ly tiep.`,
          `/nutrition/bookings/${booking.id}`,
          notifRepo,
        );

        await this.createNotification(
          booking.chuyen_gia_dinh_duong.tai_khoan_id,
          null,
          'Hoan tien booking chua thanh cong',
          `VNPay tu choi yeu cau hoan tien cho lich hen ${booking.ma_lich_hen}. He thong se can xu ly tiep.`,
          `/nutritionist/bookings/${booking.id}`,
          notifRepo,
        );

        return;
      }

      paymentEntity.trang_thai = 'dang_xu_ly' as any;
      await paymentRepo.save(paymentEntity);
    });
  }

  private async getPaymentMap(bookingIds: number[]) {
    const payments = await this.paymentRepo.find({
      where: { lich_hen_id: In(bookingIds) },
      order: { tao_luc: 'DESC' },
    });
    const paymentMap = new Map<number, ThanhToanTuVanEntity[]>();
    for (const payment of payments) {
      const items = paymentMap.get(payment.lich_hen_id) ?? [];
      items.push(payment);
      paymentMap.set(payment.lich_hen_id, items);
    }
    return paymentMap;
  }

  private toUserBookingResponse(
    booking: LichHenEntity,
    payments: ThanhToanTuVanEntity[],
    includePayments = false,
  ) {
    const latestPayment = payments[0] ?? null;
    const pendingPayment = payments.find((item) =>
      ['cho_thanh_toan', 'dang_xu_ly'].includes(item.trang_thai),
    );
    const expiresAt = this.getBookingExpiresAt(booking);

    return {
      id: booking.id,
      ma_lich_hen: booking.ma_lich_hen,
      ngay_hen: booking.ngay_hen,
      gio_bat_dau: booking.gio_bat_dau,
      gio_ket_thuc: booking.gio_ket_thuc,
      dia_diem: booking.dia_diem,
      muc_dich: booking.muc_dich,
      trang_thai: booking.trang_thai,
      ly_do_huy: booking.ly_do_huy,
      huy_luc: booking.huy_luc,
      tao_luc: booking.tao_luc,
      cap_nhat_luc: booking.cap_nhat_luc,
      giu_cho_den_luc:
        booking.trang_thai === 'cho_thanh_toan'
          ? expiresAt.toISOString()
          : null,
      so_phut_con_lai:
        booking.trang_thai === 'cho_thanh_toan'
          ? this.getMinutesRemaining(booking)
          : 0,
      co_the_tiep_tuc_thanh_toan:
        booking.trang_thai === 'cho_thanh_toan' &&
        !!pendingPayment &&
        expiresAt.getTime() > Date.now(),
      nutritionist: booking.chuyen_gia_dinh_duong?.tai_khoan
        ? {
            id: booking.chuyen_gia_dinh_duong.id,
            ho_ten: booking.chuyen_gia_dinh_duong.tai_khoan.ho_ten,
            anh_dai_dien_url: booking.chuyen_gia_dinh_duong.anh_dai_dien_url,
            chuyen_mon: booking.chuyen_gia_dinh_duong.chuyen_mon,
          }
        : null,
      goi_tu_van: booking.goi_tu_van
        ? {
            id: booking.goi_tu_van.id,
            ten: booking.goi_tu_van.ten,
            gia: Number(booking.goi_tu_van.gia),
            thoi_luong_phut: booking.goi_tu_van.thoi_luong_phut,
          }
        : null,
      thanh_toan_moi_nhat: latestPayment
        ? {
            id: latestPayment.id,
            ma_giao_dich: latestPayment.ma_giao_dich,
            trang_thai: latestPayment.trang_thai,
            so_tien: Number(latestPayment.so_tien),
            thanh_toan_luc: latestPayment.thanh_toan_luc,
            refund_status: this.readRefundStatus(latestPayment),
            refund_message: this.readRefundMessage(latestPayment),
          }
        : null,
      ...(includePayments
        ? {
            lich_su_thanh_toan: payments.map((payment) =>
              this.toPaymentResponse(
                payment,
                booking,
                this.readPaymentUrl(payment),
                expiresAt,
                false,
              ),
            ),
          }
        : {}),
    };
  }

  private toPaymentResponse(
    payment: ThanhToanTuVanEntity,
    booking: LichHenEntity,
    paymentUrl: string | null,
    expiresAt: Date,
    reused: boolean,
  ) {
    return {
      id: payment.id,
      booking_id: booking.id,
      ma_giao_dich: payment.ma_giao_dich,
      phuong_thuc: payment.phuong_thuc,
      so_tien: Number(payment.so_tien),
      trang_thai: payment.trang_thai,
      refund_status: this.readRefundStatus(payment),
      refund_message: this.readRefundMessage(payment),
      payment_url: paymentUrl,
      reused,
      giu_cho_den_luc: expiresAt.toISOString(),
      so_phut_con_lai: this.getMinutesRemaining(booking),
      nutritionist: booking.chuyen_gia_dinh_duong?.tai_khoan
        ? {
            id: booking.chuyen_gia_dinh_duong.id,
            ho_ten: booking.chuyen_gia_dinh_duong.tai_khoan.ho_ten,
          }
        : null,
      goi_tu_van: booking.goi_tu_van
        ? {
            id: booking.goi_tu_van.id,
            ten: booking.goi_tu_van.ten,
            gia: Number(booking.goi_tu_van.gia),
          }
        : null,
      tao_luc: payment.tao_luc,
      cap_nhat_luc: payment.cap_nhat_luc,
      thanh_toan_luc: payment.thanh_toan_luc,
    };
  }

  private readPaymentUrl(payment: ThanhToanTuVanEntity) {
    if (
      !payment.du_lieu_thanh_toan ||
      typeof payment.du_lieu_thanh_toan !== 'object'
    ) {
      return null;
    }
    const value = (payment.du_lieu_thanh_toan as Record<string, unknown>)
      .payment_url;
    return typeof value === 'string' ? value : null;
  }

  private readRefundStatus(payment: ThanhToanTuVanEntity) {
    if (
      !payment.du_lieu_thanh_toan ||
      typeof payment.du_lieu_thanh_toan !== 'object'
    ) {
      if (payment.trang_thai === 'dang_xu_ly') return 'processing';
      if (payment.trang_thai === 'da_hoan_tien') return 'success';
      return null;
    }

    const refund = (payment.du_lieu_thanh_toan as Record<string, unknown>)
      .refund;
    if (!refund || typeof refund !== 'object') {
      if (payment.trang_thai === 'dang_xu_ly') return 'processing';
      if (payment.trang_thai === 'da_hoan_tien') return 'success';
      return null;
    }

    const status = (refund as Record<string, unknown>).status;
    if (typeof status === 'string' && status) {
      return status;
    }

    if (payment.trang_thai === 'dang_xu_ly') return 'processing';
    if (payment.trang_thai === 'da_hoan_tien') return 'success';
    return null;
  }

  private readRefundMessage(payment: ThanhToanTuVanEntity) {
    if (
      !payment.du_lieu_thanh_toan ||
      typeof payment.du_lieu_thanh_toan !== 'object'
    ) {
      return null;
    }

    const refund = (payment.du_lieu_thanh_toan as Record<string, unknown>)
      .refund;
    if (!refund || typeof refund !== 'object') {
      return null;
    }

    const message = (refund as Record<string, unknown>).message;
    return typeof message === 'string' ? message : null;
  }

  private readRefundTransactionStatus(payment: ThanhToanTuVanEntity) {
    if (
      !payment.du_lieu_thanh_toan ||
      typeof payment.du_lieu_thanh_toan !== 'object'
    ) {
      return null;
    }

    const refund = (payment.du_lieu_thanh_toan as Record<string, unknown>)
      .refund;
    if (!refund || typeof refund !== 'object') {
      return null;
    }

    const directStatus = (refund as Record<string, unknown>).transaction_status;
    if (typeof directStatus === 'string') {
      return directStatus;
    }

    const response = (refund as Record<string, unknown>).response;
    if (!response || typeof response !== 'object') {
      return null;
    }

    const nestedStatus = (response as Record<string, unknown>)
      .vnp_TransactionStatus;
    return typeof nestedStatus === 'string' ? nestedStatus : null;
  }

  private async createNotification(
    taiKhoanId: number,
    nguoiGuiId: number | null,
    tieuDe: string,
    noiDung: string,
    duongDan: string,
    repo: Repository<ThongBaoEntity> = this.notifRepo,
  ) {
    await repo.save(
      repo.create({
        tai_khoan_id: taiKhoanId,
        nguoi_gui_id: nguoiGuiId,
        loai: 'booking',
        tieu_de: tieuDe,
        noi_dung: noiDung,
        trang_thai: 'chua_doc',
        duong_dan_hanh_dong: duongDan,
        tao_luc: new Date(),
        cap_nhat_luc: new Date(),
      }),
    );
  }

  private buildUserCancellationNotificationMessage(
    maLichHen: string,
    refundResult: RefundResult,
  ) {
    if (refundResult.status === 'processing') {
      return `Lịch hẹn ${maLichHen} đã được hủy. VNPay đang xử lý yêu cầu hoàn tiền của bạn.`;
    }

    if (refundResult.status === 'success') {
      return `Lịch hẹn ${maLichHen} đã được hủy. Yêu cầu hoàn tiền đã được tiếp nhận.`;
    }

    if (refundResult.status === 'not_eligible') {
      return `Lịch hẹn ${maLichHen} đã được hủy. Booking này không đủ điều kiện hoàn tiền theo chính sách hiện tại.`;
    }

    if (refundResult.status === 'failed') {
      return `Lịch hẹn ${maLichHen} đã được hủy. Hệ thống chưa thể hoàn tiền tự động, vui lòng theo dõi thêm thông báo mới.`;
    }

    return `Lịch hẹn ${maLichHen} đã được hủy thành công.`;
  }

  private parseVnpayDate(value?: string) {
    if (!value || !/^\d{14}$/.test(value)) return null;
    const y = Number(value.slice(0, 4));
    const m = Number(value.slice(4, 6)) - 1;
    const d = Number(value.slice(6, 8));
    const hh = Number(value.slice(8, 10));
    const mm = Number(value.slice(10, 12));
    const ss = Number(value.slice(12, 14));
    return new Date(y, m, d, hh, mm, ss);
  }

  private roundMoney(value: number) {
    return Math.round(value * 100) / 100;
  }

  private async resolveUserCancellationRefund(
    booking: LichHenEntity,
    payment: ThanhToanTuVanEntity | null,
    actorId: number,
  ): Promise<RefundResult> {
    if (!payment || payment.trang_thai === 'da_hoan_tien') {
      return {
        status: 'not_required',
        message:
          payment?.trang_thai === 'da_hoan_tien'
            ? 'Booking đã được hủy. Giao dịch này đã được hoàn tiền trước đó.'
            : 'Hủy booking thành công',
      };
    }

    if (payment.trang_thai !== 'thanh_cong') {
      return { status: 'not_required', message: 'Hủy booking thành công' };
    }

    const bookingStartAt = this.getBookingStartAt(booking);
    const canRefund =
      bookingStartAt.getTime() - Date.now() >= 24 * 60 * 60 * 1000;

    if (!canRefund) {
      return {
        status: 'not_eligible',
        message:
          'Booking đã được hủy. Theo chính sách hiện tại, booking bị hủy dưới 24 giờ trước giờ hẹn sẽ không được hoàn tiền.',
      };
    }

    return this.processRefundIfNeeded(booking, payment, actorId, 'user');
  }

  private async processRefundIfNeeded(
    booking: LichHenEntity,
    payment: ThanhToanTuVanEntity | null,
    actorId: number,
    actorType: 'user' | 'nutritionist',
  ): Promise<RefundResult> {
    if (!payment || payment.trang_thai === 'da_hoan_tien') {
      return {
        status: 'not_required',
        message:
          payment?.trang_thai === 'da_hoan_tien'
            ? 'Giao dịch đã được hoàn tiền trước đó.'
            : 'Hủy booking thành công',
      };
    }

    if (payment.trang_thai !== 'thanh_cong') {
      return { status: 'not_required', message: 'Hủy booking thành công' };
    }

    if (payment.phuong_thuc !== 'vnpay') {
      return {
        status: 'success',
        message:
          'Hủy booking thành công, hoàn tiền sẽ được xử lý theo phương thức thủ công.',
      };
    }

    const paymentData =
      payment.du_lieu_thanh_toan &&
      typeof payment.du_lieu_thanh_toan === 'object'
        ? (payment.du_lieu_thanh_toan as Record<string, unknown>)
        : {};

    const txnRef =
      (typeof paymentData.vnp_TxnRef === 'string' && paymentData.vnp_TxnRef) ||
      payment.ma_giao_dich;
    const transactionDate =
      (typeof paymentData.vnp_PayDate === 'string' &&
        paymentData.vnp_PayDate) ||
      this.toVnpayLikeDate(payment.tao_luc);
    const transactionNo =
      typeof paymentData.vnp_TransactionNo === 'string'
        ? paymentData.vnp_TransactionNo
        : undefined;

    const refund = await refundVnpayTransaction({
      amount: Number(payment.so_tien),
      orderInfo: `Hoan tien booking ${booking.ma_lich_hen}`,
      txnRef,
      transactionDate,
      transactionNo,
      createBy: `${actorType}-${actorId}`,
    });

    if (!refund.success) {
      throw new BadRequestException(
        refund.message || 'VNPay tu choi yeu cau hoan tien',
      );
    }

    if (refund.response?.vnp_TransactionStatus === '05') {
      return {
        status: 'processing',
        message: refund.message,
        response: refund.response as Record<string, string>,
      };
    }

    return {
      status: 'success',
      message: refund.message,
      response: refund.response as Record<string, string>,
    };
  }

  private mergeRefundMetadata(
    current: object | null,
    refundResult: RefundResult,
    cancelReason?: string,
  ) {
    const refundResponse =
      refundResult.response && typeof refundResult.response === 'object'
        ? (refundResult.response as Record<string, unknown>)
        : null;

    return {
      ...(current && typeof current === 'object'
        ? (current as Record<string, unknown>)
        : {}),
      cancellation: {
        reason: cancelReason ?? null,
        recorded_at: new Date().toISOString(),
      },
      refund: {
        status: refundResult.status,
        message: refundResult.message,
        response: refundResult.response ?? null,
        transaction_status: refundResponse?.vnp_TransactionStatus ?? null,
        transaction_no: refundResponse?.vnp_TransactionNo ?? null,
        last_checked_at: new Date().toISOString(),
      },
    };
  }

  private getBookingStartAt(booking: LichHenEntity) {
    return new Date(`${booking.ngay_hen}T${booking.gio_bat_dau}`);
  }

  private toVnpayLikeDate(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${y}${m}${d}${hh}${mm}${ss}`;
  }
}
