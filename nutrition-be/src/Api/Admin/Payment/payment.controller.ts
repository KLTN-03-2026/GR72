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
import { PaymentQueryDto } from './dto/payment.dto';
import { PaymentService } from './payment.service';

@Roles('quan_tri')
@Controller('admin/payments')
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Get()
  findAll(@Query() query: PaymentQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id/confirm')
  confirm(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const adminId = req.user?.id ?? 0;
    return this.service.confirm(id, adminId);
  }
}
