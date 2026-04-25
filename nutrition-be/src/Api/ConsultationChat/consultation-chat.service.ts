import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import type { IncomingMessage } from 'http';
import { Server as HttpServer } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { Repository } from 'typeorm';
import { LichHenEntity } from '../Admin/Booking/entities/lich-hen.entity';
import { ChuyenGiaDinhDuongEntity } from '../Admin/ChuyenGiaDinhDuong/entities/chuyen-gia-dinh-duong.entity';
import { TaiKhoanEntity } from '../Admin/User/entities/tai-khoan.entity';
import { TinNhanEntity, type ChatAttachment, type ChatMessageType } from './entities/tin-nhan.entity';

type ChatActorRole = 'nguoi_dung' | 'chuyen_gia_dinh_duong';

type BookingParticipant = {
  id: number;
  ho_ten: string;
  vai_tro: ChatActorRole;
  anh_dai_dien_url: string | null;
};

type ChatMessagePayload = {
  noiDung?: string;
  loai?: ChatMessageType;
  tepDinhKem?: ChatAttachment | null;
};

type ChatMessageResponse = {
  id: number;
  lich_hen_id: number;
  nguoi_gui: BookingParticipant;
  loai: ChatMessageType;
  noi_dung: string | null;
  tep_dinh_kem: ChatAttachment | null;
  da_doc_luc: string | null;
  tao_luc: string;
  cap_nhat_luc: string;
};

type ChatRoomResponse = {
  booking: {
    id: number;
    ma_lich_hen: string;
    ngay_hen: string;
    gio_bat_dau: string;
    gio_ket_thuc: string;
    trang_thai: string;
    can_chat: boolean;
    room_locked: boolean;
    lock_reason: string | null;
    current_time: string;
    room_end_at: string;
  };
  participant: {
    id: number;
    vai_tro: ChatActorRole;
    ho_ten: string;
    anh_dai_dien_url: string | null;
  };
  counterpart: BookingParticipant;
  messages: ChatMessageResponse[];
  room_state: ChatRoomState;
};

type ChatRoomState = {
  can_chat: boolean;
  room_locked: boolean;
  lock_reason: string | null;
  room_end_at: string;
  unread_count: number;
};

type WsClientEvent =
  | { type: 'send_message'; payload: ChatMessagePayload }
  | { type: 'mark_seen'; payload?: { upToMessageId?: number } }
  | { type: 'ping' };

type WsServerEvent =
  | { type: 'room_state'; data: ChatRoomResponse }
  | { type: 'message_created'; data: ChatMessageResponse }
  | {
      type: 'messages_seen';
      data: { reader_id: number; up_to_message_id: number; seen_at: string };
    }
  | { type: 'room_closed'; data: { reason: string; ended_at: string } }
  | { type: 'error'; message: string };

type ConnectedClient = {
  ws: WebSocket;
  bookingId: number;
  userId: number;
  closeTimer?: NodeJS.Timeout;
  healthTimer?: NodeJS.Timeout;
};

const AUTH_COOKIE_NAME = 'access_token';
const CHAT_PATH_PREFIX = '/api/consultation-chat/bookings/';

function parseCookieHeader(cookieHeader?: string) {
  if (!cookieHeader) return new Map<string, string>();

  return new Map(
    cookieHeader
      .split(';')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const index = item.indexOf('=');
        const key = index >= 0 ? item.slice(0, index).trim() : item;
        const value = index >= 0 ? item.slice(index + 1).trim() : '';
        return [key, decodeURIComponent(value)];
      }),
  );
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function toWsData(event: WsServerEvent) {
  return JSON.stringify(event);
}

function asId(value: number | string | bigint | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
}

@Injectable()
export class ConsultationChatService {
  private wsServer: WebSocketServer | null = null;
  private readonly connectedClients = new Set<ConnectedClient>();
  private readonly roomClients = new Map<number, Set<ConnectedClient>>();
  private readonly roomTimers = new Map<number, NodeJS.Timeout>();
  private readonly attachmentMaxBytes = this.resolveAttachmentMaxBytes();

  constructor(
    @InjectRepository(LichHenEntity)
    private readonly bookingRepo: Repository<LichHenEntity>,
    @InjectRepository(ChuyenGiaDinhDuongEntity)
    private readonly expertRepo: Repository<ChuyenGiaDinhDuongEntity>,
    @InjectRepository(TinNhanEntity)
    private readonly messageRepo: Repository<TinNhanEntity>,
    @InjectRepository(TaiKhoanEntity)
    private readonly userRepo: Repository<TaiKhoanEntity>,
    private readonly jwtService: JwtService,
  ) {}

  attach(httpServer: HttpServer) {
    if (this.wsServer) {
      return;
    }

    this.wsServer = new WebSocketServer({ noServer: true });

    httpServer.on('upgrade', (request, socket, head) => {
      const url = request.url ?? '';
      if (!url.startsWith(CHAT_PATH_PREFIX) || !url.endsWith('/ws')) {
        return;
      }

      const bookingId = this.extractBookingId(url);
      if (!bookingId) {
        socket.destroy();
        return;
      }

      this.authenticateSocket(request)
        .then((auth) => {
          if (!auth) {
            socket.destroy();
            return;
          }

          this.wsServer?.handleUpgrade(request, socket, head, (ws) => {
            void this.handleSocketConnection(ws, bookingId, auth.userId);
          });
        })
        .catch(() => socket.destroy());
    });
  }

  async getRoomState(userId: number | undefined, bookingId: number) {
    const context = await this.loadRoomContext(userId, bookingId);
    return {
      success: true,
      message: 'Lấy phòng chat thành công',
      data: context,
    };
  }

  async sendMessage(
    userId: number | undefined,
    bookingId: number,
    payload: ChatMessagePayload,
  ) {
    const { booking, participant, room_state } = await this.loadRoomContext(
      userId,
      bookingId,
    );

    if (!room_state.can_chat) {
      throw new BadRequestException(
        room_state.lock_reason === 'after_end'
          ? 'Phòng chat đã hết hạn'
          : 'Chỉ booking da_checkin mới được chat',
      );
    }

    const messageType: ChatMessageType = payload.loai === 'file' ? 'file' : 'text';
    const caption = payload.noiDung?.trim() ?? null;
    const attachment =
      messageType === 'file' ? this.normalizeAttachment(payload.tepDinhKem) : null;

    if (messageType === 'text' && !caption) {
      throw new BadRequestException('Vui lòng nhập nội dung tin nhắn');
    }

    if (messageType === 'file' && !attachment) {
      throw new BadRequestException('Vui lòng chọn file đính kèm');
    }

    if (attachment && attachment.size > this.attachmentMaxBytes) {
      throw new BadRequestException(
        `File đính kèm không được vượt quá ${Math.round(this.attachmentMaxBytes / (1024 * 1024))}MB`,
      );
    }

    const now = new Date();
    const saved = await this.messageRepo.save(
      this.messageRepo.create({
        lich_hen_id: booking.id,
        nguoi_gui_id: participant.id,
        loai: messageType,
        noi_dung: caption,
        tep_dinh_kem: attachment,
        tao_luc: now,
        cap_nhat_luc: now,
      }),
    );

    const response = this.mapSavedMessageWithSender(saved, participant);
    this.broadcastToRoom(booking.id, {
      type: 'message_created',
      data: response,
    });

    return {
      success: true,
      message: 'Gửi tin nhắn thành công',
      data: response,
    };
  }

  async loadMessages(userId: number | undefined, bookingId: number) {
    const context = await this.loadRoomContext(userId, bookingId);
    return {
      success: true,
      message: 'Lấy lịch sử chat thành công',
      data: {
        ...context,
        messages: context.messages,
      },
    };
  }

  async markSeen(
    userId: number | undefined,
    bookingId: number,
    upToMessageId?: number,
  ) {
    const { booking, participant } = await this.loadRoomContext(userId, bookingId);
    const seenAt = new Date();

    const unreadQuery = this.messageRepo
      .createQueryBuilder('message')
      .select('message.id', 'id')
      .where('message.lich_hen_id = :bookingId', { bookingId: booking.id })
      .andWhere('message.nguoi_gui_id != :readerId', { readerId: participant.id })
      .andWhere('message.da_doc_luc IS NULL')
      .orderBy('message.id', 'DESC')
      .limit(1);

    if (upToMessageId) {
      unreadQuery.andWhere('message.id <= :upToMessageId', { upToMessageId });
    }

    const lastUnread = await unreadQuery.getRawOne<{ id?: string }>();
    const lastSeenMessageId = lastUnread?.id ? Number(lastUnread.id) : null;

    if (!lastSeenMessageId) {
      return {
        success: true,
        message: 'Không có tin nhắn mới cần đánh dấu đã xem',
        data: {
          booking_id: booking.id,
          reader_id: participant.id,
          up_to_message_id: upToMessageId ?? null,
          seen_at: seenAt.toISOString(),
          affected: 0,
        },
      };
    }

    const result = await this.messageRepo
      .createQueryBuilder()
      .update(TinNhanEntity)
      .set({
        da_doc_luc: seenAt,
        da_doc_boi_id: participant.id,
      })
      .where('lich_hen_id = :bookingId', { bookingId: booking.id })
      .andWhere('nguoi_gui_id != :readerId', { readerId: participant.id })
      .andWhere('da_doc_luc IS NULL')
      .andWhere('id <= :lastSeenMessageId', { lastSeenMessageId })
      .execute();

    this.broadcastToRoom(booking.id, {
      type: 'messages_seen',
      data: {
        reader_id: participant.id,
        up_to_message_id: lastSeenMessageId,
        seen_at: seenAt.toISOString(),
      },
    });

    return {
      success: true,
      message: 'Đã đánh dấu tin nhắn là đã xem',
      data: {
        booking_id: booking.id,
        reader_id: participant.id,
        up_to_message_id: lastSeenMessageId,
        seen_at: seenAt.toISOString(),
        affected: result.affected ?? 0,
      },
    };
  }

  private async handleSocketConnection(
    ws: WebSocket,
    bookingId: number,
    userId: number,
  ) {
    const client: ConnectedClient = { ws, bookingId, userId };
    this.connectedClients.add(client);
    this.addClientToRoom(client);

    try {
      const context = await this.loadRoomContext(userId, bookingId);
      if (!context.room_state.can_chat) {
        ws.send(
          toWsData({
            type: 'room_state',
            data: context,
          }),
        );
        if (context.room_state.lock_reason === 'after_end') {
          ws.send(
            toWsData({
              type: 'room_closed',
              data: {
                reason: 'after_end',
                ended_at: context.room_state.room_end_at,
              },
            }),
          );
        }
        ws.close(1008, 'Room khong duoc mo');
        return;
      }

      ws.send(
        toWsData({
          type: 'room_state',
          data: context,
        }),
      );

      this.scheduleRoomClose(context.booking.id, context.room_state.room_end_at);
      client.healthTimer = setInterval(() => {
        void this.refreshClientState(client);
      }, 15000);

      ws.on('message', async (raw) => {
        const parsed = safeJsonParse<WsClientEvent>(raw.toString());
        if (!parsed) {
          ws.send(
            toWsData({
              type: 'error',
              message: 'Du lieu websocket khong hop le',
            }),
          );
          return;
        }

        if (parsed.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        if (parsed.type === 'send_message') {
          try {
            await this.sendMessage(userId, bookingId, parsed.payload);
          } catch (error) {
            ws.send(
              toWsData({
                type: 'error',
                message:
                  error instanceof Error ? error.message : 'Khong the gui tin nhan',
              }),
            );
          }
          return;
        }

        if (parsed.type === 'mark_seen') {
          try {
            await this.markSeen(
              userId,
              bookingId,
              parsed.payload?.upToMessageId,
            );
          } catch (error) {
            ws.send(
              toWsData({
                type: 'error',
                message:
                  error instanceof Error ? error.message : 'Khong the cap nhat da xem',
              }),
            );
          }
        }
      });
    } catch (error) {
      ws.send(
        toWsData({
          type: 'error',
          message: error instanceof Error ? error.message : 'Khong the mo phong chat',
        }),
      );
      ws.close(1008, 'Khong duoc truy cap');
    }

    ws.on('close', () => this.cleanupClient(client));
    ws.on('error', () => this.cleanupClient(client));
  }

  private async refreshClientState(client: ConnectedClient) {
    if (client.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const context = await this.loadRoomContext(client.userId, client.bookingId);
      if (!context.room_state.can_chat) {
        client.ws.send(
          toWsData({
            type: 'room_state',
            data: context,
          }),
        );
        client.ws.send(
          toWsData({
            type: 'room_closed',
            data: {
              reason: context.room_state.lock_reason ?? 'room_locked',
              ended_at: context.room_state.room_end_at,
            },
          }),
        );
        client.ws.close(1000, 'Phong chat da bi khoa');
      }
    } catch {
      client.ws.close(1008, 'Khong the kiem tra trang thai phong');
    }
  }

  private async loadRoomContext(
    userId: number | undefined,
    bookingId: number,
  ): Promise<ChatRoomResponse> {
    if (!userId) {
      throw new UnauthorizedException('Ban chua dang nhap');
    }

    const booking = await this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.tai_khoan', 'booking_user')
      .leftJoinAndSelect('booking.goi_tu_van', 'booking_package')
      .leftJoinAndSelect('booking.chuyen_gia_dinh_duong', 'booking_expert')
      .leftJoinAndSelect('booking_expert.tai_khoan', 'booking_expert_user')
      .where('booking.id = :bookingId', { bookingId })
      .getOne();

    if (!booking) {
      throw new NotFoundException('Khong tim thay lich hen');
    }

    const participant = await this.resolveParticipant(booking, userId);
    if (!participant) {
      throw new ForbiddenException('Ban khong co quyen truy cap phong chat nay');
    }

    const now = new Date();
    const endAt = this.getBookingEndAt(booking);
    const roomLocked =
      booking.trang_thai === 'da_huy' ||
      booking.trang_thai === 'vo_hieu_hoa' ||
      now.getTime() > endAt.getTime();
    const canChat = booking.trang_thai === 'da_checkin' && !roomLocked;
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

    const messages = await this.messageRepo.find({
      where: { lich_hen_id: booking.id },
      relations: { nguoi_gui: true },
      order: { tao_luc: 'ASC' },
    });
    const unreadCount = messages.filter(
      (message) =>
        message.nguoi_gui_id !== participant.id && !message.da_doc_luc,
    ).length;

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
        can_chat: canChat,
        room_locked: roomLocked,
        lock_reason: lockReason,
        current_time: now.toISOString(),
        room_end_at: endAt.toISOString(),
      },
      participant,
      counterpart,
      messages: messages.map((item) => this.mapMessage(item)),
      room_state: {
        can_chat: canChat,
        room_locked: roomLocked,
        lock_reason: lockReason,
        room_end_at: endAt.toISOString(),
        unread_count: unreadCount,
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

    if (asId(booking.chuyen_gia_dinh_duong_id)) {
      const expert = await this.expertRepo.findOne({
        where: { id: asId(booking.chuyen_gia_dinh_duong_id) ?? booking.chuyen_gia_dinh_duong_id },
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
    }

    return null;
  }

  private async mapUserParticipant(booking: LichHenEntity): Promise<BookingParticipant> {
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

  private async mapExpertParticipant(booking: LichHenEntity): Promise<BookingParticipant> {
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

  private mapMessage(
    message: TinNhanEntity,
  ): ChatMessageResponse {
    const sender = this.mapSender(message.nguoi_gui);
    return {
      id: message.id,
      lich_hen_id: message.lich_hen_id,
      nguoi_gui: sender,
      loai: message.loai,
      noi_dung: message.noi_dung,
      tep_dinh_kem: message.tep_dinh_kem,
      da_doc_luc: message.da_doc_luc?.toISOString() ?? null,
      tao_luc: message.tao_luc.toISOString(),
      cap_nhat_luc: message.cap_nhat_luc.toISOString(),
    };
  }

  private mapSavedMessageWithSender(
    message: TinNhanEntity,
    sender: BookingParticipant,
  ): ChatMessageResponse {
    return {
      id: message.id,
      lich_hen_id: message.lich_hen_id,
      nguoi_gui: sender,
      loai: message.loai,
      noi_dung: message.noi_dung,
      tep_dinh_kem: message.tep_dinh_kem,
      da_doc_luc: message.da_doc_luc?.toISOString() ?? null,
      tao_luc: message.tao_luc.toISOString(),
      cap_nhat_luc: message.cap_nhat_luc.toISOString(),
    };
  }

  private mapSender(user: TaiKhoanEntity): BookingParticipant {
    return {
      id: user.id,
      ho_ten: user.ho_ten,
      vai_tro: user.vai_tro === 'chuyen_gia_dinh_duong'
        ? 'chuyen_gia_dinh_duong'
        : 'nguoi_dung',
      anh_dai_dien_url: null,
    };
  }

  private normalizeAttachment(
    attachment?: ChatAttachment | null,
  ): ChatAttachment | null {
    if (!attachment) {
      return null;
    }

    if (
      !attachment.name ||
      !attachment.mimeType ||
      !attachment.dataUrl ||
      typeof attachment.size !== 'number'
    ) {
      throw new BadRequestException('File đính kèm không hợp lệ');
    }

    return {
      name: attachment.name,
      mimeType: attachment.mimeType,
      size: attachment.size,
      dataUrl: attachment.dataUrl,
    };
  }

  private getBookingEndAt(booking: LichHenEntity) {
    return new Date(
      `${booking.ngay_hen}T${booking.gio_ket_thuc.length === 5 ? `${booking.gio_ket_thuc}:00` : booking.gio_ket_thuc}+07:00`,
    );
  }

  private async authenticateSocket(request: IncomingMessage) {
    const cookies = parseCookieHeader(request.headers.cookie);
    const token = cookies.get(AUTH_COOKIE_NAME);
    if (!token) {
      throw new UnauthorizedException('Ban chua dang nhap');
    }

    const payload = await this.jwtService.verifyAsync<{
      sub?: number;
      email?: string;
      vai_tro?: ChatActorRole;
    }>(token, {
      secret: process.env.JWT_SECRET ?? 'nutrition-secret',
    });

    if (!payload.sub || !payload.vai_tro) {
      throw new UnauthorizedException('Token khong hop le');
    }

    if (!['nguoi_dung', 'chuyen_gia_dinh_duong'].includes(payload.vai_tro)) {
      throw new UnauthorizedException('Vai tro khong duoc ho tro');
    }

    return {
      userId: Number(payload.sub),
    };
  }

  private extractBookingId(url: string) {
    const match = url.match(/\/api\/consultation-chat\/bookings\/(\d+)\/ws/);
    return match ? Number(match[1]) : null;
  }

  private addClientToRoom(client: ConnectedClient) {
    const current = this.roomClients.get(client.bookingId) ?? new Set<ConnectedClient>();
    current.add(client);
    this.roomClients.set(client.bookingId, current);
  }

  private cleanupClient(client: ConnectedClient) {
    this.connectedClients.delete(client);
    const room = this.roomClients.get(client.bookingId);
    if (room) {
      room.delete(client);
      if (room.size === 0) {
        this.roomClients.delete(client.bookingId);
      }
    }

    if (client.closeTimer) {
      clearTimeout(client.closeTimer);
    }

    if (client.healthTimer) {
      clearInterval(client.healthTimer);
    }
  }

  private broadcastToRoom(bookingId: number, event: WsServerEvent) {
    const clients = this.roomClients.get(bookingId);
    if (!clients || clients.size === 0) {
      return;
    }

    const payload = toWsData(event);
    for (const client of clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    }
  }

  private scheduleRoomClose(bookingId: number, endAtIso: string) {
    if (this.roomTimers.has(bookingId)) {
      return;
    }

    const endAt = new Date(endAtIso);
    const delay = Math.max(endAt.getTime() - Date.now(), 0);

    const timer = setTimeout(() => {
      this.broadcastToRoom(bookingId, {
        type: 'room_closed',
        data: {
          reason: 'after_end',
          ended_at: endAt.toISOString(),
        },
      });

      const clients = this.roomClients.get(bookingId);
      if (clients) {
        for (const client of clients) {
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.close(1000, 'Phong chat da het han');
          }
        }
      }

      this.roomTimers.delete(bookingId);
    }, delay);

    this.roomTimers.set(bookingId, timer);
  }

  private resolveAttachmentMaxBytes() {
    const fallbackMb = 25;
    const configured = Number(process.env.CHAT_ATTACHMENT_MAX_MB ?? fallbackMb);
    const safeMb = Number.isFinite(configured) && configured > 0 ? configured : fallbackMb;
    return Math.floor(safeMb * 1024 * 1024);
  }
}
