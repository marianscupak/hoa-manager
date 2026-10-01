import type { ExecutionContext } from '@nestjs/common';
import type { ClsService } from 'nestjs-cls';

import { ACTOR_CLS_KEY } from '@/shared/application/actor-context';
import { UnauthorizedException } from '@/shared/application/exceptions/auth.exceptions';
import type {
  MembershipAccess,
  MembershipAccessLookup,
} from '@/shared/application/ports/membership-access.port';
import type { AuthClaims } from '@/shared/domain/auth-claims';
import {
  TenantMembershipRole,
  TenantMembershipStatus,
} from '@/shared/domain/membership';

import { TenantContextGuard } from './tenant-context.guard';

const USER_ID = 'user-1';
const TENANT_ID = 'tenant-1';
const MEMBERSHIP_ID = 'membership-1';
const CLAIMS: AuthClaims = { sub: USER_ID, tid: TENANT_ID, mid: MEMBERSHIP_ID };

function membership(status: TenantMembershipStatus): MembershipAccess {
  return {
    id: MEMBERSHIP_ID,
    tenantId: TENANT_ID,
    role: TenantMembershipRole.BOARD_MEMBER,
    status,
  };
}

function setup(
  options: {
    membership?: MembershipAccess | null;
    actor?: unknown;
  } = {},
) {
  const found =
    options.membership === undefined
      ? membership(TenantMembershipStatus.ACTIVE)
      : options.membership;
  const findMembership = jest.fn((_tenantId: string, _userId: string) =>
    Promise.resolve(found),
  );
  const memberships: MembershipAccessLookup = { findMembership };
  const lookups = () => findMembership.mock.calls;

  const store = new Map<string, unknown>();
  if (options.actor !== undefined) store.set(ACTOR_CLS_KEY, options.actor);
  const cls = {
    get: (key: string) => store.get(key),
    set: (key: string, value: unknown) => store.set(key, value),
  } as unknown as ClsService;

  const guard = new TenantContextGuard(memberships, cls);
  return { guard, store, lookups };
}

function contextFor(authClaims?: AuthClaims) {
  const request: Record<string, unknown> = {
    authClaims: authClaims ? { ...authClaims } : undefined,
  };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('TenantContextGuard', () => {
  it('rejects a request the access token guard has not authenticated', async () => {
    const { guard } = setup();
    const { context } = contextFor();

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it.each([
    ['tenant', { ...CLAIMS, tid: undefined }],
    ['membership', { ...CLAIMS, mid: undefined }],
  ])('rejects a token without a %s scope', async (_, claims) => {
    const { guard, lookups } = setup();
    const { context } = contextFor(claims);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(lookups()).toEqual([]);
  });

  it('rejects a user who is not a member of the tenant', async () => {
    const { guard } = setup({ membership: null });
    const { context } = contextFor(CLAIMS);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it.each([TenantMembershipStatus.SUSPENDED, TenantMembershipStatus.INVITED])(
    'rejects a %s membership',
    async (status) => {
      const { guard } = setup({ membership: membership(status) });
      const { context } = contextFor(CLAIMS);

      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    },
  );

  it('looks the membership up by the token tenant and user', async () => {
    const { guard, lookups } = setup();
    const { context } = contextFor(CLAIMS);

    await guard.canActivate(context);

    expect(lookups()).toEqual([[TENANT_ID, USER_ID]]);
  });

  it('attaches the tenant context and the current role', async () => {
    const { guard } = setup();
    const { context, request } = contextFor({
      ...CLAIMS,
      roles: [TenantMembershipRole.ADMIN],
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(request.tenant).toEqual({
      tenantId: TENANT_ID,
      membershipId: MEMBERSHIP_ID,
      roles: [TenantMembershipRole.BOARD_MEMBER],
      membershipStatus: TenantMembershipStatus.ACTIVE,
    });
    expect((request.authClaims as AuthClaims).roles).toEqual([
      TenantMembershipRole.BOARD_MEMBER,
    ]);
  });

  it('adds the membership to the acting user', async () => {
    const { guard, store } = setup({
      actor: { type: 'USER', userId: USER_ID, membershipId: null },
    });
    const { context } = contextFor(CLAIMS);

    await guard.canActivate(context);

    expect(store.get(ACTOR_CLS_KEY)).toEqual({
      type: 'USER',
      userId: USER_ID,
      membershipId: MEMBERSHIP_ID,
    });
  });

  it.each([
    ['no actor', undefined],
    ['a system actor', { type: 'SYSTEM', reason: 'scheduler' }],
  ])('leaves %s alone', async (_, actor) => {
    const { guard, store } = setup({ actor });
    const { context } = contextFor(CLAIMS);

    await guard.canActivate(context);

    expect(store.get(ACTOR_CLS_KEY)).toEqual(actor);
  });
});
