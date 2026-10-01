import type { QueryBus } from '@nestjs/cqrs';

import { GetUserByIdQuery } from '@/modules/core/identity/application/queries/get-user-by-id.query';
import { UserNotFoundError } from '@/modules/core/identity/domain/errors/user-not-found.error';

import { QueryBusUserAccessLookup } from './user-access.lookup';

function lookupAnswering(result: () => Promise<unknown>) {
  const execute = jest.fn(result);
  const lookup = new QueryBusUserAccessLookup({
    execute,
  } as unknown as QueryBus);
  return { lookup, execute };
}

describe('QueryBusUserAccessLookup', () => {
  it('reports whether the account is active', async () => {
    const { lookup, execute } = lookupAnswering(() =>
      Promise.resolve({ id: 'user-1', isActive: false }),
    );

    await expect(lookup.findUserAccess('user-1')).resolves.toEqual({
      isActive: false,
    });
    expect(execute).toHaveBeenCalledWith(new GetUserByIdQuery('user-1'));
  });

  it('returns null for an account that does not exist', async () => {
    const { lookup } = lookupAnswering(() =>
      Promise.reject(new UserNotFoundError()),
    );

    await expect(lookup.findUserAccess('gone')).resolves.toBeNull();
  });

  it('lets any other failure through', async () => {
    const failure = new Error('db down');
    const { lookup } = lookupAnswering(() => Promise.reject(failure));

    await expect(lookup.findUserAccess('user-1')).rejects.toBe(failure);
  });
});
