import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ForbiddenException } from '@/shared/application/exceptions/auth.exceptions';
import { TenantMembershipRole } from '@/shared/domain/membership';
import { TenantContext } from '@/shared/domain/tenant-context';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      TenantMembershipRole[]
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenant: TenantContext | undefined = request['tenant'];

    if (!tenant) {
      throw new ForbiddenException();
    }

    const hasRole = tenant.roles.some((role) => requiredRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException();
    }

    return true;
  }
}
