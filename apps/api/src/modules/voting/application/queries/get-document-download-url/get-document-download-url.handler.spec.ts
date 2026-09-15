import { type DocumentStoragePort } from '@/modules/voting/application/ports/document-storage.port';
import {
  type VoteDocumentRecord,
  type VoteDocumentRepository,
} from '@/modules/voting/application/ports/vote-document.repository.port';
import { type VoteWriteRepository } from '@/modules/voting/application/ports/vote-write.repository.port';
import { type VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';
import { VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import {
  DocumentStorageNotConfiguredException,
  VoteDocumentNotFoundException,
  VoteNotFoundException,
} from '@/shared/application/exceptions/vote.exceptions';

import { GetDocumentDownloadUrlHandler } from './get-document-download-url.handler';
import { GetDocumentDownloadUrlQuery } from './get-document-download-url.query';

const DRAFT_VOTE = {
  id: 'vote-1',
  tenantId: 'tenant-1',
  title: 'Budget 2026',
  status: VoteStatus.DRAFT,
} as unknown as VoteAggregate;

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

describe('GetDocumentDownloadUrlHandler', () => {
  let voteWriteRepository: jest.Mocked<VoteWriteRepository>;
  let documentRepository: jest.Mocked<VoteDocumentRepository>;
  let storage: jest.Mocked<DocumentStoragePort>;
  let handler: GetDocumentDownloadUrlHandler;

  beforeEach(() => {
    voteWriteRepository = {
      findById: jest.fn().mockResolvedValue({
        ...DRAFT_VOTE,
        status: VoteStatus.OPEN,
      } as unknown as VoteAggregate),
    } as unknown as jest.Mocked<VoteWriteRepository>;
    documentRepository = {
      findById: jest.fn().mockResolvedValue(UPLOADED_DOC),
    } as unknown as jest.Mocked<VoteDocumentRepository>;
    storage = {
      isConfigured: jest.fn().mockReturnValue(true),
      presignGet: jest.fn().mockResolvedValue('https://r2.example/download'),
    } as unknown as jest.Mocked<DocumentStoragePort>;
    handler = new GetDocumentDownloadUrlHandler(
      voteWriteRepository,
      documentRepository,
      storage,
    );
  });

  const query = (roles: string[] = ['UNIT_OWNER']) =>
    new GetDocumentDownloadUrlQuery('tenant-1', 'vote-1', 'doc-1', roles);

  it('returns a presigned GET URL for an UPLOADED document', async () => {
    const result = await handler.execute(query());
    expect(result).toEqual({ downloadUrl: 'https://r2.example/download' });
    expect(storage.presignGet).toHaveBeenCalledWith(
      UPLOADED_DOC.objectKey,
      UPLOADED_DOC.fileName,
    );
  });

  it('refuses a PENDING document as not found', async () => {
    documentRepository.findById.mockResolvedValue({
      ...UPLOADED_DOC,
      status: 'PENDING',
    });
    await expect(handler.execute(query())).rejects.toThrow(
      VoteDocumentNotFoundException,
    );
  });

  it('hides documents of a DRAFT vote from non-privileged members', async () => {
    voteWriteRepository.findById.mockResolvedValue(DRAFT_VOTE);
    await expect(handler.execute(query(['UNIT_OWNER']))).rejects.toThrow(
      VoteNotFoundException,
    );
  });

  it('serves documents of a DRAFT vote to admins', async () => {
    voteWriteRepository.findById.mockResolvedValue(DRAFT_VOTE);
    const result = await handler.execute(query(['ADMIN']));
    expect(result.downloadUrl).toBe('https://r2.example/download');
  });

  it('rejects when storage is not configured', async () => {
    storage.isConfigured.mockReturnValue(false);
    await expect(handler.execute(query())).rejects.toThrow(
      DocumentStorageNotConfiguredException,
    );
  });

  it('treats a ballot scan as not found on the public document route', async () => {
    documentRepository.findById.mockResolvedValue({
      ...UPLOADED_DOC,
      kind: 'BALLOT',
      fileName: 'ballot.pdf',
    });

    await expect(handler.execute(query(['ADMIN']))).rejects.toThrow(
      VoteDocumentNotFoundException,
    );
    expect(storage.presignGet).not.toHaveBeenCalled();
  });
});
