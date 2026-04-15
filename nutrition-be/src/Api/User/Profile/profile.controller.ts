import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UpdateUserProfileDto } from './dto/update-profile.dto';
import { UserProfileService } from './profile.service';

@Controller('me/profile')
@Roles('nguoi_dung')
export class UserProfileController {
  constructor(private readonly profileService: UserProfileService) {}

  @Get()
  getProfile(@Req() request: Request & { user?: { sub?: number } }) {
    return this.profileService.getProfile(request.user?.sub);
  }

  @Patch()
  updateProfile(
    @Req() request: Request & { user?: { sub?: number } },
    @Body() dto: UpdateUserProfileDto,
  ) {
    return this.profileService.updateProfile(request.user?.sub, dto);
  }
}
