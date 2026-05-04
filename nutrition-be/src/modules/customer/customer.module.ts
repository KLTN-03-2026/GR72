import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { ApiVnpayCallbackAliasController, CustomerController, PaymentCallbackController, VnpayCallbackAliasController } from './customer.controller';
import { CustomerService } from './customer.service';

@Module({
  imports: [ChatModule],
  controllers: [CustomerController, PaymentCallbackController, VnpayCallbackAliasController, ApiVnpayCallbackAliasController],
  providers: [CustomerService],
})
export class CustomerModule {}
