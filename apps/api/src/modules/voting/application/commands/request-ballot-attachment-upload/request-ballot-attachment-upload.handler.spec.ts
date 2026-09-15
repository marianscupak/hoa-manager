import { VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import {
  DocumentStorageNotConfiguredException,
  VoteDocumentTooLargeException,
  VoteDocumentTypeNotAllowedException,
  VoteNotFoundException,
  VoteNotOpenException,
} from '@/shared/application/exceptions/vote.exceptions';

import { RequestBallotAttachmentUploadCommand } from './request-ballot-attachment-upload.command';
import { RequestBallotAttachmentUploadHandler } from './request-ballot-attachment-upload.handler';

describe('RequestBallotAttachmentUploadHandler', () => {
  const voteWriteRepo = { findById: jest.fn() };
  const documentRepo = { insert: jest.fn() };
  const storage = { isConfigured: jest.fn(), presignPut: jest.fn() };
  const uow = { execute: jest.fn((fn: () => Promise<unknown>) => fn()) };
  let handler: RequestBallotAttachmentUploadHandler;

  const command = (
    overrides: Partial<{
      fileName: string;
      contentType: string;
      sizeBytes: number;
    }> = {},
  ) =>
    new RequestBallotAttachmentUploadCommand('tenant-1', 'vote-1', 'mem-1', {
      fileName: 'ballot.pdf',
      contentType: 'application/pdf',
      sizeBytes: 1024,
      ...overrides,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    storage.isConfigured.mockReturnValue(true);
    storage.presignPut.mockResolvedValue('https://r2.example/put');
    voteWriteRepo.findById.mockResolvedValue({
      id: 'vote-1',
      status: VoteStatus.OPEN,
    });
    handler = new RequestBallotAttachmentUploadHandler(
      voteWriteRepo as never,
      documentRepo as never,
      storage as never,
      uow as never,
    );
  });

  it('inserts a PENDING BALLOT document and returns a presigned URL', async () => {
    const result = await handler.execute(command());

    expect(documentRepo.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        voteId: 'vote-1',
        uploadedByMembershipId: 'mem-1',
        kind: 'BALLOT',
        status: 'PENDING',
        fileName: 'ballot.pdf',
      }),
    );
    expect(result.uploadUrl).toBe('https://r2.example/put');
    expect(result.documentId).toEqual(expect.any(String));
  });

  it('rejects a vote that is not open', async () => {
    voteWriteRepo.findById.mockResolvedValue({
      id: 'vote-1',
      status: VoteStatus.DRAFT,
    });
    await expect(handler.execute(command())).rejects.toThrow(
      VoteNotOpenException,
    );
  });

  it('rejects a missing vote', async () => {
    voteWriteRepo.findById.mockResolvedValue(null);
    await expect(handler.execute(command())).rejects.toThrow(
      VoteNotFoundException,
    );
  });

  it('rejects a content type that is not a scan', async () => {
    await expect(
      handler.execute(command({ contentType: 'application/msword' })),
    ).rejects.toThrow(VoteDocumentTypeNotAllowedException);
  });

  it('rejects a file over 20 MB', async () => {
    await expect(
      handler.execute(command({ sizeBytes: 21 * 1024 * 1024 })),
    ).rejects.toThrow(VoteDocumentTooLargeException);
  });

  it('rejects when storage is not configured', async () => {
    storage.isConfigured.mockReturnValue(false);
    await expect(handler.execute(command())).rejects.toThrow(
      DocumentStorageNotConfiguredException,
    );
  });
});
