import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { type OwnerRepository } from '@/modules/core/property/application/ports/property.repository.port';
import { type UnitOfWork } from '@/shared/application/ports/unit-of-work.port';

import { LinkOwnerToAccountHandler } from './link-owner-to-account.handler';
import { LinkOwnerToAccountCommand } from '../commands/link-owner-to-account.command';

/** The shape Drizzle hands back for a unique-index violation: the pg error is
 *  on the cause chain, not on the error itself. */
const uniqueViolation = () =>
  Object.assign(new Error('duplicate key'), { cause: { code: '23505' } });

function build(options?: {
  ownerUserId?: string | null;
  owner?: null;
  membership?: null;
  dispatchThrows?: Error;
}) {
  const ownerRepo = {
    findById: jest.fn(async () =>
      options?.owner === null
        ? null
        : {
            id: 'o1',
            tenantId: 't1',
            displayName: 'Jana Dvořáková',
            userId: options?.ownerUserId ?? null,
          },
    ),
  } as unknown as OwnerRepository;

  // Scoped by the query itself: a membership from another association is
  // simply not in the list.
  const queryBus = {
    execute: jest.fn(async () =>
      options?.membership === null ? [] : [{ id: 'm1', userId: 'u1' }],
    ),
  } as unknown as QueryBus;

  const commandBus = {
    execute: jest.fn(async () => {
      if (options?.dispatchThrows) throw options.dispatchThrows;
    }),
  } as unknown as CommandBus;

  return {
    handler: new LinkOwnerToAccountHandler(
      {
        execute: jest.fn((work: () => Promise<unknown>) => work()),
      } as unknown as UnitOfWork,
      ownerRepo,
      queryBus,
      commandBus,
    ),
    commandBus,
  };
}

const command = () => new LinkOwnerToAccountCommand('t1', 'o1', 'm1');

describe('LinkOwnerToAccountHandler', () => {
  it('links an unlinked owner to a membership in the same association', async () => {
    const { handler, commandBus } = build();

    await handler.execute(command());

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: 'o1',
        userId: 'u1',
        source: 'DIRECT',
      }),
    );
  });

  it('refuses an owner that already has an account', async () => {
    // Overwriting a link silently would move the right to vote for that
    // owner's units without anyone noticing.
    const { handler, commandBus } = build({ ownerUserId: 'u7' });

    await expect(handler.execute(command())).rejects.toMatchObject({
      code: 'OWNER_ALREADY_LINKED',
    });
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('refuses an owner from another association', async () => {
    const { handler } = build({ owner: null });

    await expect(handler.execute(command())).rejects.toMatchObject({
      code: 'OWNER_NOT_FOUND',
    });
  });

  it('refuses a membership that is not in this association', async () => {
    const { handler } = build({ membership: null });

    await expect(handler.execute(command())).rejects.toMatchObject({
      code: 'MEMBERSHIP_NOT_FOUND',
    });
  });

  it('turns the unique-index violation into a domain error', async () => {
    // `owners_tenant_user_unique`: the account already stands for someone
    // else. Without this the board would see a driver message.
    const { handler } = build({ dispatchThrows: uniqueViolation() });

    await expect(handler.execute(command())).rejects.toMatchObject({
      code: 'USER_ALREADY_LINKED_TO_OWNER',
    });
  });

  it('lets an unrelated failure through untouched', async () => {
    const boom = new Error('connection reset');
    const { handler } = build({ dispatchThrows: boom });

    await expect(handler.execute(command())).rejects.toBe(boom);
  });
});
