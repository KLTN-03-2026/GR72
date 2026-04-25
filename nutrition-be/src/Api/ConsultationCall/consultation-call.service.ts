import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccessToken, type VideoGrant } from 'livekit-server-sdk';
import { Repository } from 'typeorm';
import { LichHenEntity } from '../Admin/Booking/entities/lich-hen.entity';
import { ChuyenGiaDinhDuongEntity } from '../Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import { TaiKhoanEntity } from '../Admin/User/entities/tai-khoan.entity';

type CallActorRole = 'nguoi_dung' | 'chuyen_gia_dinh_duong';

type BookingParticipant = {
  id: number;
  ho_ten: string;
  vai_tro: CallActorRole;
  anh_dai_dien_url: string | null;
};

type CallRoomState = {
  can_join: boolean;
  room_locked: boolean;
  lock_reason: string | null;
  room_end_at: string;
  current_time: string;
};

type CallRoomResponse = {
  booking: {
    id: number;
    ma_lich_hen: string;
    ngay_hen: string;
    gio_bat_dau: string;
    gio_ket_thuc: string;
    trang_thai: string;
  };
  participant: BookingParticipant;
  counterpart: BookingParticipant;
  room: {
    name: string;
  };
  room_state: CallRoomState;
};

function asId(value: number | string | bigint | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
}

@Injectable()
export class ConsultationCallService {
  constructor(
    @InjectRepository(LichHenEntity)
    private readonly bookingRepo: Repository<LichHenEntity>,
    @InjectRepository(ChuyenGiaDinhDuongEntity)
    private readonly expertRepo: Repository<ChuyenGiaDinhDuongEntity>,
    @InjectRepository(TaiKhoanEntity)
    private readonly userRepo: Repository<TaiKhoanEntity>,
  ) {}

  async getRoomState(userId: number | undefined, bookingId: number) {
    const context = await this.loadRoomContext(userId, bookingId);
    return {
      success: true,
      message: 'Lay trang thai phong goi video thanh cong',
      data: context,
    };
  }

  async createJoinToken(userId: number | undefined, bookingId: number) {
    const context = await this.loadRoomContext(userId, bookingId);
    if (!context.room_state.can_join) {
      throw new BadRequestException(
        context.room_state.lock_reason === 'after_end'
          ? 'Phong goi video da het han'
          : 'Chi booking da_checkin moi duoc vao goi video',
      );
    }

    const serverUrl = process.env.LIVEKIT_URL?.trim();
    const apiKey = process.env.LIVEKIT_API_KEY?.trim();
    const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();

    if (!serverUrl || !apiKey || !apiSecret) {
      throw new BadRequestException(
        'Thieu cau hinh LiveKit (LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)',
      );
    }

    const identity = `${context.participant.vai_tro}:${context.participant.id}`;
    const grant: VideoGrant = {
      roomJoin: true,
      room: context.room.name,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    };

    const token = new AccessToken(apiKey, apiSecret, {
      identity,
      name: context.participant.ho_ten,
      metadata: JSON.stringify({
        booking_id: context.booking.id,
        role: context.participant.vai_tro,
        participant_id: context.participant.id,
      }),
      ttl: '2h',
    });
    token.addGrant(grant);

    return {
      success: true,
      message: 'Tao token goi video thanh cong',
      data: {
        server_url: serverUrl,
        room_name: context.room.name,
        token: await token.toJwt(),
        participant: context.participant,
        counterpart: context.counterpart,
        room_state: context.room_state,
        booking: context.booking,
      },
    };
  }

  private async loadRoomContext(
    userId: number | undefined,
    bookingId: number,
  ): Promise<CallRoomResponse> {
    if (!userId) {
      throw new UnauthorizedException('Ban chua dang nhap');
    }

    const booking = await this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.tai_khoan', 'booking_user')
      .leftJoinAndSelect('booking.chuyen_gia_dinh_duong', 'booking_expert')
      .leftJoinAndSelect('booking_expert.tai_khoan', 'booking_expert_user')
      .where('booking.id = :bookingId', { bookingId })
      .getOne();

    if (!booking) {
      throw new NotFoundException('Khong tim thay lich hen');
    }

    const participant = await this.resolveParticipant(booking, userId);
    if (!participant) {
      throw new ForbiddenException(
        'Ban khong co quyen truy cap phong goi video nay',
      );
    }

    const now = new Date();
    const endAt = this.getBookingEndAt(booking);
    const roomLocked =
      booking.trang_thai === 'da_huy' ||
      booking.trang_thai === 'vo_hieu_hoa' ||
      now.getTime() > endAt.getTime();
    const canJoin = booking.trang_thai === 'da_checkin' && !roomLocked;
    const lockReason =
      booking.trang_thai === 'da_huy'
        ? 'booking_cancelled'
        : booking.trang_thai === 'vo_hieu_hoa'
          ? 'booking_disabled'
          : now.getTime() > endAt.getTime()
            ? 'after_end'
            : booking.trang_thai !== 'da_checkin'
              ? 'not_checked_in'
              : null;

    const counterpart =
      participant.vai_tro === 'nguoi_dung'
        ? await this.mapExpertParticipant(booking)
        : await this.mapUserParticipant(booking);

    return {
      booking: {
        id: booking.id,
        ma_lich_hen: booking.ma_lich_hen,
        ngay_hen: booking.ngay_hen,
        gio_bat_dau: booking.gio_bat_dau,
        gio_ket_thuc: booking.gio_ket_thuc,
        trang_thai: booking.trang_thai,
      },
      participant,
      counterpart,
      room: {
        name: `booking-${booking.id}`,
      },
      room_state: {
        can_join: canJoin,
        room_locked: roomLocked,
        lock_reason: lockReason,
        room_end_at: endAt.toISOString(),
        current_time: now.toISOString(),
      },
    };
  }

  private async resolveParticipant(booking: LichHenEntity, userId: number) {
    if (asId(booking.tai_khoan_id) === userId) {
      const account = await this.loadAccountById(
        asId(booking.tai_khoan_id) ?? booking.tai_khoan_id,
        booking.tai_khoan,
      );
      if (!account) {
        return null;
      }

      return {
        id: account.id,
        ho_ten: account.ho_ten,
        vai_tro: 'nguoi_dung' as const,
        anh_dai_dien_url: null,
      };
    }

    const expertId = asId(booking.chuyen_gia_dinh_duong_id);
    if (!expertId) {
      return null;
    }

    const expert = await this.expertRepo.findOne({
      where: { id: expertId },
      relations: ['tai_khoan'],
    });

    if (asId(expert?.tai_khoan_id) === userId && expert?.tai_khoan) {
      return {
        id: expert.tai_khoan.id,
        ho_ten: expert.tai_khoan.ho_ten,
        vai_tro: 'chuyen_gia_dinh_duong' as const,
        anh_dai_dien_url: expert.anh_dai_dien_url ?? null,
      };
    }

    return null;
  }

  private async mapUserParticipant(
    booking: LichHenEntity,
  ): Promise<BookingParticipant> {
    const account = await this.loadAccountById(
      asId(booking.tai_khoan_id) ?? booking.tai_khoan_id,
      booking.tai_khoan,
    );
    if (!account) {
      throw new NotFoundException('Khong tim thay nguoi dung');
    }

    return {
      id: account.id,
      ho_ten: account.ho_ten,
      vai_tro: 'nguoi_dung',
      anh_dai_dien_url: null,
    };
  }

  private async mapExpertParticipant(
    booking: LichHenEntity,
  ): Promise<BookingParticipant> {
    const expertId = asId(booking.chuyen_gia_dinh_duong_id);
    if (!expertId) {
      throw new NotFoundException('Khong tim thay chuyen gia');
    }

    const expert = await this.expertRepo.findOne({
      where: { id: expertId },
      relations: ['tai_khoan'],
    });

    if (!expert?.tai_khoan) {
      throw new NotFoundException('Khong tim thay chuyen gia');
    }

    return {
      id: expert.tai_khoan.id,
      ho_ten: expert.tai_khoan.ho_ten,
      vai_tro: 'chuyen_gia_dinh_duong',
      anh_dai_dien_url: expert.anh_dai_dien_url ?? null,
    };
  }

  private async loadAccountById(
    accountId: number,
    fallback?: TaiKhoanEntity | null,
  ) {
    if (asId(fallback?.id) === asId(accountId)) {
      return fallback;
    }

    return this.userRepo.findOne({
      where: { id: accountId },
    });
  }

  private getBookingEndAt(booking: LichHenEntity) {
    return new Date(
      `${booking.ngay_hen}T${
        booking.gio_ket_thuc.length === 5
          ? `${booking.gio_ket_thuc}:00`
          : booking.gio_ket_thuc
      }+07:00`,
    );
  }
}

