import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  CreatePackageFeatureDto,
  UpdatePackageFeatureDto,
} from './dto/package-feature.dto';
import { PackageFeatureService } from './package-feature.service';

@Roles('quan_tri')
@Controller()
export class PackageFeatureController {
  constructor(private readonly service: PackageFeatureService) {}

  @Get('admin/packages/:packageId/features')
  findAll(@Param('packageId', ParseIntPipe) packageId: number) {
    return this.service.findAllByPackage(packageId);
  }

  @Post('admin/packages/:packageId/features')
  create(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Body() body: CreatePackageFeatureDto,
  ) {
    return this.service.create(packageId, body);
  }

  @Patch('admin/package-features/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePackageFeatureDto,
  ) {
    return this.service.update(id, body);
  }

  @Delete('admin/package-features/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Get('admin/package-features/standard-codes')
  getStandardCodes() {
    return this.service.getStandardFeatureCodes();
  }
}
