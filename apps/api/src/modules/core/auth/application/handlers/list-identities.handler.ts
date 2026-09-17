import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  AUTH_IDENTITY_REPOSITORY,
  type AuthIdentityRepository,
} from '@/modules/core/auth/application/ports/auth.repository.port';
import { ListIdentitiesQuery } from '@/modules/core/auth/application/queries/list-identities.query';

export interface ListedIdentity {
  provider: 'LOCAL' | 'OIDC_GOOGLE';
  lastUsedAt: Date | null;
}

@QueryHandler(ListIdentitiesQuery)
export class ListIdentitiesHandler
  implements IQueryHandler<ListIdentitiesQuery, ListedIdentity[]>
{
  constructor(
    @Inject(AUTH_IDENTITY_REPOSITORY)
    private readonly identityRepository: AuthIdentityRepository,
  ) {}

  async execute(query: ListIdentitiesQuery): Promise<ListedIdentity[]> {
    const identities = await this.identityRepository.listByUser(query.userId);
    // The subject and the password hash never leave the server; the profile
    // only has to say which ways in exist.
    return identities.map((identity) => ({
      provider: identity.provider,
      lastUsedAt: identity.lastUsedAt ?? null,
    }));
  }
}
