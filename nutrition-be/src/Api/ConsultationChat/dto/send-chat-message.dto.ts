import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';
import type { ChatAttachment, ChatMessageType } from '../entities/tin-nhan.entity';

export class SendChatMessageDto {
  @IsOptional()
  @IsIn(['text', 'file'])
  loai?: ChatMessageType;

  @IsOptional()
  @IsString()
  noiDung?: string;

  @IsOptional()
  @Transform(({ value }) => value ?? null)
  tepDinhKem?: ChatAttachment | null;
}
