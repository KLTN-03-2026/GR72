import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CustomerService } from './customer.service';

type AuthedRequest = Request & { user?: { sub?: number } };
const toId = (value: string) => Number(value);

@Controller('customer')
@Roles('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  // ── Service Packages ──
  @Get('service-packages')
  servicePackages(@Query() query: Record<string, string>) {
    return this.customerService.listServicePackages(query);
  }

  @Get('service-packages/:id')
  servicePackage(@Req() req: AuthedRequest, @Param('id') pid: string) {
    return this.customerService.getServicePackage(req.user?.sub, toId(pid));
  }

  // ── Package Purchases ──
  @Post('package-purchases')
  createPackagePurchase(@Req() req: AuthedRequest, @Body() body: Record<string, unknown>) {
    return this.customerService.createPackagePurchase(req.user?.sub, body);
  }

  @Get('package-purchases/:id')
  packagePurchase(@Req() req: AuthedRequest, @Param('id') pid: string) {
    return this.customerService.getPackagePurchase(req.user?.sub, toId(pid));
  }

  // ── My Packages ──
  @Get('my-packages')
  myPackages(@Req() req: AuthedRequest, @Query() query: Record<string, string>) {
    return this.customerService.listMyPackages(req.user?.sub, query);
  }

  @Get('my-packages/:id')
  myPackage(@Req() req: AuthedRequest, @Param('id') pid: string) {
    return this.customerService.getMyPackage(req.user?.sub, toId(pid));
  }

  @Get('my-packages/:id/usage-history')
  usageHistory(@Req() req: AuthedRequest, @Param('id') pid: string) {
    return this.customerService.getPackageUsageHistory(req.user?.sub, toId(pid));
  }

  @Post('my-packages/:id/renew')
  renewPackage(@Req() req: AuthedRequest, @Param('id') pid: string) {
    return this.customerService.renewPackage(req.user?.sub, toId(pid));
  }

  @Get('my-packages/:id/experts')
  packageExperts(@Req() req: AuthedRequest, @Param('id') pid: string, @Query() query: Record<string, string>) {
    return this.customerService.listExpertsByPackagePurchase(req.user?.sub, toId(pid), query);
  }

  // ── Experts ──
  @Get('experts/:id')
  expertDetail(@Param('id') eid: string) {
    return this.customerService.getExpertDetail(toId(eid));
  }

  @Get('experts/:id/availability')
  expertAvailability(
    @Req() req: AuthedRequest,
    @Param('id') eid: string,
    @Query('packagePurchaseId') ppId: string,
    @Query() query: Record<string, string>,
  ) {
    return this.customerService.getExpertAvailability(req.user?.sub, toId(eid), toId(ppId), query);
  }

  @Get('experts/:id/available-slots')
  availableSlots(
    @Req() req: AuthedRequest,
    @Param('id') eid: string,
    @Query('packagePurchaseId') ppId: string,
    @Query() query: Record<string, string>,
  ) {
    return this.customerService.getExpertAvailability(req.user?.sub, toId(eid), toId(ppId), query);
  }

  // ── Bookings (06) ──
  @Post('bookings')
  createBooking(
    @Req() req: AuthedRequest,
    @Body() body: Record<string, unknown>,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    return this.customerService.createBooking(req.user?.sub, body, idempotencyKey);
  }

  @Get('bookings')
  listBookings(@Req() req: AuthedRequest, @Query() query: Record<string, string>) {
    return this.customerService.listBookings(req.user?.sub, query);
  }

  @Get('bookings/:id')
  bookingDetail(@Req() req: AuthedRequest, @Param('id') bid: string) {
    return this.customerService.getBookingDetail(req.user?.sub, toId(bid));
  }

  @Patch('bookings/:id/reschedule')
  rescheduleBooking(@Req() req: AuthedRequest, @Param('id') bid: string, @Body() body: Record<string, unknown>) {
    return this.customerService.rescheduleBooking(req.user?.sub, toId(bid), body);
  }

  @Patch('bookings/:id/cancel')
  cancelBooking(@Req() req: AuthedRequest, @Param('id') bid: string, @Body() body: Record<string, unknown>) {
    return this.customerService.cancelBooking(req.user?.sub, toId(bid), body);
  }

  @Post('bookings/:id/check-in')
  checkInBooking(@Req() req: AuthedRequest, @Param('id') bid: string) {
    return this.customerService.checkInBooking(req.user?.sub, toId(bid));
  }

  // ── Payments ──
  @Post('payments/package')
  createPackagePayment(@Req() req: AuthedRequest, @Body() body: Record<string, unknown>) {
    return this.customerService.createPackagePayment(req.user?.sub, body);
  }

  @Post('payments/booking')
  createBookingPayment(@Req() req: AuthedRequest, @Body() body: Record<string, unknown>) {
    return this.customerService.createBookingPayment(req.user?.sub, body);
  }

  @Get('payments')
  payments(@Req() req: AuthedRequest, @Query() query: Record<string, string>) {
    return this.customerService.listPayments(req.user?.sub, query);
  }

  @Get('payments/:id')
  payment(@Req() req: AuthedRequest, @Param('id') pid: string) {
    return this.customerService.getPayment(req.user?.sub, toId(pid));
  }

  // ── Notifications ──
  @Get('notifications/summary')
  notificationSummary(@Req() req: AuthedRequest) {
    return this.customerService.getNotificationSummary(req.user?.sub);
  }

  @Get('notifications')
  notifications(@Req() req: AuthedRequest, @Query() query: Record<string, string>) {
    return this.customerService.listNotifications(req.user?.sub, query);
  }

  @Patch('notifications/:id/read')
  markNotificationRead(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.customerService.markNotificationRead(req.user?.sub, toId(id));
  }

  @Patch('notifications/read-all')
  markAllNotificationsRead(@Req() req: AuthedRequest) {
    return this.customerService.markAllNotificationsRead(req.user?.sub);
  }

  // ── Reviews (07) ──
  @Post('reviews')
  createReview(@Req() req: AuthedRequest, @Body() body: Record<string, unknown>) {
    return this.customerService.createReview(req.user?.sub, body);
  }

  @Get('reviews')
  listReviews(@Req() req: AuthedRequest, @Query() query: Record<string, string>) {
    return this.customerService.listReviews(req.user?.sub, query);
  }

  @Patch('reviews/:id')
  updateReview(@Req() req: AuthedRequest, @Param('id') rid: string, @Body() body: Record<string, unknown>) {
    return this.customerService.updateReview(req.user?.sub, toId(rid), body);
  }

  @Delete('reviews/:id')
  deleteReview(@Req() req: AuthedRequest, @Param('id') rid: string) {
    return this.customerService.deleteReview(req.user?.sub, toId(rid));
  }

  // ── Complaints (08) ──
  @Post('complaints')
  createComplaint(@Req() req: AuthedRequest, @Body() body: Record<string, unknown>) {
    return this.customerService.createComplaint(req.user?.sub, body);
  }

  @Get('complaints')
  listComplaints(@Req() req: AuthedRequest, @Query() query: Record<string, string>) {
    return this.customerService.listComplaints(req.user?.sub, query);
  }

  @Get('complaints/:id')
  getComplaint(@Req() req: AuthedRequest, @Param('id') cid: string) {
    return this.customerService.getComplaint(req.user?.sub, toId(cid));
  }

  @Post('complaints/:id/messages')
  addComplaintMessage(@Req() req: AuthedRequest, @Param('id') cid: string, @Body() body: Record<string, unknown>) {
    return this.customerService.addComplaintMessage(req.user?.sub, toId(cid), body);
  }

  // ── 09: AI Chat ──
  @Get('ai-chat/sessions')
  listAiSessions(@Req() req: AuthedRequest, @Query() query: Record<string, string>) {
    return this.customerService.listAiChatSessions(req.user?.sub, query);
  }

  @Post('ai-chat/sessions')
  createAiSession(@Req() req: AuthedRequest, @Body() body: Record<string, unknown>) {
    return this.customerService.createAiChatSession(req.user?.sub, body);
  }

  @Get('ai-chat/sessions/:id/messages')
  listAiMessages(@Req() req: AuthedRequest, @Param('id') sid: string) {
    return this.customerService.getAiChatMessages(req.user?.sub, toId(sid));
  }

  @Post('ai-chat/sessions/:id/messages')
  sendAiMessage(@Req() req: AuthedRequest, @Param('id') sid: string, @Body() body: Record<string, unknown>) {
    return this.customerService.sendAiChatMessage(req.user?.sub, toId(sid), body);
  }

  @Patch('ai-chat/sessions/:id/archive')
  archiveAiSession(@Req() req: AuthedRequest, @Param('id') sid: string) {
    return this.customerService.archiveAiChatSession(req.user?.sub, toId(sid));
  }

  // ── Chats ──
  @Get('chats')
  chats(@Req() req: AuthedRequest, @Query() query: Record<string, string>) {
    return this.customerService.listChats(req.user?.sub, query);
  }

  @Get('chats/:bookingId/messages')
  messages(@Req() req: AuthedRequest, @Param('bookingId') bookingId: string) {
    return this.customerService.getMessages(req.user?.sub, toId(bookingId));
  }

  @Post('chats/:bookingId/messages')
  sendMessage(
    @Req() req: AuthedRequest,
    @Param('bookingId') bookingId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.customerService.sendMessage(req.user?.sub, toId(bookingId), body);
  }

  @Patch('chats/:bookingId/read')
  readChat(@Req() req: AuthedRequest, @Param('bookingId') bookingId: string) {
    return this.customerService.markChatRead(req.user?.sub, toId(bookingId));
  }

  @Get('bookings/:id/call-session')
  getCallSession(@Req() req: AuthedRequest, @Param('id') bookingId: string) {
    return this.customerService.getCallSession(req.user?.sub, toId(bookingId));
  }

  @Post('bookings/:id/call-token')
  createCallToken(@Req() req: AuthedRequest, @Param('id') bookingId: string) {
    return this.customerService.createCallToken(req.user?.sub, toId(bookingId));
  }

  // ── 10: Health Profile ──
  @Get('health-profile')
  getHealthProfile(@Req() req: AuthedRequest) {
    return this.customerService.getHealthProfile(req.user?.sub);
  }

  @Post('health-profile')
  upsertHealthProfile(@Req() req: AuthedRequest, @Body() body: Record<string, unknown>) {
    return this.customerService.upsertHealthProfile(req.user?.sub, body);
  }

  // ── 11: Health Metrics ──
  @Get('health-metrics')
  listHealthMetrics(@Req() req: AuthedRequest, @Query() query: Record<string, string>) {
    return this.customerService.listHealthMetrics(req.user?.sub, query);
  }

  @Get('health-metrics/latest')
  getLatestMetric(@Req() req: AuthedRequest) {
    return this.customerService.getLatestMetric(req.user?.sub);
  }

  @Get('health-metrics/summary')
  getHealthSummary(@Req() req: AuthedRequest) {
    return this.customerService.getHealthSummary(req.user?.sub);
  }

  @Post('health-metrics')
  createHealthMetric(@Req() req: AuthedRequest, @Body() body: Record<string, unknown>) {
    return this.customerService.createHealthMetric(req.user?.sub, body);
  }

  @Patch('health-metrics/:id')
  updateHealthMetric(@Req() req: AuthedRequest, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.customerService.updateHealthMetric(req.user?.sub, toId(id), body);
  }

  @Delete('health-metrics/:id')
  deleteHealthMetric(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.customerService.deleteHealthMetric(req.user?.sub, toId(id));
  }

  // ── 12: Health Recommendations ──
  @Get('health-recommendations')
  listHealthRecs(@Req() req: AuthedRequest) {
    return this.customerService.listHealthRecommendations(req.user?.sub);
  }

  @Get('health-recommendations/latest')
  getLatestHealthRec(@Req() req: AuthedRequest) {
    return this.customerService.getLatestHealthRecommendation(req.user?.sub);
  }

  @Post('health-recommendations/generate')
  generateHealthRec(@Req() req: AuthedRequest) {
    return this.customerService.generateHealthRecommendation(req.user?.sub);
  }

  @Patch('health-recommendations/:id/apply')
  applyHealthRec(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.customerService.applyHealthRecommendation(req.user?.sub, toId(id));
  }

  @Patch('health-recommendations/:id/archive')
  archiveHealthRec(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.customerService.archiveHealthRecommendation(req.user?.sub, toId(id));
  }

  // ── 13: Wellness Recommendations ──
  @Get('wellness-recommendations')
  listWellnessRecs(@Req() req: AuthedRequest) {
    return this.customerService.listWellnessRecommendations(req.user?.sub);
  }

  @Get('wellness-recommendations/latest')
  getLatestWellnessRec(@Req() req: AuthedRequest) {
    return this.customerService.getLatestWellnessRecommendation(req.user?.sub);
  }

  @Post('wellness-recommendations/generate')
  generateWellnessRec(@Req() req: AuthedRequest) {
    return this.customerService.generateWellnessRecommendation(req.user?.sub);
  }

  @Post('wellness-recommendations/:id/apply')
  applyWellnessRec(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.customerService.applyWellnessRecommendation(req.user?.sub, toId(id));
  }

  @Post('wellness-recommendations/:id/ask-expert')
  askExpertRec(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.customerService.askExpertAboutRecommendation(req.user?.sub, toId(id));
  }
}

@Controller('payments')
export class PaymentCallbackController {
  constructor(private readonly customerService: CustomerService) {}

  @Public()
  @Get('callback')
  callback(@Query() query: Record<string, string>) {
    return this.customerService.processPaymentWebhook('return', query);
  }

  @Public()
  @Post('ipn')
  ipn(@Body() body: Record<string, string>) {
    return this.customerService.processPaymentWebhook('ipn', body);
  }

  @Public()
  @Get('callback/package')
  callbackPackage(@Query() query: Record<string, string>) {
    return this.customerService.processPaymentWebhook('return', query);
  }

  @Public()
  @Post('ipn/package')
  ipnPackage(@Body() body: Record<string, string>) {
    return this.customerService.processPaymentWebhook('ipn', body);
  }
}
