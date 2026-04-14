import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  CreateSubscriptionDto,
  SubscriptionQueryDto,
  UpdateSubscriptionDto,
} from './dto/subscription.dto';
import { SubscriptionService } from './subscription.service';

@Roles('quan_tri')
@Controller('admin/subscriptions')
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  @Get()
  findAll(@Query() query: SubscriptionQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() body: CreateSubscriptionDto) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateSubscriptionDto,
  ) {
    return this.service.update(id, body);
  }
}
