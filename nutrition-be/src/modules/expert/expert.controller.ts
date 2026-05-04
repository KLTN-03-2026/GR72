import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { ExpertService } from './expert.service';

type AuthedRequest = Request & { user?: { sub?: number } };
const id = (value: string) => Number(value);

@Controller('expert')
@Roles('expert')
export class ExpertController {
  constructor(private readonly expertService: ExpertService) {}

  @Get('dashboard')
  dashboard(@Req() request: AuthedRequest) { return this.expertService.getDashboard(request.user?.sub); }

  @Get('profile')
  profile(@Req() request: AuthedRequest) { return this.expertService.getProfile(request.user?.sub); }

  @Patch('profile')
  updateProfile(@Req() request: AuthedRequest, @Body() body: Record<string, unknown>) { return this.expertService.updateProfile(request.user?.sub, body); }

  @Get('availability')
  availability(@Req() request: AuthedRequest) { return this.expertService.getAvailability(request.user?.sub); }

  @Put('availability/weekly')
  saveWeekly(@Req() request: AuthedRequest, @Body() body: Record<string, unknown>) { return this.expertService.saveWeeklyAvailability(request.user?.sub, body); }

  @Post('availability/blocked-times')
  createBlocked(@Req() request: AuthedRequest, @Body() body: Record<string, unknown>) { return this.expertService.createBlockedTime(request.user?.sub, body); }

  @Delete('availability/blocked-times/:id')
  deleteBlocked(@Req() request: AuthedRequest, @Param('id') blockedId: string) { return this.expertService.deleteBlockedTime(request.user?.sub, id(blockedId)); }

  @Get('availability/preview')
  preview(@Req() request: AuthedRequest, @Query() query: Record<string, string>) { return this.expertService.previewAvailability(request.user?.sub, query); }

  @Get('bookings')
  bookings(@Req() request: AuthedRequest, @Query() query: Record<string, string>) { return this.expertService.listBookings(request.user?.sub, query); }

  @Get('bookings/:id')
  booking(@Req() request: AuthedRequest, @Param('id') bookingId: string) { return this.expertService.getBooking(request.user?.sub, id(bookingId)); }

  @Patch('bookings/:id/confirm')
  confirm(@Req() request: AuthedRequest, @Param('id') bookingId: string) { return this.expertService.updateBookingStatus(request.user?.sub, id(bookingId), 'da_xac_nhan'); }

  @Patch('bookings/:id/reject')
  reject(@Req() request: AuthedRequest, @Param('id') bookingId: string, @Body() body: Record<string, unknown>) { return this.expertService.rejectBooking(request.user?.sub, id(bookingId), body); }

  @Post('bookings/:id/check-in')
  checkIn(@Req() request: AuthedRequest, @Param('id') bookingId: string) { return this.expertService.updateBookingStatus(request.user?.sub, id(bookingId), 'da_checkin'); }

  @Patch('bookings/:id/complete')
  complete(@Req() request: AuthedRequest, @Param('id') bookingId: string) { return this.expertService.completeBooking(request.user?.sub, id(bookingId)); }

  @Get('bookings/:id/notes')
  notes(@Req() request: AuthedRequest, @Param('id') bookingId: string) { return this.expertService.getNotes(request.user?.sub, id(bookingId)); }

  @Put('bookings/:id/notes')
  saveNotes(@Req() request: AuthedRequest, @Param('id') bookingId: string, @Body() body: Record<string, unknown>) { return this.expertService.saveNotes(request.user?.sub, id(bookingId), body); }

  @Get('reviews/summary')
  reviewSummary(@Req() request: AuthedRequest) { return this.expertService.getReviewSummary(request.user?.sub); }

  @Get('reviews')
  reviews(@Req() request: AuthedRequest, @Query() query: Record<string, string>) { return this.expertService.listReviews(request.user?.sub, query); }

  @Post('reviews/:id/reply')
  reply(@Req() request: AuthedRequest, @Param('id') reviewId: string, @Body() body: Record<string, unknown>) { return this.expertService.replyReview(request.user?.sub, id(reviewId), body); }

  @Get('earnings')
  earnings(@Req() request: AuthedRequest, @Query() query: Record<string, string>) { return this.expertService.getEarnings(request.user?.sub, query); }

  @Get('earnings/:periodId/bookings')
  earningBookings(@Req() request: AuthedRequest, @Param('periodId') periodId: string) { return this.expertService.getEarningBookings(request.user?.sub, id(periodId)); }

  @Get('earnings/:periodId/export')
  earningExport(@Req() request: AuthedRequest, @Param('periodId') periodId: string) { return this.expertService.exportEarnings(request.user?.sub, id(periodId)); }

  @Get('notifications/summary')
  notificationSummary(@Req() request: AuthedRequest) { return this.expertService.getNotificationSummary(request.user?.sub); }

  @Get('notifications')
  notifications(@Req() request: AuthedRequest, @Query() query: Record<string, string>) { return this.expertService.listNotifications(request.user?.sub, query); }

  @Patch('notifications/:id/read')
  markRead(@Req() request: AuthedRequest, @Param('id') notificationId: string) { return this.expertService.markNotificationRead(request.user?.sub, id(notificationId)); }

  @Patch('notifications/read-all')
  markAllRead(@Req() request: AuthedRequest) { return this.expertService.markAllNotificationsRead(request.user?.sub); }

  @Get('chats')
  chats(@Req() request: AuthedRequest, @Query() query: Record<string, string>) { return this.expertService.listChats(request.user?.sub, query); }

  @Get('chats/:bookingId/messages')
  messages(@Req() request: AuthedRequest, @Param('bookingId') bookingId: string) { return this.expertService.getMessages(request.user?.sub, id(bookingId)); }

  @Post('chats/:bookingId/messages')
  sendMessage(@Req() request: AuthedRequest, @Param('bookingId') bookingId: string, @Body() body: Record<string, unknown>) { return this.expertService.sendMessage(request.user?.sub, id(bookingId), body); }

  @Patch('chats/:bookingId/read')
  readChat(@Req() request: AuthedRequest, @Param('bookingId') bookingId: string) { return this.expertService.markChatRead(request.user?.sub, id(bookingId)); }

  @Get('bookings/:id/call-session')
  callSession(@Req() request: AuthedRequest, @Param('id') bookingId: string) { return this.expertService.getCallSession(request.user?.sub, id(bookingId)); }

  @Post('bookings/:id/call-token')
  callToken(@Req() request: AuthedRequest, @Param('id') bookingId: string) { return this.expertService.createCallToken(request.user?.sub, id(bookingId)); }
}
