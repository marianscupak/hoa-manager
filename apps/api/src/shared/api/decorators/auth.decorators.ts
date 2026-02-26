import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

import { AuthPrincipal } from '../../domain/auth-principal';
import { TenantContext } from '../../domain/tenant-context';
import { ROLES_KEY } from '../guards/roles.guard';

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
