import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

import { ROLES_KEY } from '@/shared/api/guards/roles.guard';
import { AuthPrincipal } from '@/shared/domain/auth-principal';
import { TenantContext } from '@/shared/domain/tenant-context';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const Tenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TenantContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant;
  },
);

export const CurrentAuthUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthPrincipal => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
