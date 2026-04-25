import { Controller, Get, Param, ParseIntPipe, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { ConsultationCallService } from './consultation-call.service';

@Controller('consultation-call')
@Roles('nguoi_dung', 'chuyen_gia_dinh_duong')
export class ConsultationCallController {
  constructor(private readonly callService: ConsultationCallService) {}

  @Get('bookings/:bookingId')
  getRoomState(
    @Req() request: Request & { user?: { sub?: number } },
    @Param('bookingId', ParseIntPipe) bookingId: number,
  ) {
    return this.callService.getRoomState(request.user?.sub, bookingId);
  }

  @Post('bookings/:bookingId/token')
  createToken(
    @Req() request: Request & { user?: { sub?: number } },
    @Param('bookingId', ParseIntPipe) bookingId: number,
  ) {
    return this.callService.createJoinToken(request.user?.sub, bookingId);
  }
}

