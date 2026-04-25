import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { existsSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { FileFilterCallback } from 'multer';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UpdateUserProfileDto } from './dto/update-profile.dto';
import { UserProfileService } from './profile.service';

function ensureProfileUploadDir() {
  const uploadDir = join(process.cwd(), 'uploads', 'avatars');
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
}

function makeAvatarFileName(originalName: string) {
  const ext = extname(originalName).toLowerCase();
  const base = originalName
    .replace(ext, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `${base || 'avatar'}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}${ext || '.jpg'}`;
}

const avatarUploadInterceptor = FileInterceptor('file', {
  storage: diskStorage({
    destination: (
      _req: Request,
      _file: Express.Multer.File,
      cb: (error: Error | null, destination: string) => void,
    ) => cb(null, ensureProfileUploadDir()),
    filename: (
      _req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void,
    ) => cb(null, makeAvatarFileName(file.originalname)),
  }),
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
    const allowed = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/jpg',
    ]);
    if (!allowed.has(file.mimetype)) {
      cb(
        new BadRequestException(
          'Chi chap nhan file anh JPEG/PNG/WebP/GIF',
        ) as any,
        false,
      );
      return;
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

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

  @Post('upload-avatar')
  @HttpCode(200)
  @UseInterceptors(avatarUploadInterceptor)
  uploadAvatar(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui long chon 1 anh de tai len');
    }

    return {
      success: true,
      message: 'Tai anh dai dien thanh cong',
      data: {
        file_name: file.filename,
        original_name: file.originalname,
        size: file.size,
        mime_type: file.mimetype,
        url: `/api/uploads/avatars/${file.filename}`,
      },
    };
  }
}
