import { Body, Controller, Get, Param, Patch, Post, Delete, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminService } from './admin.service';

type AuthedRequest = Request & { user?: { sub?: number } };

function id(value: string) {
  return Number(value);
}

@Controller('admin')
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  overview() {
    return this.adminService.getOverview();
  }

  @Get('users')
  listUsers(@Query() query: Record<string, string>) {
    return this.adminService.listUsers(query);
  }

  @Get('users/:id')
  getUser(@Param('id') userId: string) {
    return this.adminService.getUser(id(userId));
  }

  @Patch('users/:id/status')
  updateUserStatus(@Param('id') userId: string, @Body() body: Record<string, unknown>, @Req() request: AuthedRequest) {
    return this.adminService.updateUserStatus(id(userId), body, request.user?.sub);
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') userId: string, @Body() body: Record<string, unknown>, @Req() request: AuthedRequest) {
    return this.adminService.updateUserRole(id(userId), body, request.user?.sub);
  }

  @Get('experts')
  listExperts(@Query() query: Record<string, string>) {
    return this.adminService.listExperts(query);
  }

  @Get('notifications')
  listNotifications(@Query() query: Record<string, string>) {
    return this.adminService.listNotifications(query);
  }

  @Get('notifications/summary')
  notificationSummary(@Req() request: AuthedRequest) {
    return this.adminService.getNotificationSummary(request.user?.sub);
  }

  @Post('notifications')
  createNotification(@Body() body: Record<string, unknown>, @Req() request: AuthedRequest) {
    return this.adminService.createNotification(body, request.user?.sub);
  }

  @Patch('notifications/:id/read')
  markNotificationRead(@Param('id') notificationId: string, @Req() request: AuthedRequest) {
    return this.adminService.markNotificationRead(id(notificationId), request.user?.sub);
  }

  @Get('experts/:id')
  getExpert(@Param('id') expertId: string) {
    return this.adminService.getExpert(id(expertId));
  }

  @Patch('experts/:id/profile')
  updateExpertProfile(@Param('id') expertId: string, @Body() body: Record<string, unknown>, @Req() request: AuthedRequest) {
    return this.adminService.updateExpertProfile(id(expertId), body, request.user?.sub);
  }

  @Patch('experts/:id/status')
  updateExpertStatus(@Param('id') expertId: string, @Body() body: Record<string, unknown>, @Req() request: AuthedRequest) {
    return this.adminService.updateExpertStatus(id(expertId), body, request.user?.sub);
  }

  @Patch('experts/:id/booking')
  updateExpertBooking(@Param('id') expertId: string, @Body() body: Record<string, unknown>, @Req() request: AuthedRequest) {
    return this.adminService.updateExpertBooking(id(expertId), body, request.user?.sub);
  }

  @Patch('experts/:id/commission')
  updateExpertCommission(@Param('id') expertId: string, @Body() body: Record<string, unknown>, @Req() request: AuthedRequest) {
    return this.adminService.updateExpertCommission(id(expertId), body, request.user?.sub);
  }

  @Get('service-packages')
  listPackages(@Query() query: Record<string, string>) {
    return this.adminService.listPackages(query);
  }

  @Post('service-packages')
  createPackage(@Body() body: Record<string, unknown>, @Req() request: AuthedRequest) {
    return this.adminService.createPackage(body, request.user?.sub);
  }

  @Get('service-packages/:id')
  getPackage(@Param('id') packageId: string) {
    return this.adminService.getPackage(id(packageId));
  }

  @Patch('service-packages/:id')
  updatePackage(@Param('id') packageId: string, @Body() body: Record<string, unknown>, @Req() request: AuthedRequest) {
    return this.adminService.updatePackage(id(packageId), body, request.user?.sub);
  }

  @Patch('service-packages/:id/status')
  updatePackageStatus(@Param('id') packageId: string, @Body() body: Record<string, string>, @Req() request: AuthedRequest) {
    return this.adminService.updatePackageStatus(id(packageId), body.trang_thai ?? body.status, request.user?.sub);
  }

  @Get('service-packages/:id/experts')
  listPackageExperts(@Param('id') packageId: string) {
    return this.adminService.listPackageExperts(id(packageId));
  }

  @Post('service-packages/:id/experts')
  assignExpert(@Param('id') packageId: string, @Body() body: Record<string, unknown>, @Req() request: AuthedRequest) {
    return this.adminService.assignExpert(id(packageId), body, request.user?.sub);
  }

  @Patch('service-packages/:id/experts/:expertId')
  updatePackageExpert(@Param('id') packageId: string, @Param('expertId') expertId: string, @Body() body: Record<string, unknown>, @Req() request: AuthedRequest) {
    return this.adminService.updatePackageExpert(id(packageId), id(expertId), body, request.user?.sub);
  }

  @Delete('service-packages/:id/experts/:expertId')
  removePackageExpert(@Param('id') packageId: string, @Param('expertId') expertId: string, @Req() request: AuthedRequest) {
    return this.adminService.removePackageExpert(id(packageId), id(expertId), request.user?.sub);
  }

  @Get('payments')
  listPayments(@Query() query: Record<string, string>) {
    return this.adminService.listPayments(query);
  }

  @Get('payments/:id')
  getPayment(@Param('id') paymentId: string) {
    return this.adminService.getPayment(id(paymentId));
  }

  @Get('payments/:id/webhook-logs')
  getPaymentWebhookLogs(@Param('id') paymentId: string) {
    return this.adminService.getPaymentWebhookLogs(id(paymentId));
  }

  @Post('payments/:id/refund')
  refundPayment(@Param('id') paymentId: string, @Body() body: Record<string, unknown>, @Req() request: AuthedRequest) {
    return this.adminService.refundPayment(id(paymentId), body, request.user?.sub);
  }

  @Patch('payments/:id/reconcile')
  reconcilePayment(@Param('id') paymentId: string, @Req() request: AuthedRequest) {
    return this.adminService.reconcilePayment(id(paymentId), request.user?.sub);
  }

  @Get('reviews')
  listReviews(@Query() query: Record<string, string>) {
    return this.adminService.listReviews(query);
  }

  @Get('reviews/:id')
  getReview(@Param('id') reviewId: string) {
    return this.adminService.getReview(id(reviewId));
  }

  @Patch('reviews/:id/status')
  updateReviewStatus(@Param('id') reviewId: string, @Body() body: Record<string, unknown>, @Req() request: AuthedRequest) {
    return this.adminService.updateReviewStatus(id(reviewId), body, request.user?.sub);
  }

  @Post('reviews/:id/moderation-note')
  addReviewModerationNote(@Param('id') reviewId: string, @Body() body: Record<string, unknown>, @Req() request: AuthedRequest) {
    return this.adminService.addReviewModerationNote(id(reviewId), body, request.user?.sub);
  }

  @Get('revenue/summary')
  revenueSummary(@Query() query: Record<string, string>) {
    return this.adminService.getRevenueSummary(query);
  }

  @Get('revenue/by-package')
  revenueByPackage(@Query() query: Record<string, string>) {
    return this.adminService.getRevenueByPackage(query);
  }

  @Get('revenue/by-expert')
  revenueByExpert(@Query() query: Record<string, string>) {
    return this.adminService.getRevenueByExpert(query);
  }

  @Get('revenue/timeseries')
  revenueTimeseries(@Query() query: Record<string, string>) {
    return this.adminService.getRevenueTimeseries(query);
  }

  @Get('revenue/export')
  revenueExport(@Query() query: Record<string, string>, @Req() request: AuthedRequest) {
    return this.adminService.exportRevenue(query, request.user?.sub);
  }

  @Get('commission-periods')
  listCommissionPeriods(@Query() query: Record<string, string>) {
    return this.adminService.listCommissionPeriods(query);
  }

  @Post('commission-periods')
  createCommissionPeriod(@Body() body: Record<string, unknown>, @Req() request: AuthedRequest) {
    return this.adminService.createCommissionPeriod(body, request.user?.sub);
  }

  @Get('commission-periods/:id')
  getCommissionPeriod(@Param('id') periodId: string) {
    return this.adminService.getCommissionPeriod(id(periodId));
  }

  @Post('commission-periods/:id/recalculate')
  recalculateCommissionPeriod(@Param('id') periodId: string, @Req() request: AuthedRequest) {
    return this.adminService.recalculateCommissionPeriod(id(periodId), request.user?.sub);
  }

  @Post('commission-periods/:id/finalize')
  finalizeCommissionPeriod(@Param('id') periodId: string, @Req() request: AuthedRequest) {
    return this.adminService.finalizeCommissionPeriod(id(periodId), request.user?.sub);
  }

  @Post('commission-periods/:id/payout')
  payoutCommissionPeriod(@Param('id') periodId: string, @Req() request: AuthedRequest) {
    return this.adminService.payoutCommissionPeriod(id(periodId), request.user?.sub);
  }

  @Get('complaints')
  listComplaints(@Query() query: Record<string, string>) {
    return this.adminService.listComplaints(query);
  }

  @Get('complaints/:id')
  getComplaint(@Param('id') complaintId: string) {
    return this.adminService.getComplaint(id(complaintId));
  }

  @Patch('complaints/:id/assign')
  assignComplaint(@Param('id') complaintId: string, @Body() body: Record<string, unknown>, @Req() request: AuthedRequest) {
    return this.adminService.assignComplaint(id(complaintId), body, request.user?.sub);
  }

  @Post('complaints/:id/messages')
  addComplaintMessage(@Param('id') complaintId: string, @Body() body: Record<string, unknown>, @Req() request: AuthedRequest) {
    return this.adminService.addComplaintMessage(id(complaintId), body, request.user?.sub);
  }

  @Patch('complaints/:id/resolve')
  resolveComplaint(@Param('id') complaintId: string, @Body() body: Record<string, unknown>, @Req() request: AuthedRequest) {
    return this.adminService.resolveComplaint(id(complaintId), body, request.user?.sub);
  }
}
