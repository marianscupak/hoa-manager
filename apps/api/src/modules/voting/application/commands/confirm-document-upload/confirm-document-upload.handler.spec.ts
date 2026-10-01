import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
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
  VoteDocumentUploadIncompleteException,
  VoteNotDraftException,
} from '@/shared/application/exceptions/vote.exceptions';
import { type Clock } from '@/shared/application/ports/clock.port';
import { type UnitOfWork } from '@/shared/application/ports/unit-of-work.port';
import type { AuditActor } from '@/shared/domain/actor';

import { ConfirmDocumentUploadCommand } from './confirm-document-upload.command';
import { ConfirmDocumentUploadHandler } from './confirm-document-upload.handler';

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

const PENDING_DOC: VoteDocumentRecord = {
  id: 'doc-1',
  tenantId: 'tenant-1',
  voteId: 'vote-1',
  uploadedByMembershipId: 'member-1',
  fileName: 'budget.pdf',
  contentType: 'application/pdf',
  sizeBytes: 1024,
  objectKey: 'tenants/tenant-1/votes/vote-1/doc-1',
  kind: 'VOTE',
  status: 'PENDING',
  createdAt: new Date('2026-08-22T10:00:00Z'),
  updatedAt: new Date('2026-08-22T10:00:00Z'),
};

describe('ConfirmDocumentUploadHandler', () => {
  let voteWriteRepository: jest.Mocked<VoteWriteRepository>;
  let documentRepository: jest.Mocked<VoteDocumentRepository>;
  let storage: jest.Mocked<DocumentStoragePort>;
  let auditService: jest.Mocked<AuditService>;
  let handler: ConfirmDocumentUploadHandler;

  beforeEach(() => {
    voteWriteRepository = {
      findById: jest.fn().mockResolvedValue(DRAFT_VOTE),
    } as unknown as jest.Mocked<VoteWriteRepository>;
    documentRepository = {
      findById: jest.fn().mockResolvedValue(PENDING_DOC),
      markUploaded: jest.fn(),
      deleteById: jest.fn(),
    } as unknown as jest.Mocked<VoteDocumentRepository>;
    storage = {
      isConfigured: jest.fn().mockReturnValue(true),
      head: jest.fn().mockResolvedValue({ sizeBytes: 1024 }),
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

    const logger = { info: jest.fn(), warn: jest.fn() } as never;

    handler = new ConfirmDocumentUploadHandler(
      voteWriteRepository,
      documentRepository,
      storage,
      unitOfWork,
      clock,
      auditService,
      auditContext,
      labelResolver,
      logger,
    );
  });

  const command = new ConfirmDocumentUploadCommand(
    'tenant-1',
    'vote-1',
    'doc-1',
  );

  it('marks the document UPLOADED and appends the audit event', async () => {
    await handler.execute(command);

    expect(documentRepository.markUploaded).toHaveBeenCalledWith(
      'tenant-1',
      'doc-1',
    );
    expect(auditService.append).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: VotingEventType.VOTE_DOCUMENT_ADDED,
      }),
    );
  });

  it('is idempotent for an already UPLOADED document', async () => {
    documentRepository.findById.mockResolvedValue({
      ...PENDING_DOC,
      status: 'UPLOADED',
    });
    await handler.execute(command);
    expect(documentRepository.markUploaded).not.toHaveBeenCalled();
    expect(auditService.append).not.toHaveBeenCalled();
  });

  it('rejects and deletes the row when the object is missing in R2', async () => {
    storage.head.mockResolvedValue(null);
    await expect(handler.execute(command)).rejects.toThrow(
      VoteDocumentUploadIncompleteException,
    );
    expect(documentRepository.deleteById).toHaveBeenCalledWith(
      'tenant-1',
      'doc-1',
    );
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('rejects and deletes object + row on size mismatch', async () => {
    storage.head.mockResolvedValue({ sizeBytes: 999 });
    await expect(handler.execute(command)).rejects.toThrow(
      VoteDocumentUploadIncompleteException,
    );
    expect(storage.delete).toHaveBeenCalledWith(PENDING_DOC.objectKey);
    expect(documentRepository.deleteById).toHaveBeenCalledWith(
      'tenant-1',
      'doc-1',
    );
  });

  it('still rejects and deletes the row when the mismatch-path object delete fails', async () => {
    storage.head.mockResolvedValue({ sizeBytes: 999 });
    storage.delete.mockRejectedValue(new Error('r2 down'));
    await expect(handler.execute(command)).rejects.toThrow(
      VoteDocumentUploadIncompleteException,
    );
    expect(documentRepository.deleteById).toHaveBeenCalledWith(
      'tenant-1',
      'doc-1',
    );
  });

  it('rejects when the vote is not DRAFT', async () => {
    voteWriteRepository.findById.mockResolvedValue({
      ...DRAFT_VOTE,
      status: VoteStatus.SCHEDULED,
    } as unknown as VoteAggregate);
    await expect(handler.execute(command)).rejects.toThrow(
      VoteNotDraftException,
    );
  });

  it('rejects when the document does not exist', async () => {
    documentRepository.findById.mockResolvedValue(null);
    await expect(handler.execute(command)).rejects.toThrow(
      VoteDocumentNotFoundException,
    );
  });
});
