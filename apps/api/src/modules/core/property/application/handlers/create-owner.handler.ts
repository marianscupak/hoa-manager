import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { CoreAuditLabelResolver } from '@/modules/core/audit-projections/core-audit-label-resolver.service';
import { GetUserByIdQuery } from '@/modules/core/identity/application/queries/get-user-by-id.query';
import { CreateOwnerCommand } from '@/modules/core/property/application/commands/create-owner.command';
import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import { OwnerCreatedAuditEvent } from '@/modules/core/property/audit/events/owner-created.event';
import { OwnerKind } from '@/modules/core/property/domain/ownership-plan';
import {
  DuplicateOwnerEmailException,
  OwnerAssociationAlreadyExistsException,
} from '@/shared/application/exceptions/property.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import { normalizeEmail } from '@/shared/application/utils/normalize-email';

@CommandHandler(CreateOwnerCommand)
export class CreateOwnerHandler
  implements ICommandHandler<CreateOwnerCommand, { ownerId: string }>
{
  constructor(
    @Inject(OWNER_REPOSITORY)
    private readonly ownerRepo: OwnerRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly uow: DrizzleUnitOfWork,
    private readonly queryBus: QueryBus,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: CoreAuditLabelResolver,
  ) {}

  async execute(command: CreateOwnerCommand): Promise<{ ownerId: string }> {
    const email = command.email ? normalizeEmail(command.email) : null;

    if (email) {
      const existing = await this.ownerRepo.findByEmail(
        command.tenantId,
        email,
      );
      if (existing) {
        throw new DuplicateOwnerEmailException();
      }
    }

    let resolvedUserId = command.userId;

    if (email && !resolvedUserId && command.executorId) {
      const executor = await this.queryBus.execute(
        new GetUserByIdQuery(command.executorId),
      );
      if (
        executor &&
        executor.email &&
        email.toLowerCase() === executor.email.toLowerCase()
      ) {
        resolvedUserId = executor.id;
      }
    }

    if (command.kind === OwnerKind.ASSOCIATION) {
      const exists = await this.ownerRepo.existsAssociationOwner(
        command.tenantId,
      );
      if (exists) throw new OwnerAssociationAlreadyExistsException();
    }

    return this.uow.execute(async () => {
      const newOwner = await this.ownerRepo.create(command.tenantId, {
        displayName: command.displayName,
        userId: resolvedUserId,
        email,
        kind: command.kind,
      });

      const actor = this.auditContext.requireActor();
      const actorLabel = await this.labelResolver.resolveActorLabel(actor);

      await this.auditService.append(
        OwnerCreatedAuditEvent.build({
          tenantId: command.tenantId,
          ownerId: newOwner.id,
          displayName: command.displayName,
          hasEmail: email !== null,
          linkedToUserId: resolvedUserId ?? null,
          actor,
          createdByLabel: actorLabel,
          occurredAt: this.clock.now(),
        }),
      );

      return { ownerId: newOwner.id };
    });
  }
}
