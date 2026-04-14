import { Controller, Get, Post, Query, Res } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { VnpayCallbackService } from './vnpay-callback.service';
import type { Response } from 'express';

@Controller('api/vnpay/callback')
export class VnpayCallbackController {
  constructor(private readonly vnpayCallbackService: VnpayCallbackService) {}

  @Public()
  @Get()
  async handleVnpayReturn(@Query() query: Record<string, string>, @Res() res: Response) {
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
    return this.vnpayCallbackService.handleVnpayIpn(query);
  }
}
