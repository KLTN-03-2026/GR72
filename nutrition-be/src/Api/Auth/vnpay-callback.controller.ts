import { Controller, Get, Post, Query, Res } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { VnpayCallbackService } from './vnpay-callback.service';
import type { Response } from 'express';
import { UserConsultationService } from '../User/Consultation/user-consultation.service';

@Controller('api/vnpay/callback')
export class VnpayCallbackController {
  constructor(
    private readonly vnpayCallbackService: VnpayCallbackService,
    private readonly userConsultationService: UserConsultationService,
  ) {}

  @Public()
  @Get()
  async handleVnpayReturn(
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ) {
    if (this.isConsultationTxnRef(query['vnp_TxnRef'])) {
      const result =
        await this.userConsultationService.handleConsultationPaymentReturn(
          query,
        );
      const baseUrl = process.env.CLIENT_URL ?? 'http://localhost:3000';
      const targetBookingPath = result.bookingId
        ? `/nutrition/bookings/${result.bookingId}`
        : '/nutrition/bookings';
      const status = result.success ? 'success' : 'failed';
      const message = encodeURIComponent(result.message ?? '');
      return res.redirect(
        `${baseUrl}${targetBookingPath}?payment_status=${status}&message=${message}`,
      );
    }

    const result = await this.vnpayCallbackService.handleVnpayReturn(query);
    const baseUrl = process.env.CLIENT_URL ?? 'http://localhost:3000';
    const paymentReturnPath = '/payment-return';

    if (result.success) {
      return res.redirect(`${baseUrl}${paymentReturnPath}?status=success`);
    }
    return res.redirect(
      `${baseUrl}${paymentReturnPath}?status=failed&message=${encodeURIComponent(result.message ?? '')}`,
    );
  }

  @Public()
  @Post('ipn')
  async handleVnpayIpn(@Query() query: Record<string, string>) {
    if (this.isConsultationTxnRef(query['vnp_TxnRef'])) {
      return this.userConsultationService.handleConsultationPaymentIpn(query);
    }
    return this.vnpayCallbackService.handleVnpayIpn(query);
  }

  private isConsultationTxnRef(txnRef?: string) {
    return typeof txnRef === 'string' && txnRef.startsWith('BOOKING_');
  }
}
