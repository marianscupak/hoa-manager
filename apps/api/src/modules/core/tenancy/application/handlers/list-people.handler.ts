import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import { type OwnerWithInviteStatus } from '@/modules/core/property/application/handlers/list-owners.handler';
import { ListOwnersQuery } from '@/modules/core/property/application/queries/list-owners.query';
import { PersonResponseDto } from '@/modules/core/tenancy/api/dto/person-response.dto';
import {
  PEOPLE_HOLDINGS_REPOSITORY,
  type PeopleHoldingsRepository,
} from '@/modules/core/tenancy/application/ports/people-holdings.repository.port';
import { ListTenantMembersQuery } from '@/modules/core/tenancy/application/queries/list-tenant-members.query';
import { type TenantMembershipWithUser } from '@/modules/core/tenancy/application/ports/tenant.repository.port';
import { unionPeople } from '@/modules/core/tenancy/domain/people-union';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import { Rational } from '@/shared/domain/rational';

import { ListPeopleQuery } from '../queries/list-people.query';

/**
 * The owner register and the account list as one set of people.
 *
 * Both halves come from the queries that already own them — `ListOwnersQuery`
 * carries invite status and the delete guard, `ListTenantMembersQuery` the
 * roles — so nothing about either is restated here and the two cannot drift
 * from what their own screens used to show. Only the holdings join is new.
 */
@QueryHandler(ListPeopleQuery)
export class ListPeopleHandler implements IQueryHandler<ListPeopleQuery> {
  constructor(
    private readonly queryBus: QueryBus,
    @Inject(PEOPLE_HOLDINGS_REPOSITORY)
    private readonly holdingsRepo: PeopleHoldingsRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(query: ListPeopleQuery): Promise<PersonResponseDto[]> {
    const now = this.clock.now();
    const [owners, members, holdings] = await Promise.all([
      this.queryBus.execute<ListOwnersQuery, OwnerWithInviteStatus[]>(
        new ListOwnersQuery(query.tenantId),
      ),
      this.queryBus.execute<ListTenantMembersQuery, TenantMembershipWithUser[]>(
        new ListTenantMembersQuery(query.tenantId),
      ),
      this.holdingsRepo.findHoldings(query.tenantId, now),
    ]);

    const people = unionPeople({
      owners: owners.map((o) => ({
        ownerId: o.id,
        displayName: o.displayName,
        email: o.email,
        kind: o.kind,
        ico: o.ico,
        userId: o.userId,
        hasOwnershipRecords: o.hasOwnershipRecords,
        inviteStatus: o.inviteStatus,
        inviteCreatedAt: o.inviteCreatedAt,
      })),
      members: members.map((m) => ({
        membershipId: m.id,
        userId: m.userId,
        fullName: m.user.fullName,
        email: m.user.email,
        role: m.role,
        status: m.status,
        joinedAt: m.createdAt,
      })),
      holdings,
    });

    // Who owns which unit is public; a contact address and an account are
    // not. A member who owns nothing is not part of the ownership register a
    // neighbour is entitled to see either.
    const visible = query.canSeeAccounts
      ? people
      : people.filter((p) => p.source === 'OWNER');

    return visible.map((p) => ({
      key: p.key,
      source: p.source,
      displayName: p.displayName,
      ownerId: p.ownerId,
      kind: p.kind,
      ico: p.ico,
      unitCount: p.unitCount,
      sharePercent: p.share.mul(Rational.from(100, 1)).toDecimalString(2),
      hasOwnershipRecords: p.hasOwnershipRecords,
      email: query.canSeeAccounts ? p.email : null,
      membershipId: query.canSeeAccounts ? p.membershipId : null,
      userId: query.canSeeAccounts ? p.userId : null,
      role: query.canSeeAccounts ? p.role : null,
      status: query.canSeeAccounts ? p.status : null,
      joinedAt: query.canSeeAccounts ? p.joinedAt?.toISOString() ?? null : null,
      inviteStatus: query.canSeeAccounts ? p.inviteStatus : null,
      inviteCreatedAt: query.canSeeAccounts
        ? p.inviteCreatedAt?.toISOString() ?? null
        : null,
      suggestedCounterpartKey: query.canSeeAccounts
        ? p.suggestedCounterpartKey
        : null,
    }));
  }
}
