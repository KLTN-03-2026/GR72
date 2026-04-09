import { IsIn, IsString } from 'class-validator';
import { USER_ROLES } from '../user.types';

export class UpdateRoleDto {
  @IsString()
  @IsIn(USER_ROLES)
  vaiTro!: string;
}
