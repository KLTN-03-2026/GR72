import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Query,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { ConsultationChatService } from './consultation-chat.service';

@Controller('consultation-chat')
@Roles('nguoi_dung', 'chuyen_gia_dinh_duong')
export class ConsultationChatController {
  constructor(private readonly chatService: ConsultationChatService) {}

  @Get('bookings/:bookingId')
  getRoom(
    @Req() request: Request & { user?: { sub?: number } },
    @Param('bookingId', ParseIntPipe) bookingId: number,
  ) {
    return this.chatService.getRoomState(request.user?.sub, bookingId);
  }

  @Get('bookings/:bookingId/messages')
  getMessages(
    @Req() request: Request & { user?: { sub?: number } },
    @Param('bookingId', ParseIntPipe) bookingId: number,
  ) {
    return this.chatService.loadMessages(request.user?.sub, bookingId);
  }

  @Post('bookings/:bookingId/messages')
  sendMessage(
    @Req() request: Request & { user?: { sub?: number } },
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @Body() dto: SendChatMessageDto,
  ) {
    return this.chatService.sendMessage(request.user?.sub, bookingId, dto);
  }

  @Post('bookings/:bookingId/seen')
  markSeen(
    @Req() request: Request & { user?: { sub?: number } },
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @Query('upToMessageId') upToMessageId?: string,
  ) {
    return this.chatService.markSeen(
      request.user?.sub,
      bookingId,
      upToMessageId ? Number(upToMessageId) : undefined,
    );
  }
}
