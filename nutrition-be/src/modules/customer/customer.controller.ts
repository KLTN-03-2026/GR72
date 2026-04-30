import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { CustomerService } from './customer.service';

type AuthedRequest = Request & { user?: { sub?: number } };
const id = (value: string) => Number(value);

@Controller('customer')
@Roles('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get('chats')
  chats(@Req() request: AuthedRequest, @Query() query: Record<string, string>) {
    return this.customerService.listChats(request.user?.sub, query);
  }

  @Get('chats/:bookingId/messages')
  messages(@Req() request: AuthedRequest, @Param('bookingId') bookingId: string) {
    return this.customerService.getMessages(request.user?.sub, id(bookingId));
  }

  @Post('chats/:bookingId/messages')
  sendMessage(
    @Req() request: AuthedRequest,
    @Param('bookingId') bookingId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.customerService.sendMessage(request.user?.sub, id(bookingId), body);
  }

  @Patch('chats/:bookingId/read')
  readChat(@Req() request: AuthedRequest, @Param('bookingId') bookingId: string) {
    return this.customerService.markChatRead(request.user?.sub, id(bookingId));
  }
}
