import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DataSource } from 'typeorm';
import { AUTH_COOKIE_NAME } from '../../common/constants/auth.constants';

type SocketUser = {
  sub: number;
  email: string;
  vai_tro: string;
};

type AuthenticatedSocket = Socket & {
  data: {
    user?: SocketUser;
    roomsByBooking?: Set<string>;
  };
};

type ChatMessage = Record<string, unknown> & {
  id: number;
  lich_hen_id: number;
};

function parseCookieHeader(header?: string) {
  if (!header) return {};
  return header.split(';').reduce<Record<string, string>>((cookies, item) => {
    const [rawKey, ...rawValue] = item.trim().split('=');
    if (!rawKey) return cookies;
    cookies[rawKey] = decodeURIComponent(rawValue.join('='));
    return cookies;
  }, {});
}

function bookingRoom(bookingId: number) {
  return `booking:${bookingId}`;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server?: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    const token = parseCookieHeader(client.handshake.headers.cookie)[AUTH_COOKIE_NAME];
    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<SocketUser>(token, {
        secret: process.env.JWT_SECRET ?? 'nutrition-secret',
      });
      client.data.user = {
        sub: Number(payload.sub),
        email: payload.email,
        vai_tro: payload.vai_tro,
      };
      client.data.roomsByBooking = new Set();
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    client.data.roomsByBooking?.clear();
  }

  @SubscribeMessage('chat:join')
  async joinBookingRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { bookingId?: number | string },
  ) {
    const bookingId = Number(body?.bookingId);
    const user = client.data.user;
    if (!user || !bookingId) return { ok: false, message: 'Không thể tham gia phòng chat.' };

    const canAccess = await this.canAccessBooking(user.sub, bookingId);
    if (!canAccess) return { ok: false, message: 'Bạn không có quyền xem phòng chat này.' };

    const room = bookingRoom(bookingId);
    await client.join(room);
    client.data.roomsByBooking?.add(room);
    return { ok: true, bookingId };
  }

  @SubscribeMessage('chat:leave')
  async leaveBookingRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { bookingId?: number | string },
  ) {
    const bookingId = Number(body?.bookingId);
    if (!bookingId) return { ok: false };
    const room = bookingRoom(bookingId);
    await client.leave(room);
    client.data.roomsByBooking?.delete(room);
    return { ok: true, bookingId };
  }

  emitMessageCreated(bookingId: number, message: ChatMessage) {
    this.server?.to(bookingRoom(bookingId)).emit('chat:message', {
      bookingId,
      message,
    });
  }

  emitChatRead(bookingId: number, readerId: number) {
    this.server?.to(bookingRoom(bookingId)).emit('chat:read', {
      bookingId,
      readerId,
      readAt: new Date().toISOString(),
    });
  }

  private async canAccessBooking(accountId: number, bookingId: number) {
    try {
      const [booking] = await this.dataSource.query(
        `SELECT lh.id
         FROM lich_hen lh
         LEFT JOIN chuyen_gia cg ON cg.id = lh.chuyen_gia_id
         WHERE lh.id = ? AND (lh.tai_khoan_id = ? OR cg.tai_khoan_id = ?)`,
        [bookingId, accountId, accountId],
      );
      return Boolean(booking);
    } catch (error) {
      this.logger.error(`Cannot authorize chat room ${bookingId}`, error as Error);
      return false;
    }
  }
}
