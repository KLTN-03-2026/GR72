import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../constants/auth.constants';
import type { UserRole } from '../../Api/User/user.types';

type AuthenticatedRequest = Request & {
  user?: {
    sub: number;
    email: string;
    vai_tro: UserRole;
  };
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userRole = request.user?.vai_tro;

    if (!userRole || !requiredRoles.includes(userRole)) {
      throw new ForbiddenException('Ban khong co quyen truy cap endpoint nay');
    }

    return true;
  }
}
