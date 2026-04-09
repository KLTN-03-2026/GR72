import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../constants/auth.constants';
import type { UserRole } from '../../Api/User/user.types';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
