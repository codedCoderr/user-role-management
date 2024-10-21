import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No user found');
    }
    if (!user.roles || !Array.isArray(user.roles)) {
      throw new ForbiddenException('User has no roles');
    }

    const hasRole = user.roles.some((role: Role) => {
      return requiredRoles.includes(role);
    });

    if (!hasRole) {
      throw new ForbiddenException('User does not have the required role');
    }

    return true;
  }
}
