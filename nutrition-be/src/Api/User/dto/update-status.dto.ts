import { IsIn, IsString } from 'class-validator';
import { USER_STATUSES } from '../user.types';

export class UpdateStatusDto {
  @IsString()
  @IsIn(USER_STATUSES)
  trangThai!: string;
}
