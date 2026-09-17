import { UnlinkIdentityCommand } from '@/modules/core/auth/application/commands/unlink-identity.command';

import { UnlinkIdentityHandler } from './unlink-identity.handler';

const USER = 'u1';

const identity = (provider: 'LOCAL' | 'OIDC_GOOGLE') => ({
  id: `i-${provider}`,
  userId: USER,
  provider,
  providerSubject: 's',
  passwordHash: provider === 'LOCAL' ? 'hash' : null,
});

function buildHandler(identities: ReturnType<typeof identity>[]) {
  const repo = {
    listByUser: jest.fn().mockResolvedValue(identities),
    deleteByUserAndProvider: jest.fn(),
  };
  const handler = new UnlinkIdentityHandler(repo as never);
  return { handler, repo };
}

describe('UnlinkIdentityHandler', () => {
  it('removes the provider when another way in remains', async () => {
    const { handler, repo } = buildHandler([
      identity('LOCAL'),
      identity('OIDC_GOOGLE'),
    ]);

    await handler.execute(new UnlinkIdentityCommand(USER, 'OIDC_GOOGLE'));

    expect(repo.deleteByUserAndProvider).toHaveBeenCalledWith(
      USER,
      'OIDC_GOOGLE',
    );
  });

  it('refuses to remove the only way into the account', async () => {
    const { handler, repo } = buildHandler([identity('OIDC_GOOGLE')]);

    await expect(
      handler.execute(new UnlinkIdentityCommand(USER, 'OIDC_GOOGLE')),
    ).rejects.toMatchObject({ code: 'LAST_IDENTITY' });
    expect(repo.deleteByUserAndProvider).not.toHaveBeenCalled();
  });

  it('refuses a provider the account does not have', async () => {
    const { handler, repo } = buildHandler([identity('LOCAL')]);

    await expect(
      handler.execute(new UnlinkIdentityCommand(USER, 'OIDC_GOOGLE')),
    ).rejects.toMatchObject({ code: 'IDENTITY_NOT_LINKED' });
    expect(repo.deleteByUserAndProvider).not.toHaveBeenCalled();
  });
});
