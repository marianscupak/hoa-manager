import { Inject } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';

import { SetOwnerUserIdCommand } from '@/modules/core/property/application/commands/set-owner-user-id.command';
import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import { type TenantMembershipWithUser } from '@/modules/core/tenancy/application/ports/tenant.repository.port';
import { ListTenantMembersQuery } from '@/modules/core/tenancy/application/queries/list-tenant-members.query';
import {
  OwnerAlreadyLinkedException,
  OwnerNotFoundException,
  UserAlreadyLinkedToOwnerException,
} from '@/shared/application/exceptions/property.exceptions';
import { MembershipNotFoundException } from '@/shared/application/exceptions/tenancy.exceptions';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';
import { isUniqueViolation } from '@/shared/errors/pg-errors';

import { LinkOwnerToAccountCommand } from '../commands/link-owner-to-account.command';

/**
 * Attaches a user account to an owner record on an admin's say-so.
 *
 * The write and the audit entry already exist — `SetOwnerUserIdCommand` is
 * what the invite flow dispatches, and its `DIRECT` source was defined for
 * exactly this caller. What is new is the guarding: the invite flow can take
 * for granted things an admin clicking a button cannot.
 */
@CommandHandler(LinkOwnerToAccountCommand)
export class LinkOwnerToAccountHandler
  implements ICommandHandler<LinkOwnerToAccountCommand>
{
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(OWNER_REPOSITORY) private readonly ownerRepo: OwnerRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: LinkOwnerToAccountCommand): Promise<void> {
    const { tenantId, ownerId, membershipId } = command;

    await this.uow.execute(async () => {
      const owner = await this.ownerRepo.findById(tenantId, ownerId);
      if (!owner) {
        throw new OwnerNotFoundException();
      }
      if (owner.userId) {
        throw new OwnerAlreadyLinkedException();
      }

      // The list is scoped to the association, so a membership from another
      // one is simply absent — which is the tenant check.
      const members = await this.queryBus.execute<
        ListTenantMembersQuery,
        TenantMembershipWithUser[]
      >(new ListTenantMembersQuery(tenantId));
      const membership = members.find((m) => m.id === membershipId);
      if (!membership) {
        throw new MembershipNotFoundException();
      }

      try {
        await this.commandBus.execute(
          new SetOwnerUserIdCommand(
            tenantId,
            ownerId,
            membership.userId,
            'DIRECT',
          ),
        );
      } catch (err) {
        // `owners_tenant_user_unique` — the account already stands for another
        // owner. Drizzle wraps the pg error, so the code sits on the cause
        // chain rather than on the error itself.
        if (isUniqueViolation(err)) {
          throw new UserAlreadyLinkedToOwnerException();
        }
        throw err;
      }
    });
  }
}
