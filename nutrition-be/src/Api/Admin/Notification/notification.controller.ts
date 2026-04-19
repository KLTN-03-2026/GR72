import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  CreateNotificationDto,
  NotificationQueryDto,
  UpdateNotificationDto,
} from './dto/notification.dto';
import { NotificationService } from './notification.service';

@Controller('admin/notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  findAll(
    @Req() req: { user?: { sub: number; vai_tro?: string } },
    @Query() query: NotificationQueryDto,
  ) {
    const userId = req.user?.sub;
    return this.service.findAll(query, userId);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: { user?: { sub: number } }) {
    const userId = req.user?.sub;
    return this.service.getUnreadCount(userId);
  }

  @Get(':id')
  findOne(
    @Req() req: { user?: { sub: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = req.user?.sub;
    return this.service.findOne(id, userId);
  }

  @Post()
  @Roles('quan_tri')
  create(
    @Req() req: { user?: { sub: number } },
    @Body() body: CreateNotificationDto,
  ) {
    const nguoiGuiId = req.user?.sub;
    return this.service.create(body, nguoiGuiId);
  }

  @Patch(':id')
  @Roles('quan_tri')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateNotificationDto,
  ) {
    return this.service.update(id, body);
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

  @Delete(':id')
  @Roles('quan_tri')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
