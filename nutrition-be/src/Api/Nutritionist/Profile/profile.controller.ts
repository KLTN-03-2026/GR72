import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { NutritionistProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/profile.dto';

@UseGuards(JwtAuthGuard)
@Roles('chuyen_gia_dinh_duong')
@Controller('nutritionist/profile')
export class NutritionistProfileController {
  constructor(private readonly profileService: NutritionistProfileService) {}

  @Get()
  async getProfile(@Req() req: any) {
    return this.profileService.getProfile(req.user?.sub);
  }

  @Patch()
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user?.sub, dto);
  }

  @Get('reviews')
  async getReviews(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.profileService.getReviews(req.user?.sub, {
      page: Number(page),
      limit: Number(limit),
    });
  }
}
