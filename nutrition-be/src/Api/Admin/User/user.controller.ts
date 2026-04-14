import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ResetPasswordDto, UpdateUserDto } from './dto/update-user.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserService } from './user.service';

@Roles('quan_tri')
@Controller('admin/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() body: CreateUserDto) {
    return this.userService.create(body);
  }

  @Get()
  findAll(@Query() query: UsersQueryDto) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateUserDto) {
    return this.userService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateStatusDto,
  ) {
    return this.userService.updateStatus(id, body);
  }

  @Patch(':id/reset-password')
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ResetPasswordDto,
  ) {
    return this.userService.resetPassword(id, body);
  }
}
