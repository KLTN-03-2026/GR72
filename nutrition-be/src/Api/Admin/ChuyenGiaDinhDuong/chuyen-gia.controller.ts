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
import { ChuyenGiaService } from './chuyen-gia.service';

@Roles('quan_tri')
@Controller('admin')
export class ChuyenGiaController {
  constructor(private readonly service: ChuyenGiaService) {}

  // =============================================
  // MODULE 1: Duyệt đơn đăng ký Nutritionist
  // =============================================
  @Get('nutritionist-registrations')
  findRegistrations(
    @Query('trang_thai') trang_thai?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findRegistrations({
      trang_thai,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('nutritionist-registrations/:id')
  getRegistrationDetail(@Param('id', ParseIntPipe) id: number) {
    return this.service.getRegistrationDetail(id);
  }

  @Patch('nutritionist-registrations/:id/approve')
  approveRegistration(@Param('id', ParseIntPipe) id: number) {
    return this.service.approveRegistration(id, 0);
  }

  @Patch('nutritionist-registrations/:id/reject')
  rejectRegistration(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { ly_do_tu_choi: string },
  ) {
    return this.service.rejectRegistration(id, body);
  }

  // =============================================
  // MODULE 2: Quản lý trạng thái Nutritionist
  // =============================================
  @Get('nutritionists')
  findNutritionists(
    @Query('trang_thai') trang_thai?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findNutritionists({
      trang_thai,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('nutritionists/:id')
  getNutritionistDetail(@Param('id', ParseIntPipe) id: number) {
    return this.service.getNutritionistDetail(id);
  }

  @Patch('nutritionists/:id/ban')
  banNutritionist(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { ly_do_bi_khoa: string },
  ) {
    return this.service.banNutritionist(id, body);
  }

  @Patch('nutritionists/:id/activate')
  activateNutritionist(@Param('id', ParseIntPipe) id: number) {
    return this.service.activateNutritionist(id);
  }
}
