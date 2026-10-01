import type { ExecutionContext } from '@nestjs/common';
import type { ClsService } from 'nestjs-cls';

import { ACTOR_CLS_KEY } from '@/shared/application/actor-context';
import { InvalidTokenException } from '@/shared/application/exceptions/auth.exceptions';
import { UserInactiveException } from '@/shared/application/exceptions/user.exceptions';
import type { TokenVerifier } from '@/shared/application/ports/token.port';
import type { UserAccessLookup } from '@/shared/application/ports/user-access.port';

import { AccessTokenAuthGuard } from './access-token-auth.guard';

const USER_ID = 'user-1';
const CLAIMS = { sub: USER_ID, email: 'a@b.cz' };

type Lookup = { user: { isActive: boolean } | null } | { fails: Error };

function setup(options: { verify?: 'ok' | 'reject'; lookup?: Lookup } = {}) {
  const verifier: TokenVerifier = {
    verifyToken: jest.fn(() =>
      options.verify === 'reject'
        ? Promise.reject(new Error('jwt malformed'))
        : Promise.resolve(CLAIMS),
    ) as TokenVerifier['verifyToken'],
  };

  const lookup = options.lookup ?? { user: { isActive: true } };
  const userAccess: UserAccessLookup = {
    findUserAccess: jest.fn(() =>
      'fails' in lookup
        ? Promise.reject(lookup.fails)
        : Promise.resolve(lookup.user),
    ),
  };

  const store = new Map<string, unknown>();
  const cls = {
    get: (key: string) => store.get(key),
    set: (key: string, value: unknown) => store.set(key, value),
  } as unknown as ClsService;

  const guard = new AccessTokenAuthGuard(verifier, userAccess, cls);
  return { guard, store };
}

function contextFor(authorization?: string) {
  const request: Record<string, unknown> = {
    headers: authorization ? { authorization } : {},
  };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('AccessTokenAuthGuard', () => {
  it('rejects a request without a token', async () => {
    const { guard } = setup();
    const { context } = contextFor();

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      InvalidTokenException,
    );
  });

  it('rejects a non-bearer authorization header', async () => {
    const { guard } = setup();
    const { context } = contextFor('Basic abc');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      InvalidTokenException,
    );
  });

  it('rejects a token the verifier refuses', async () => {
    const { guard } = setup({ verify: 'reject' });
    const { context } = contextFor('Bearer bad');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      InvalidTokenException,
    );
  });

  it('treats a token for a user that no longer exists as invalid', async () => {
    const { guard } = setup({ lookup: { user: null } });
    const { context } = contextFor('Bearer good');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      InvalidTokenException,
    );
  });

  it('treats a failed user lookup as an invalid token', async () => {
    const { guard } = setup({ lookup: { fails: new Error('db down') } });
    const { context } = contextFor('Bearer good');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      InvalidTokenException,
    );
  });

  it('rejects an inactive user with its own error', async () => {
    const { guard } = setup({ lookup: { user: { isActive: false } } });
    const { context } = contextFor('Bearer good');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UserInactiveException,
    );
  });

  it('attaches the principal and claims and records the acting user', async () => {
    const { guard, store } = setup();
    const { context, request } = contextFor('Bearer good');

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(request.user).toEqual({
      userId: USER_ID,
      subject: USER_ID,
      authMethod: 'JWT',
    });
    expect(request.authClaims).toEqual(CLAIMS);
    expect(store.get(ACTOR_CLS_KEY)).toEqual({
      type: 'USER',
      userId: USER_ID,
      membershipId: null,
    });
  });
});
