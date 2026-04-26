import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../constants/auth.constants';

export type UserRole = 'customer' | 'expert' | 'admin';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
