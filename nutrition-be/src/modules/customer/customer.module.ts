import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { CustomerController, PaymentCallbackController } from './customer.controller';
import { CustomerService } from './customer.service';

@Module({
  imports: [ChatModule],
  controllers: [CustomerController, PaymentCallbackController],
  providers: [CustomerService],
})
export class CustomerModule {}
