import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GetVoteAuditExportQuery } from './get-vote-audit-export.query';
import type { VoteAuditExportDto } from '../../../api/dto/vote-audit-export.dto';
import { VoteAuditExporterService } from '../../../audit/exporter/vote-audit-exporter.service';
import { VotingAuditLabelResolver } from '../../../audit/label-resolver.service';

@QueryHandler(GetVoteAuditExportQuery)
export class GetVoteAuditExportHandler
  implements IQueryHandler<GetVoteAuditExportQuery, VoteAuditExportDto>
{
  constructor(
    private readonly exporter: VoteAuditExporterService,
    private readonly labelResolver: VotingAuditLabelResolver,
  ) {}

  async execute(query: GetVoteAuditExportQuery): Promise<VoteAuditExportDto> {
    const exportedByLabel = await this.labelResolver.resolveMembershipLabel(
      query.exportedByMembershipId,
    );

    return this.exporter.export({
      tenantId: query.tenantId,
      voteId: query.voteId,
      exportedByMembershipId: query.exportedByMembershipId,
      exportedByLabel,
      exporterRoles: query.exporterRoles,
    });
  }
}
