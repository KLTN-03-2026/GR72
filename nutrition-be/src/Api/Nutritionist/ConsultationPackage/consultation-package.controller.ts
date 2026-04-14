import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { NutritionistConsultationPackageService } from './consultation-package.service';
import { CreatePackageDto, UpdatePackageDto } from './dto/package.dto';

@UseGuards(JwtAuthGuard)
@Roles('chuyen_gia_dinh_duong')
@Controller('nutritionist/consultation-packages')
export class NutritionistConsultationPackageController {
  constructor(private readonly packageService: NutritionistConsultationPackageService) {}

  @Get()
  async findAll(@Req() req: any, @Query('page') page = '1', @Query('limit') limit = '10') {
    return this.packageService.findAll(req.user?.sub, Number(page), Number(limit));
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.packageService.findOne(req.user?.sub, Number(id));
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreatePackageDto) {
    return this.packageService.create(req.user?.sub, dto);
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.packageService.update(req.user?.sub, Number(id), dto);
  }

  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.packageService.delete(req.user?.sub, Number(id));
  }
}
