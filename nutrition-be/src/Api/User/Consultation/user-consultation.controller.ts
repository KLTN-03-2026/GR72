import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserBookingQueryDto } from './dto/booking-query.dto';
import {
  ConsultationPaymentQueryDto,
  CreateConsultationPaymentDto,
  PendingConsultationPaymentQueryDto,
} from './dto/consultation-payment.dto';
import {
  CancelUserBookingDto,
  CreateBookingDto,
} from './dto/create-booking.dto';
import {
  CreateReviewDto,
  UpdateReviewDto,
  UserReviewQueryDto,
} from './dto/review.dto';
import { UserConsultationService } from './user-consultation.service';

@Controller('me')
@Roles('nguoi_dung')
export class UserConsultationController {
  constructor(private readonly consultationService: UserConsultationService) {}

  @Post('bookings')
  createBooking(
    @Req() request: Request & { user?: { sub?: number } },
    @Body() dto: CreateBookingDto,
  ) {
    return this.consultationService.createBooking(request.user?.sub, dto);
  }

  @Get('bookings')
  getBookings(
    @Req() request: Request & { user?: { sub?: number } },
    @Query() query: UserBookingQueryDto,
  ) {
    return this.consultationService.getUserBookings(request.user?.sub, query);
  }

  @Get('bookings/:id')
  getBooking(
    @Req() request: Request & { user?: { sub?: number } },
    @Param('id') id: string,
  ) {
    return this.consultationService.getUserBooking(
      request.user?.sub,
      Number(id),
    );
  }

  @Patch('bookings/:id/cancel')
  cancelBooking(
    @Req() request: Request & { user?: { sub?: number } },
    @Param('id') id: string,
    @Body() dto: CancelUserBookingDto,
  ) {
    return this.consultationService.cancelUserBooking(
      request.user?.sub,
      Number(id),
      dto,
    );
  }

  @Patch('bookings/:id/refund-check')
  checkRefundStatus(
    @Req() request: Request & { user?: { sub?: number } },
    @Param('id') id: string,
  ) {
    return this.consultationService.fakeRefundSuccess(
      request.user?.sub,
      Number(id),
    );
  }

  @Post('consultation-payments')
  createPayment(
    @Req() request: Request & { user?: { sub?: number } },
    @Body() dto: CreateConsultationPaymentDto,
  ) {
    return this.consultationService.createConsultationPayment(
      request.user?.sub,
      dto.bookingId,
    );
  }

  @Get('consultation-payments')
  getPayments(
    @Req() request: Request & { user?: { sub?: number } },
    @Query() query: ConsultationPaymentQueryDto,
  ) {
    return this.consultationService.getConsultationPayments(
      request.user?.sub,
      query,
    );
  }

  @Get('consultation-payments/pending')
  getPendingPayment(
    @Req() request: Request & { user?: { sub?: number } },
    @Query() query: PendingConsultationPaymentQueryDto,
  ) {
    return this.consultationService.getPendingConsultationPayment(
      request.user?.sub,
      query.booking_id,
    );
  }

  @Post('reviews')
  createReview(
    @Req() request: Request & { user?: { sub?: number } },
    @Body() dto: CreateReviewDto,
  ) {
    return this.consultationService.createUserReview(request.user?.sub, dto);
  }

  @Get('reviews')
  getReviews(
    @Req() request: Request & { user?: { sub?: number } },
    @Query() query: UserReviewQueryDto,
  ) {
    return this.consultationService.getUserReviews(request.user?.sub, query);
  }

  @Patch('reviews/:id')
  updateReview(
    @Req() request: Request & { user?: { sub?: number } },
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.consultationService.updateUserReview(
      request.user?.sub,
      Number(id),
      dto,
    );
  }
}
