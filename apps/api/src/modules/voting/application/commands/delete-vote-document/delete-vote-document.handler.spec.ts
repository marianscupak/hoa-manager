import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import type { AuditActor } from '@/modules/core/audit/domain/actor';
import { type DocumentStoragePort } from '@/modules/voting/application/ports/document-storage.port';
import {
  type VoteDocumentRecord,
  type VoteDocumentRepository,
} from '@/modules/voting/application/ports/vote-document.repository.port';
import { type VoteWriteRepository } from '@/modules/voting/application/ports/vote-write.repository.port';
import { VotingAuditLabelResolver } from '@/modules/voting/audit/label-resolver.service';
import { VotingEventType } from '@/modules/voting/audit/voting-event-types';
import { type VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';
import { VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import {
  VoteDocumentNotFoundException,
  VoteNotDraftException,
} from '@/shared/application/exceptions/vote.exceptions';
import { type Clock } from '@/shared/application/ports/clock.port';
import { type UnitOfWork } from '@/shared/application/ports/unit-of-work.port';

import { DeleteVoteDocumentCommand } from './delete-vote-document.command';
import { DeleteVoteDocumentHandler } from './delete-vote-document.handler';

const DRAFT_VOTE = {
  id: 'vote-1',
  tenantId: 'tenant-1',
  title: 'Budget 2026',
  status: VoteStatus.DRAFT,
} as unknown as VoteAggregate;

const ACTOR: AuditActor = {
  type: 'USER',
  userId: 'user-1',
  membershipId: 'member-1',
};

const UPLOADED_DOC: VoteDocumentRecord = {
  id: 'doc-1',
  tenantId: 'tenant-1',
  voteId: 'vote-1',
  uploadedByMembershipId: 'member-1',
  fileName: 'budget.pdf',
  contentType: 'application/pdf',
  sizeBytes: 1024,
  objectKey: 'tenants/tenant-1/votes/vote-1/doc-1',
  kind: 'VOTE',
  status: 'UPLOADED',
  createdAt: new Date('2026-08-22T10:00:00Z'),
  updatedAt: new Date('2026-08-22T10:00:00Z'),
};

describe('DeleteVoteDocumentHandler', () => {
  let voteWriteRepository: jest.Mocked<VoteWriteRepository>;
  let documentRepository: jest.Mocked<VoteDocumentRepository>;
  let storage: jest.Mocked<DocumentStoragePort>;
  let auditService: jest.Mocked<AuditService>;
  let handler: DeleteVoteDocumentHandler;

  beforeEach(() => {
    voteWriteRepository = {
      findById: jest.fn().mockResolvedValue(DRAFT_VOTE),
    } as unknown as jest.Mocked<VoteWriteRepository>;
    documentRepository = {
      findById: jest.fn().mockResolvedValue(UPLOADED_DOC),
      deleteById: jest.fn(),
    } as unknown as jest.Mocked<VoteDocumentRepository>;
    storage = {
      isConfigured: jest.fn().mockReturnValue(true),
      delete: jest.fn(),
    } as unknown as jest.Mocked<DocumentStoragePort>;
    auditService = {
      append: jest.fn(),
    } as unknown as jest.Mocked<AuditService>;
    const unitOfWork = {
      execute: jest.fn((work: () => Promise<unknown>) => work()),
    } as unknown as UnitOfWork;
    const auditContext = {
      requireActor: jest.fn().mockReturnValue(ACTOR),
    } as unknown as AuditContextService;
    const labelResolver = {
      resolveActorLabel: jest.fn().mockResolvedValue('John Doe'),
    } as unknown as VotingAuditLabelResolver;
    const clock: Clock = { now: () => new Date('2026-08-22T12:00:00Z') };

    handler = new DeleteVoteDocumentHandler(
      voteWriteRepository,
      documentRepository,
      storage,
      unitOfWork,
      clock,
      auditService,
      auditContext,
      labelResolver,
    );
  });

  const command = new DeleteVoteDocumentCommand('tenant-1', 'vote-1', 'doc-1');

  it('deletes the row, appends the audit event, then deletes the R2 object', async () => {
    await handler.execute(command);

    expect(documentRepository.deleteById).toHaveBeenCalledWith(
      'tenant-1',
      'doc-1',
    );
    expect(auditService.append).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: VotingEventType.VOTE_DOCUMENT_REMOVED,
      }),
    );
    expect(storage.delete).toHaveBeenCalledWith(UPLOADED_DOC.objectKey);
  });

  it('still succeeds when the R2 object delete fails (best-effort)', async () => {
    storage.delete.mockRejectedValue(new Error('r2 down'));
    await expect(handler.execute(command)).resolves.toBeUndefined();
    expect(documentRepository.deleteById).toHaveBeenCalled();
  });

  it('rejects when the vote is not DRAFT', async () => {
    voteWriteRepository.findById.mockResolvedValue({
      ...DRAFT_VOTE,
      status: VoteStatus.OPEN,
    } as unknown as VoteAggregate);
    await expect(handler.execute(command)).rejects.toThrow(
      VoteNotDraftException,
    );
    expect(documentRepository.deleteById).not.toHaveBeenCalled();
  });

  it('rejects when the document does not exist', async () => {
    documentRepository.findById.mockResolvedValue(null);
    await expect(handler.execute(command)).rejects.toThrow(
      VoteDocumentNotFoundException,
    );
  });
});
