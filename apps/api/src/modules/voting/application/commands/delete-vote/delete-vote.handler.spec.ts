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
import { type VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';
import { VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import { type Clock } from '@/shared/application/ports/clock.port';
import { type UnitOfWork } from '@/shared/application/ports/unit-of-work.port';

import { DeleteVoteCommand } from './delete-vote.command';
import { DeleteVoteHandler } from './delete-vote.handler';

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

describe('DeleteVoteHandler', () => {
  let voteWriteRepository: jest.Mocked<VoteWriteRepository>;
  let documentRepository: jest.Mocked<VoteDocumentRepository>;
  let storage: jest.Mocked<DocumentStoragePort>;
  let handler: DeleteVoteHandler;

  beforeEach(() => {
    voteWriteRepository = {
      findById: jest.fn().mockResolvedValue(DRAFT_VOTE),
      delete: jest.fn(),
    } as unknown as jest.Mocked<VoteWriteRepository>;
    documentRepository = {
      findByVoteId: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<VoteDocumentRepository>;
    storage = {
      isConfigured: jest.fn().mockReturnValue(true),
      delete: jest.fn(),
    } as unknown as jest.Mocked<DocumentStoragePort>;
    const unitOfWork = {
      execute: jest.fn((work: () => Promise<unknown>) => work()),
    } as unknown as UnitOfWork;
    const auditService = {
      append: jest.fn(),
    } as unknown as AuditService;
    const auditContext = {
      requireActor: jest.fn().mockReturnValue(ACTOR),
    } as unknown as AuditContextService;
    const labelResolver = {
      resolveActorLabel: jest.fn().mockResolvedValue('John Doe'),
    } as unknown as VotingAuditLabelResolver;
    const clock: Clock = { now: () => new Date('2026-08-22T12:00:00Z') };

    handler = new DeleteVoteHandler(
      voteWriteRepository,
      unitOfWork,
      clock,
      auditService,
      auditContext,
      labelResolver,
      documentRepository,
      storage,
    );
  });

  it('deletes the R2 objects of all vote documents after the DB delete', async () => {
    documentRepository.findByVoteId.mockResolvedValue([
      { ...UPLOADED_DOC, id: 'doc-1', objectKey: 'k1' },
      { ...UPLOADED_DOC, id: 'doc-2', objectKey: 'k2' },
    ]);

    await handler.execute(new DeleteVoteCommand('tenant-1', 'vote-1'));

    expect(voteWriteRepository.delete).toHaveBeenCalledWith(
      'tenant-1',
      'vote-1',
    );
    expect(storage.delete).toHaveBeenCalledWith('k1');
    expect(storage.delete).toHaveBeenCalledWith('k2');
  });

  it('skips R2 cleanup when storage is not configured', async () => {
    storage.isConfigured.mockReturnValue(false);
    documentRepository.findByVoteId.mockResolvedValue([
      { ...UPLOADED_DOC, objectKey: 'k1' },
    ]);
    await handler.execute(new DeleteVoteCommand('tenant-1', 'vote-1'));
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('still succeeds when an object delete fails', async () => {
    documentRepository.findByVoteId.mockResolvedValue([
      { ...UPLOADED_DOC, objectKey: 'k1' },
    ]);
    storage.delete.mockRejectedValue(new Error('r2 down'));
    await expect(
      handler.execute(new DeleteVoteCommand('tenant-1', 'vote-1')),
    ).resolves.toBeUndefined();
  });
});
