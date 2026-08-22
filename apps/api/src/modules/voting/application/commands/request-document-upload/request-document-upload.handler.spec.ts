import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import { type DocumentStoragePort } from '@/modules/voting/application/ports/document-storage.port';
import { type VoteDocumentRepository } from '@/modules/voting/application/ports/vote-document.repository.port';
import { type VoteWriteRepository } from '@/modules/voting/application/ports/vote-write.repository.port';
import { type VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';
import { VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import {
  DocumentStorageNotConfiguredException,
  VoteDocumentLimitReachedException,
  VoteDocumentTooLargeException,
  VoteDocumentTypeNotAllowedException,
  VoteNotDraftException,
  VoteNotFoundException,
} from '@/shared/application/exceptions/vote.exceptions';

import { RequestDocumentUploadCommand } from './request-document-upload.command';
import { RequestDocumentUploadHandler } from './request-document-upload.handler';

const DRAFT_VOTE = {
  id: 'vote-1',
  tenantId: 'tenant-1',
  title: 'Budget 2026',
  status: VoteStatus.DRAFT,
} as unknown as VoteAggregate;

describe('RequestDocumentUploadHandler', () => {
  let voteWriteRepository: jest.Mocked<VoteWriteRepository>;
  let documentRepository: jest.Mocked<VoteDocumentRepository>;
  let storage: jest.Mocked<DocumentStoragePort>;
  let handler: RequestDocumentUploadHandler;

  beforeEach(() => {
    voteWriteRepository = {
      findById: jest.fn().mockResolvedValue(DRAFT_VOTE),
    } as unknown as jest.Mocked<VoteWriteRepository>;
    documentRepository = {
      insert: jest.fn(),
      countByVoteId: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<VoteDocumentRepository>;
    storage = {
      isConfigured: jest.fn().mockReturnValue(true),
      presignPut: jest.fn().mockResolvedValue('https://r2.example/upload'),
    } as unknown as jest.Mocked<DocumentStoragePort>;
    const unitOfWork = {
      execute: jest.fn((work: () => Promise<unknown>) => work()),
    } as unknown as DrizzleUnitOfWork;
    handler = new RequestDocumentUploadHandler(
      voteWriteRepository,
      documentRepository,
      storage,
      unitOfWork,
    );
  });

  const command = (
    overrides?: Partial<{
      fileName: string;
      contentType: string;
      sizeBytes: number;
    }>,
  ) =>
    new RequestDocumentUploadCommand('tenant-1', 'vote-1', 'member-1', {
      fileName: 'budget.pdf',
      contentType: 'application/pdf',
      sizeBytes: 1024,
      ...overrides,
    });

  it('inserts a PENDING row and returns a presigned upload URL', async () => {
    const result = await handler.execute(command());

    expect(result.uploadUrl).toBe('https://r2.example/upload');
    const expectedKey = `tenants/tenant-1/votes/vote-1/${result.documentId}`;
    expect(documentRepository.insert).toHaveBeenCalledWith({
      id: result.documentId,
      tenantId: 'tenant-1',
      voteId: 'vote-1',
      uploadedByMembershipId: 'member-1',
      fileName: 'budget.pdf',
      contentType: 'application/pdf',
      sizeBytes: 1024,
      objectKey: expectedKey,
      status: 'PENDING',
    });
    expect(storage.presignPut).toHaveBeenCalledWith(
      expectedKey,
      'application/pdf',
      1024,
    );
  });

  it('rejects when storage is not configured', async () => {
    storage.isConfigured.mockReturnValue(false);
    await expect(handler.execute(command())).rejects.toThrow(
      DocumentStorageNotConfiguredException,
    );
  });

  it('rejects when the vote does not exist', async () => {
    voteWriteRepository.findById.mockResolvedValue(null);
    await expect(handler.execute(command())).rejects.toThrow(
      VoteNotFoundException,
    );
  });

  it('rejects when the vote is not DRAFT', async () => {
    voteWriteRepository.findById.mockResolvedValue({
      ...DRAFT_VOTE,
      status: VoteStatus.OPEN,
    } as unknown as VoteAggregate);
    await expect(handler.execute(command())).rejects.toThrow(
      VoteNotDraftException,
    );
  });

  it('rejects a disallowed content type', async () => {
    await expect(
      handler.execute(command({ contentType: 'application/x-msdownload' })),
    ).rejects.toThrow(VoteDocumentTypeNotAllowedException);
    expect(documentRepository.insert).not.toHaveBeenCalled();
  });

  it('rejects a file over 50 MB', async () => {
    await expect(
      handler.execute(command({ sizeBytes: 50 * 1024 * 1024 + 1 })),
    ).rejects.toThrow(VoteDocumentTooLargeException);
  });

  it('rejects the 21st document', async () => {
    documentRepository.countByVoteId.mockResolvedValue(20);
    await expect(handler.execute(command())).rejects.toThrow(
      VoteDocumentLimitReachedException,
    );
  });
});
