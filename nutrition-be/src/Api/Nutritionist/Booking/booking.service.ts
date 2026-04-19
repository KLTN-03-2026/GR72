import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, In, Repository } from 'typeorm';
import { LichHenEntity } from '../../Admin/Booking/entities/lich-hen.entity';
import { ThanhToanTuVanEntity } from '../../Admin/Booking/entities/thanh-toan-tu-van.entity';
import {
  PhanBoDoanhThuBookingEntity,
  PhanBoDoanhThuBookingStatus,
} from '../../Admin/Booking/entities/phan-bo-doanh-thu-booking.entity';
import { ThongBaoEntity } from '../../Admin/FoodReview/entities/thong-bao.entity';
import { ChuyenGiaDinhDuongEntity } from '../../Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import {
  formatVnpayDate,
  queryVnpayTransaction,
  refundVnpayTransaction,
  type VnpayRefundResponse,
} from '../../../common/vnpay/vnpay.util';
import {
  BookingQueryDto,
  BookingResponseDto,
  CompleteBookingDto,
  CancelBookingDto,
} from './dto/booking.dto';

const COMMISSION_RATE = 0.05;
const COMMISSION_RATE_PERCENT = 5;

type BookingFinanceContext = {
  payment: ThanhToanTuVanEntity | null;
  allocation: PhanBoDoanhThuBookingEntity | null;
};

type RefundResult = {
  status: 'not_required' | 'processing' | 'bank_sent' | 'success' | 'failed';
  message: string | null;
  response?: VnpayRefundResponse;
};

@Injectable()
export class NutritionistBookingService {
  constructor(
    @InjectRepository(LichHenEntity)
    private readonly bookingRepo: Repository<LichHenEntity>,
    @InjectRepository(ThanhToanTuVanEntity)
    private readonly paymentRepo: Repository<ThanhToanTuVanEntity>,
    @InjectRepository(PhanBoDoanhThuBookingEntity)
    private readonly allocationRepo: Repository<PhanBoDoanhThuBookingEntity>,
    @InjectRepository(ThongBaoEntity)
    private readonly notifRepo: Repository<ThongBaoEntity>,
    @InjectRepository(ChuyenGiaDinhDuongEntity)
    private readonly expertRepo: Repository<ChuyenGiaDinhDuongEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(userId: number, query: BookingQueryDto) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Math.min(50, Number(query.limit ?? 10)));

    const expert = await this.getExpertByUser(userId);

    const where: FindOptionsWhere<LichHenEntity> = {
      chuyen_gia_dinh_duong_id: expert.id,
    } as FindOptionsWhere<LichHenEntity>;

    if (query.trangThai) {
      where.trang_thai = query.trangThai as any;
    }

    if (query.ngayHen) {
      where.ngay_hen = query.ngayHen;
    }

    const [items, total] = await this.bookingRepo.findAndCount({
      where,
      relations: ['tai_khoan', 'goi_tu_van'],
      order: { ngay_hen: 'DESC', gio_bat_dau: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    await this.syncRefundPaymentsIfNeeded(items, expert.tai_khoan_id);
    const financeByBookingId = await this.buildFinanceMap(
      items.map((item) => item.id),
    );

    return {
      items: items.map((booking) =>
        this.toResponse(booking, financeByBookingId.get(booking.id)),
      ),
      pagination: { page, limit, total },
    };
  }

  async findOne(userId: number, id: number) {
    const expert = await this.getExpertByUser(userId);

    const booking = await this.bookingRepo.findOne({
      where: {
        id,
        chuyen_gia_dinh_duong_id: expert.id,
      } as FindOptionsWhere<LichHenEntity>,
      relations: ['tai_khoan', 'goi_tu_van'],
    });

    if (!booking) {
      throw new NotFoundException('Khong tim thay booking');
    }

    await this.syncRefundPaymentsIfNeeded([booking], expert.tai_khoan_id);
    const financeByBookingId = await this.buildFinanceMap([booking.id]);
    return this.toResponse(booking, financeByBookingId.get(booking.id));
  }

  async fakeRefundSuccess(userId: number, id: number) {
    const booking = await this.getBookingByUser(userId, id);

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
      if (!['processing', 'bank_sent'].includes(refundStatus)) {
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
        userId,
        'Hoan tien da duoc xac nhan',
        `Khoan hoan tien cho lich hen ${booking.ma_lich_hen} da duoc xac nhan thanh cong trong moi truong test.`,
        `/nutrition/bookings/${booking.id}`,
        notifRepo,
      );

      await this.createNotification(
        userId,
        userId,
        'Hoan tien booking da duoc xac nhan',
        `Khoan hoan tien cho lich hen ${booking.ma_lich_hen} da duoc xac nhan thanh cong trong moi truong test.`,
        `/nutritionist/bookings/${booking.id}`,
        notifRepo,
      );
    });

    return this.findOne(userId, id);
  }

  async confirm(userId: number, id: number) {
    const booking = await this.getBookingByUser(userId, id);

    if (booking.trang_thai !== 'da_xac_nhan') {
      throw new BadRequestException(
        'Chi booking da xac nhan moi duoc xac nhan',
      );
    }

    booking.trang_thai = 'da_checkin';
    booking.cap_nhat_luc = new Date();
    await this.bookingRepo.save(booking);

    await this.createNotification(
      booking.tai_khoan_id,
      userId,
      'Xac nhan booking',
      `Lịch hẹn ${booking.ma_lich_hen} đã được xác nhận bởi chuyên gia.`,
      `/nutrition/bookings/${booking.id}`,
    );

    const financeByBookingId = await this.buildFinanceMap([booking.id]);
    return this.toResponse(booking, financeByBookingId.get(booking.id));
  }

  async complete(userId: number, id: number, dto: CompleteBookingDto) {
    return this.bookingRepo.manager.transaction(async (manager) => {
      const bookingRepo = manager.getRepository(LichHenEntity);
      const paymentRepo = manager.getRepository(ThanhToanTuVanEntity);
      const allocationRepo = manager.getRepository(PhanBoDoanhThuBookingEntity);

      const booking = await this.getBookingByUser(userId, id, bookingRepo);

      if (
        booking.trang_thai !== 'da_checkin' &&
        booking.trang_thai !== 'dang_tu_van'
      ) {
        throw new BadRequestException(
          'Chi booking da checkin hoac dang tu van moi duoc hoan thanh',
        );
      }

      const payment = await paymentRepo.findOne({
        where: { lich_hen_id: id, trang_thai: 'thanh_cong' as any },
        order: { thanh_toan_luc: 'DESC', tao_luc: 'DESC' },
      });

      if (!payment) {
        throw new BadRequestException(
          'Booking phai co thanh toan thanh cong truoc khi hoan thanh',
        );
      }

      const now = new Date();
      booking.trang_thai = 'hoan_thanh';
      booking.ghi_chu_nutritionist = dto.ghiChu?.trim() || null;
      booking.cap_nhat_luc = now;
      await bookingRepo.save(booking);

      const allocation = await this.upsertAllocation(
        allocationRepo,
        booking,
        payment,
        'da_ghi_nhan',
        now,
      );

      await this.createNotification(
        booking.tai_khoan_id,
        userId,
        'Tu van hoan thanh',
        `Lịch hẹn ${booking.ma_lich_hen} đã hoàn thành. Vui lòng đánh giá chuyên gia.`,
        `/nutrition/bookings/${booking.id}`,
        manager.getRepository(ThongBaoEntity),
      );

      return this.toResponse(booking, { payment, allocation });
    });
  }

  async cancel(userId: number, id: number, dto: CancelBookingDto) {
    const booking = await this.getBookingByUser(userId, id);

    if (booking.trang_thai === 'hoan_thanh') {
      throw new BadRequestException('Khong the huy booking da hoan thanh');
    }

    if (booking.trang_thai === 'da_huy') {
      throw new BadRequestException('Booking da bi huy');
    }

    if (!dto.lyDoHuy?.trim()) {
      throw new BadRequestException('Ly do huy la bat buoc');
    }

    const payment = await this.paymentRepo.findOne({
      where: {
        lich_hen_id: id,
        trang_thai: In(['thanh_cong', 'da_hoan_tien', 'dang_xu_ly']) as any,
      },
      order: { thanh_toan_luc: 'DESC', tao_luc: 'DESC' },
    });

    const refundResult = await this.processRefundIfNeeded(
      booking,
      payment,
      userId,
    );

    try {
      return await this.bookingRepo.manager.transaction(async (manager) => {
        const bookingRepo = manager.getRepository(LichHenEntity);
        const paymentRepo = manager.getRepository(ThanhToanTuVanEntity);
        const allocationRepo = manager.getRepository(
          PhanBoDoanhThuBookingEntity,
        );
        const bookingToUpdate = await this.getBookingByUser(
          userId,
          id,
          bookingRepo,
        );

        const now = new Date();
        bookingToUpdate.trang_thai = 'da_huy';
        bookingToUpdate.ly_do_huy = dto.lyDoHuy.trim();
        bookingToUpdate.huy_boi = userId;
        bookingToUpdate.huy_luc = now;
        bookingToUpdate.cap_nhat_luc = now;
        await bookingRepo.save(bookingToUpdate);

        let paymentToUpdate = payment
          ? await paymentRepo.findOne({ where: { id: payment.id } })
          : null;

        if (
          paymentToUpdate &&
          refundResult.status === 'success' &&
          paymentToUpdate.trang_thai !== 'da_hoan_tien'
        ) {
          paymentToUpdate.trang_thai = 'da_hoan_tien' as any;
          paymentToUpdate.cap_nhat_luc = now;
          paymentToUpdate.xac_nhan_boi = userId;
          paymentToUpdate.xac_nhan_luc = now;
          paymentToUpdate.du_lieu_thanh_toan = this.mergePaymentMetadata(
            paymentToUpdate.du_lieu_thanh_toan,
            refundResult,
          );
          paymentToUpdate = await paymentRepo.save(paymentToUpdate);
        }

        if (paymentToUpdate && refundResult.status === 'processing') {
          paymentToUpdate.trang_thai = 'dang_xu_ly' as any;
          paymentToUpdate.cap_nhat_luc = now;
          paymentToUpdate.xac_nhan_boi = userId;
          paymentToUpdate.xac_nhan_luc = now;
          paymentToUpdate.du_lieu_thanh_toan = this.mergePaymentMetadata(
            paymentToUpdate.du_lieu_thanh_toan,
            refundResult,
          );
          paymentToUpdate = await paymentRepo.save(paymentToUpdate);
        }

        let allocation: PhanBoDoanhThuBookingEntity | null =
          await allocationRepo.findOne({
            where: { lich_hen_id: bookingToUpdate.id },
          });

        if (paymentToUpdate) {
          allocation = await this.upsertAllocation(
            allocationRepo,
            bookingToUpdate,
            paymentToUpdate,
            refundResult.status === 'success' ? 'da_hoan_tien' : 'tam_giu',
            now,
            allocation ?? undefined,
          );
        }

        await this.createNotification(
          bookingToUpdate.tai_khoan_id,
          userId,
          'Booking bi huy',
          this.buildUserCancellationMessage(
            bookingToUpdate.ma_lich_hen,
            dto.lyDoHuy.trim(),
            refundResult,
          ),
          `/nutrition/bookings/${bookingToUpdate.id}`,
          manager.getRepository(ThongBaoEntity),
        );

        if (refundResult.status === 'processing') {
          await this.createNotification(
            userId,
            userId,
            'Dang xu ly hoan tien',
            `VNPay đang xử lý hoàn tiền cho lịch hẹn ${bookingToUpdate.ma_lich_hen}.`,
            `/nutritionist/bookings/${bookingToUpdate.id}`,
            manager.getRepository(ThongBaoEntity),
          );
        }

        if (refundResult.status === 'success') {
          await this.createNotification(
            userId,
            userId,
            'Hoan tien thanh cong',
            `Yêu cầu hoàn tiền cho lịch hẹn ${bookingToUpdate.ma_lich_hen} đã được gửi thành công qua VNPay.`,
            `/nutritionist/bookings/${bookingToUpdate.id}`,
            manager.getRepository(ThongBaoEntity),
          );
        }

        return this.toResponse(
          bookingToUpdate,
          { payment: paymentToUpdate ?? null, allocation },
          refundResult,
        );
      });
    } catch (error) {
      if (
        refundResult.status === 'success' ||
        refundResult.status === 'processing'
      ) {
        console.error(
          '[NutritionistBookingService] Refund succeeded on VNPay but database sync failed',
          error,
        );
        throw new InternalServerErrorException(
          'Yeu cau hoan tien da gui thanh cong qua VNPay nhung he thong chua dong bo duoc trang thai noi bo',
        );
      }
      throw error;
    }
  }

  private async upsertAllocation(
    allocationRepo: Repository<PhanBoDoanhThuBookingEntity>,
    booking: LichHenEntity,
    payment: ThanhToanTuVanEntity,
    status: PhanBoDoanhThuBookingStatus,
    now: Date,
    current?: PhanBoDoanhThuBookingEntity,
  ) {
    const grossAmount = this.resolveGrossAmount(booking, payment);
    const commissionAmount = this.roundMoney(grossAmount * COMMISSION_RATE);
    const nutritionistNet = this.roundMoney(grossAmount - commissionAmount);

    const allocation =
      current ??
      (await allocationRepo.findOne({ where: { lich_hen_id: booking.id } })) ??
      allocationRepo.create({
        lich_hen_id: booking.id,
        thanh_toan_tu_van_id: payment.id,
        chuyen_gia_dinh_duong_id: booking.chuyen_gia_dinh_duong_id,
        tao_luc: now,
      });

    allocation.thanh_toan_tu_van_id = payment.id;
    allocation.chuyen_gia_dinh_duong_id = booking.chuyen_gia_dinh_duong_id;
    allocation.so_tien_goc = grossAmount.toFixed(2);
    allocation.ty_le_hoa_hong = COMMISSION_RATE_PERCENT.toFixed(2);
    allocation.so_tien_hoa_hong = commissionAmount.toFixed(2);
    allocation.so_tien_chuyen_gia_nhan = nutritionistNet.toFixed(2);
    allocation.trang_thai = status;
    allocation.cap_nhat_luc = now;

    return allocationRepo.save(allocation);
  }

  private async getBookingByUser(
    userId: number,
    id: number,
    bookingRepo: Repository<LichHenEntity> = this.bookingRepo,
  ) {
    const expert = await this.getExpertByUser(userId);

    const booking = await bookingRepo.findOne({
      where: {
        id,
        chuyen_gia_dinh_duong_id: expert.id,
      } as FindOptionsWhere<LichHenEntity>,
      relations: ['tai_khoan', 'goi_tu_van'],
    });

    if (!booking) {
      throw new NotFoundException('Khong tim thay booking');
    }

    return booking;
  }

  private async getExpertByUser(userId: number) {
    const expert = await this.expertRepo.findOne({
      where: { tai_khoan_id: userId },
    });

    if (!expert) {
      throw new NotFoundException('Khong tim thay chuyen gia');
    }

    return expert;
  }

  private async buildFinanceMap(bookingIds: number[]) {
    const financeByBookingId = new Map<number, BookingFinanceContext>();

    if (!bookingIds.length) {
      return financeByBookingId;
    }

    const payments = await this.paymentRepo.find({
      where: { lich_hen_id: In(bookingIds) },
      order: { cap_nhat_luc: 'DESC', tao_luc: 'DESC' },
    });
    const allocations = await this.allocationRepo.find({
      where: { lich_hen_id: In(bookingIds) },
    });

    const paymentByBookingId = new Map<number, ThanhToanTuVanEntity>();
    for (const payment of payments) {
      if (!paymentByBookingId.has(payment.lich_hen_id)) {
        paymentByBookingId.set(payment.lich_hen_id, payment);
      }
    }

    const allocationByBookingId = new Map<
      number,
      PhanBoDoanhThuBookingEntity
    >();
    for (const allocation of allocations) {
      allocationByBookingId.set(allocation.lich_hen_id, allocation);
    }

    for (const bookingId of bookingIds) {
      financeByBookingId.set(bookingId, {
        payment: paymentByBookingId.get(bookingId) ?? null,
        allocation: allocationByBookingId.get(bookingId) ?? null,
      });
    }

    return financeByBookingId;
  }

  private async syncRefundPaymentsIfNeeded(
    bookings: LichHenEntity[],
    nutritionistUserId: number,
  ) {
    if (!bookings.length) {
      return;
    }

    const bookingIds = bookings.map((booking) => booking.id);
    const payments = await this.paymentRepo.find({
      where: { lich_hen_id: In(bookingIds) },
      order: { tao_luc: 'DESC' },
    });

    const paymentsByBookingId = new Map<number, ThanhToanTuVanEntity[]>();
    for (const payment of payments) {
      const items = paymentsByBookingId.get(payment.lich_hen_id) ?? [];
      items.push(payment);
      paymentsByBookingId.set(payment.lich_hen_id, items);
    }

    for (const booking of bookings) {
      const bookingPayments = paymentsByBookingId.get(booking.id) ?? [];
      const pendingRefundPayments = bookingPayments.filter(
        (payment) =>
          payment.trang_thai === 'dang_xu_ly' ||
          this.readRefundStatus(payment) === 'processing' ||
          this.readRefundStatus(payment) === 'bank_sent' ||
          (payment.trang_thai === 'da_hoan_tien' &&
            this.readRefundTransactionStatus(payment) === '05'),
      );

      for (const payment of pendingRefundPayments) {
        try {
          await this.syncSingleRefundPayment(
            booking,
            payment,
            nutritionistUserId,
          );
        } catch (error) {
          console.error(
            '[NutritionistBookingService] Failed to sync refund payment status from VNPay',
            {
              bookingId: booking.id,
              paymentId: payment.id,
              paymentCode: payment.ma_giao_dich,
              error,
            },
          );
        }
      }
    }
  }

  private async syncSingleRefundPayment(
    booking: LichHenEntity,
    payment: ThanhToanTuVanEntity,
    nutritionistUserId: number,
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
            nutritionistUserId,
            'Hoan tien da duoc xac nhan',
            `Khoan hoan tien cho lich hen ${booking.ma_lich_hen} da duoc VNPay xac nhan thanh cong.`,
            `/nutrition/bookings/${booking.id}`,
            notifRepo,
          );

          await this.createNotification(
            nutritionistUserId,
            null as any,
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
            nutritionistUserId,
            'Yeu cau hoan tien da gui sang ngan hang',
            `Yeu cau hoan tien cho lich hen ${booking.ma_lich_hen} da duoc VNPay gui sang ngan hang.`,
            `/nutrition/bookings/${booking.id}`,
            notifRepo,
          );

          await this.createNotification(
            nutritionistUserId,
            null as any,
            'Yeu cau hoan tien booking da gui sang ngan hang',
            `Yeu cau hoan tien cho lich hen ${booking.ma_lich_hen} da duoc VNPay gui sang ngan hang.`,
            `/nutritionist/bookings/${booking.id}`,
            notifRepo,
          );
        }

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
          nutritionistUserId,
          'Hoan tien chua thanh cong',
          `VNPay tu choi yeu cau hoan tien cho lich hen ${booking.ma_lich_hen}. He thong se can xu ly tiep.`,
          `/nutrition/bookings/${booking.id}`,
          notifRepo,
        );

        await this.createNotification(
          nutritionistUserId,
          null as any,
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

  private async createNotification(
    taiKhoanId: number,
    nguoiGuiId: number,
    tieuDe: string,
    noiDung: string,
    duongDan: string,
    notifRepo: Repository<ThongBaoEntity> = this.notifRepo,
  ) {
    const now = new Date();
    await notifRepo.save(
      notifRepo.create({
        tai_khoan_id: taiKhoanId,
        nguoi_gui_id: nguoiGuiId,
        loai: 'booking',
        tieu_de: tieuDe,
        noi_dung: noiDung,
        trang_thai: 'chua_doc',
        duong_dan_hanh_dong: duongDan,
        tao_luc: now,
        cap_nhat_luc: now,
      }),
    );
  }

  private async processRefundIfNeeded(
    booking: LichHenEntity,
    payment: ThanhToanTuVanEntity | null,
    userId: number,
  ): Promise<RefundResult> {
    if (!payment || payment.trang_thai === 'da_hoan_tien') {
      return {
        status: 'not_required',
        message:
          payment?.trang_thai === 'da_hoan_tien'
            ? 'Giao dich da duoc hoan tien truoc do.'
            : null,
      };
    }

    if (payment.trang_thai !== 'thanh_cong') {
      return { status: 'not_required', message: null };
    }

    if (payment.phuong_thuc !== 'vnpay') {
      return {
        status: 'success',
        message: 'Booking da duoc huy va hoan tien theo phuong thuc thu cong.',
      };
    }

    const source = this.extractRefundSource(payment);
    if (!source.txnRef || !source.transactionDate) {
      throw new BadRequestException(
        'Khong du thong tin giao dich VNPay goc de thuc hien hoan tien',
      );
    }

    const refund = await refundVnpayTransaction({
      amount: Number(payment.so_tien),
      orderInfo: `Hoan tien booking ${booking.ma_lich_hen}`,
      txnRef: source.txnRef,
      transactionDate: source.transactionDate,
      transactionNo: source.transactionNo,
      createBy: `nutritionist-${userId}`,
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
        response: refund.response,
      };
    }

    return {
      status: 'success',
      message: refund.message,
      response: refund.response,
    };
  }

  private extractRefundSource(payment: ThanhToanTuVanEntity) {
    const metadata =
      payment.du_lieu_thanh_toan &&
      typeof payment.du_lieu_thanh_toan === 'object'
        ? (payment.du_lieu_thanh_toan as Record<string, unknown>)
        : {};

    const txnRef =
      this.readString(metadata['vnp_TxnRef']) ??
      this.readString(metadata['vnp_txn_ref']) ??
      payment.ma_giao_dich;

    const transactionNo =
      this.readString(metadata['vnp_TransactionNo']) ??
      this.readString(metadata['vnp_transaction_no']) ??
      undefined;

    const transactionDate =
      this.readString(metadata['vnp_CreateDate']) ??
      this.readString(metadata['vnp_TransactionDate']) ??
      formatVnpayDate(payment.tao_luc);

    return { txnRef, transactionNo, transactionDate };
  }

  private mergePaymentMetadata(
    current: object | null,
    refundResult: RefundResult,
  ): Record<string, unknown> {
    const base =
      current && typeof current === 'object'
        ? { ...(current as Record<string, unknown>) }
        : {};

    if (refundResult.response) {
      base.refund = {
        success: refundResult.status === 'success',
        status: refundResult.status,
        message: refundResult.message,
        transaction_status:
          refundResult.response?.vnp_TransactionStatus ?? null,
        response: refundResult.response,
      };
    }

    return base;
  }

  private buildUserCancellationMessage(
    maLichHen: string,
    lyDoHuy: string,
    refundResult: RefundResult,
  ) {
    if (refundResult.status === 'processing') {
      return `Lịch hẹn ${maLichHen} đã bị hủy. Lý do: ${lyDoHuy}. ${refundResult.message ?? 'VNPay dang xu ly giao dich hoan tien.'}`;
    }

    if (refundResult.status === 'success') {
      return `Lịch hẹn ${maLichHen} đã bị hủy. Lý do: ${lyDoHuy}. ${refundResult.message ?? 'Hoan tien da duoc gui qua VNPay.'}`;
    }

    return `Lịch hẹn ${maLichHen} đã bị hủy. Ly do: ${lyDoHuy}`;
  }

  private readString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value : null;
  }

  private readRefundStatus(payment: ThanhToanTuVanEntity | null) {
    if (
      !payment?.du_lieu_thanh_toan ||
      typeof payment.du_lieu_thanh_toan !== 'object'
    ) {
      if (payment?.trang_thai === 'dang_xu_ly') return 'processing' as const;
      if (payment?.trang_thai === 'da_hoan_tien') return 'success' as const;
      return 'not_required' as const;
    }

    const refund = (payment.du_lieu_thanh_toan as Record<string, unknown>)
      .refund;
    if (!refund || typeof refund !== 'object') {
      if (payment?.trang_thai === 'dang_xu_ly') return 'processing' as const;
      if (payment?.trang_thai === 'da_hoan_tien') return 'success' as const;
      return 'not_required' as const;
    }

    const status = (refund as Record<string, unknown>).status;
    if (typeof status === 'string') {
      return status as RefundResult['status'];
    }

    if (payment?.trang_thai === 'dang_xu_ly') return 'processing' as const;
    if (payment?.trang_thai === 'da_hoan_tien') return 'success' as const;
    return 'not_required' as const;
  }

  private readRefundTransactionStatus(payment: ThanhToanTuVanEntity | null) {
    if (
      !payment?.du_lieu_thanh_toan ||
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

  private toVnpayLikeDate(date: Date) {
    return formatVnpayDate(date);
  }

  private readRefundMessage(payment: ThanhToanTuVanEntity | null) {
    if (
      !payment?.du_lieu_thanh_toan ||
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

  private resolveGrossAmount(
    entity: LichHenEntity,
    payment?: ThanhToanTuVanEntity | null,
  ) {
    const paymentAmount = payment ? Number(payment.so_tien) : 0;
    if (paymentAmount > 0) {
      return paymentAmount;
    }
    return Number(entity.goi_tu_van?.gia ?? 0);
  }

  private roundMoney(value: number) {
    return Math.round(value * 100) / 100;
  }

  private toResponse(
    entity: LichHenEntity,
    finance?: BookingFinanceContext | null,
    refundResult?: RefundResult | null,
  ): BookingResponseDto {
    const payment = finance?.payment ?? null;
    const allocation = finance?.allocation ?? null;
    const grossAmount = allocation
      ? Number(allocation.so_tien_goc)
      : this.resolveGrossAmount(entity, payment);
    const commissionAmount = allocation
      ? Number(allocation.so_tien_hoa_hong)
      : this.roundMoney(grossAmount * COMMISSION_RATE);
    const expectedNetAmount = allocation
      ? Number(allocation.so_tien_chuyen_gia_nhan)
      : this.roundMoney(grossAmount - commissionAmount);
    const actualNetAmount =
      entity.trang_thai === 'hoan_thanh' &&
      allocation?.trang_thai === 'da_ghi_nhan'
        ? Number(allocation.so_tien_chuyen_gia_nhan)
        : 0;

    const derivedRefundStatus =
      refundResult?.status ?? this.readRefundStatus(payment);
    const derivedRefundMessage =
      refundResult?.message ?? this.readRefundMessage(payment);

    return {
      id: entity.id,
      maLichHen: entity.ma_lich_hen,
      taiKhoanId: entity.tai_khoan_id,
      tenUser: (entity.tai_khoan as any)?.ho_ten ?? '',
      chuyenGiaDinhDuongId: entity.chuyen_gia_dinh_duong_id,
      goiTuVanId: entity.goi_tu_van_id,
      tenGoiTuVan: entity.goi_tu_van?.ten ?? '',
      thoiLuongPhut: entity.goi_tu_van?.thoi_luong_phut ?? 0,
      ngayHen: entity.ngay_hen,
      gioBatDau: entity.gio_bat_dau,
      gioKetThuc: entity.gio_ket_thuc,
      diaDiem: entity.dia_diem,
      trangThai: entity.trang_thai,
      trangThaiThanhToan: payment?.trang_thai ?? null,
      trangThaiPhanBoDoanhThu: allocation?.trang_thai ?? null,
      mucDich: entity.muc_dich,
      ghiChuNutritionist: entity.ghi_chu_nutritionist,
      giaGoi: grossAmount,
      hoaHongHeThong:
        entity.trang_thai === 'da_huy' || entity.trang_thai === 'vo_hieu_hoa'
          ? 0
          : commissionAmount,
      thuNhapDuKien:
        entity.trang_thai === 'da_huy' || entity.trang_thai === 'vo_hieu_hoa'
          ? 0
          : expectedNetAmount,
      thuNhapThucNhan:
        entity.trang_thai === 'da_huy' || entity.trang_thai === 'vo_hieu_hoa'
          ? 0
          : actualNetAmount,
      refundStatus: derivedRefundStatus,
      refundMessage: derivedRefundMessage,
      taLuc: entity.tao_luc,
      capNhatLuc: entity.cap_nhat_luc,
    };
  }
}
