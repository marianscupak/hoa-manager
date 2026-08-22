import { RequestDocumentUploadDto } from '../../../api/dto/vote.dto';

export class RequestDocumentUploadCommand {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly actorMembershipId: string,
    public readonly data: RequestDocumentUploadDto,
  ) {}
}
