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
import { Roles } from '../../../common/decorators/roles.decorator';
import { CreatePackageDto, UpdatePackageDto } from './dto/package.dto';
import { PackageQueryDto } from './dto/package-query.dto';
import { PackageService } from './package.service';

@Roles('quan_tri')
@Controller('admin/packages')
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  @Post()
  create(@Body() body: CreatePackageDto) {
    return this.packageService.create(body);
  }

  @Get()
  findAll(@Query() query: PackageQueryDto) {
    return this.packageService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.packageService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePackageDto,
  ) {
    return this.packageService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.packageService.remove(id);
  }
}
