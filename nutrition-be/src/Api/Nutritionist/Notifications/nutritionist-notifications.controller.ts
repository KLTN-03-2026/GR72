import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { NutritionistNotificationsService } from './nutritionist-notifications.service';

@Roles('chuyen_gia_dinh_duong')
@Controller('nutritionist/notifications')
export class NutritionistNotificationsController {
  constructor(private readonly service: NutritionistNotificationsService) {}

  @Get()
  findAll(
    @Req() req: { user?: { sub: number } },
    @Query('trangThai') trangThai?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      return { success: false, message: 'Khong xac dinh duoc nguoi dung' };
    }
    return this.service.findAll(userId, { trangThai, page, limit });
  }

  @Patch(':id/read')
  markRead(
    @Req() req: { user?: { sub: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      return { success: false, message: 'Khong xac dinh duoc nguoi dung' };
    }
    return this.service.markRead(userId, id);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: { user?: { sub: number } }) {
    const userId = req.user?.sub;
    if (!userId) {
      return { success: false, message: 'Khong xac dinh duoc nguoi dung' };
    }
    return this.service.getUnreadCount(userId);
  }
}
