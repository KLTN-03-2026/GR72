import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';

@Module({
  imports: [ChatModule],
  controllers: [CustomerController],
  providers: [CustomerService],
})
export class CustomerModule {}
