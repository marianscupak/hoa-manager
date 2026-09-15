import { type DocumentStoragePort } from '@/modules/voting/application/ports/document-storage.port';
import {
  type VoteDocumentRecord,
  type VoteDocumentRepository,
} from '@/modules/voting/application/ports/vote-document.repository.port';
import {
  DocumentStorageNotConfiguredException,
  VoteDocumentNotFoundException,
} from '@/shared/application/exceptions/vote.exceptions';

import { GetBallotAttachmentDownloadUrlHandler } from './get-ballot-attachment-download-url.handler';
import { GetBallotAttachmentDownloadUrlQuery } from './get-ballot-attachment-download-url.query';

const UPLOADED_BALLOT_DOC: VoteDocumentRecord = {
  id: 'doc-1',
  tenantId: 'tenant-1',
  voteId: 'vote-1',
  uploadedByMembershipId: 'member-1',
  fileName: 'ballot.pdf',
  contentType: 'application/pdf',
  sizeBytes: 1024,
  objectKey: 'tenants/tenant-1/votes/vote-1/ballots/doc-1',
  kind: 'BALLOT',
  status: 'UPLOADED',
  createdAt: new Date('2026-09-15T10:00:00Z'),
  updatedAt: new Date('2026-09-15T10:00:00Z'),
};

describe('GetBallotAttachmentDownloadUrlHandler', () => {
  let documentRepository: jest.Mocked<VoteDocumentRepository>;
  let storage: jest.Mocked<DocumentStoragePort>;
  let handler: GetBallotAttachmentDownloadUrlHandler;

  beforeEach(() => {
    documentRepository = {
      findById: jest.fn().mockResolvedValue(UPLOADED_BALLOT_DOC),
    } as unknown as jest.Mocked<VoteDocumentRepository>;
    storage = {
      isConfigured: jest.fn().mockReturnValue(true),
      presignGet: jest.fn().mockResolvedValue('https://r2.example/download'),
    } as unknown as jest.Mocked<DocumentStoragePort>;
    handler = new GetBallotAttachmentDownloadUrlHandler(
      documentRepository,
      storage,
    );
  });

  const query = new GetBallotAttachmentDownloadUrlQuery(
    'tenant-1',
    'vote-1',
    'doc-1',
  );

  it('returns a presigned GET URL for an UPLOADED BALLOT document', async () => {
    const result = await handler.execute(query);
    expect(result).toEqual({ downloadUrl: 'https://r2.example/download' });
    expect(storage.presignGet).toHaveBeenCalledWith(
      UPLOADED_BALLOT_DOC.objectKey,
      UPLOADED_BALLOT_DOC.fileName,
    );
  });

  it('rejects a document that is still PENDING', async () => {
    documentRepository.findById.mockResolvedValue({
      ...UPLOADED_BALLOT_DOC,
      status: 'PENDING',
    });
    await expect(handler.execute(query)).rejects.toThrow(
      VoteDocumentNotFoundException,
    );
    expect(storage.presignGet).not.toHaveBeenCalled();
  });

  it('rejects a kind=VOTE document on the ballot-attachment route', async () => {
    documentRepository.findById.mockResolvedValue({
      ...UPLOADED_BALLOT_DOC,
      kind: 'VOTE',
      fileName: 'budget.pdf',
    });
    await expect(handler.execute(query)).rejects.toThrow(
      VoteDocumentNotFoundException,
    );
    expect(storage.presignGet).not.toHaveBeenCalled();
  });

  it('rejects a missing document', async () => {
    documentRepository.findById.mockResolvedValue(null);
    await expect(handler.execute(query)).rejects.toThrow(
      VoteDocumentNotFoundException,
    );
  });

  it('rejects when storage is not configured', async () => {
    storage.isConfigured.mockReturnValue(false);
    await expect(handler.execute(query)).rejects.toThrow(
      DocumentStorageNotConfiguredException,
    );
    expect(documentRepository.findById).not.toHaveBeenCalled();
  });
});
