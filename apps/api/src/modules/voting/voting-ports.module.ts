import { Global, Module } from '@nestjs/common';

import { OWNERSHIP_VOTE_LOOKUP } from '@/modules/core/property/application/ports/ownership-vote-lookup.port';
import { DrizzleOwnershipVoteLookup } from '@/modules/voting/infrastructure/persistence/drizzle-ownership-vote-lookup';

/**
 * Ports that core modules declare and voting implements. Global so the
 * register can inject OWNERSHIP_VOTE_LOOKUP without importing VotingModule,
 * which would make core depend on voting.
 */
@Global()
@Module({
  providers: [
    { provide: OWNERSHIP_VOTE_LOOKUP, useClass: DrizzleOwnershipVoteLookup },
  ],
  exports: [OWNERSHIP_VOTE_LOOKUP],
})
export class VotingPortsModule {}
