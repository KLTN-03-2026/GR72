import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
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
  status: 'not_required' | 'success' | 'failed';
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

    const financeByBookingId = await this.buildFinanceMap(items.map((item) => item.id));

    return {
      items: items.map((booking) => this.toResponse(booking, financeByBookingId.get(booking.id))),
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

    const financeByBookingId = await this.buildFinanceMap([booking.id]);
    return this.toResponse(booking, financeByBookingId.get(booking.id));
  }

  async confirm(userId: number, id: number) {
    const booking = await this.getBookingByUser(userId, id);

    if (booking.trang_thai !== 'da_xac_nhan') {
      throw new BadRequestException('Chi booking da xac nhan moi duoc xac nhan');
    }

    booking.trang_thai = 'da_checkin';
    booking.cap_nhat_luc = new Date();
    await this.bookingRepo.save(booking);

    await this.createNotification(
      booking.tai_khoan_id,
      userId,
      'Xac nhan booking',
      `Lịch hẹn ${booking.ma_lich_hen} đã được xác nhận bởi chuyên gia.`,
      `/user/bookings/${booking.id}`,
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

      if (booking.trang_thai !== 'da_checkin' && booking.trang_thai !== 'dang_tu_van') {
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
        `/user/bookings/${booking.id}`,
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
        trang_thai: In(['thanh_cong', 'da_hoan_tien']) as any,
      },
      order: { thanh_toan_luc: 'DESC', tao_luc: 'DESC' },
    });

    const refundResult = await this.processRefundIfNeeded(booking, payment, userId);

    try {
      return await this.bookingRepo.manager.transaction(async (manager) => {
      const bookingRepo = manager.getRepository(LichHenEntity);
      const paymentRepo = manager.getRepository(ThanhToanTuVanEntity);
      const allocationRepo = manager.getRepository(PhanBoDoanhThuBookingEntity);
      const bookingToUpdate = await this.getBookingByUser(userId, id, bookingRepo);

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

      if (paymentToUpdate && paymentToUpdate.trang_thai !== 'da_hoan_tien') {
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

      let allocation: PhanBoDoanhThuBookingEntity | null = await allocationRepo.findOne({
        where: { lich_hen_id: bookingToUpdate.id },
      });

      if (paymentToUpdate) {
        allocation = await this.upsertAllocation(
          allocationRepo,
          bookingToUpdate,
          paymentToUpdate,
          'da_hoan_tien',
          now,
          allocation ?? undefined,
        );
      }

      await this.createNotification(
        bookingToUpdate.tai_khoan_id,
        userId,
        'Booking bi huy',
        this.buildUserCancellationMessage(bookingToUpdate.ma_lich_hen, dto.lyDoHuy.trim(), refundResult),
        `/user/bookings/${bookingToUpdate.id}`,
        manager.getRepository(ThongBaoEntity),
      );

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
      if (refundResult.status === 'success') {
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
      where: { id, chuyen_gia_dinh_duong_id: expert.id } as FindOptionsWhere<LichHenEntity>,
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

    const allocationByBookingId = new Map<number, PhanBoDoanhThuBookingEntity>();
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
        message: payment?.trang_thai === 'da_hoan_tien' ? 'Giao dich da duoc hoan tien truoc do.' : null,
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
      throw new BadRequestException(refund.message || 'VNPay tu choi yeu cau hoan tien');
    }

    return {
      status: 'success',
      message: refund.message,
      response: refund.response,
    };
  }

  private extractRefundSource(payment: ThanhToanTuVanEntity) {
    const metadata =
      payment.du_lieu_thanh_toan && typeof payment.du_lieu_thanh_toan === 'object'
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
      current && typeof current === 'object' ? { ...(current as Record<string, unknown>) } : {};

    if (refundResult.response) {
      base.refund = {
        success: refundResult.status === 'success',
        message: refundResult.message,
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
    if (refundResult.status === 'success') {
      return `Lịch hẹn ${maLichHen} đã bị hủy. Lý do: ${lyDoHuy}. ${refundResult.message ?? 'Hoan tien da duoc gui qua VNPay.'}`;
    }

    return `Lịch hẹn ${maLichHen} đã bị hủy. Ly do: ${lyDoHuy}`;
  }

  private readString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value : null;
  }

  private resolveGrossAmount(entity: LichHenEntity, payment?: ThanhToanTuVanEntity | null) {
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
      entity.trang_thai === 'hoan_thanh' && allocation?.trang_thai === 'da_ghi_nhan'
        ? Number(allocation.so_tien_chuyen_gia_nhan)
        : 0;

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
        entity.trang_thai === 'da_huy' || entity.trang_thai === 'vo_hieu_hoa' ? 0 : commissionAmount,
      thuNhapDuKien:
        entity.trang_thai === 'da_huy' || entity.trang_thai === 'vo_hieu_hoa' ? 0 : expectedNetAmount,
      thuNhapThucNhan:
        entity.trang_thai === 'da_huy' || entity.trang_thai === 'vo_hieu_hoa' ? 0 : actualNetAmount,
      refundStatus: refundResult?.status ?? 'not_required',
      refundMessage: refundResult?.message ?? null,
      taLuc: entity.tao_luc,
      capNhatLuc: entity.cap_nhat_luc,
    };
  }
}
