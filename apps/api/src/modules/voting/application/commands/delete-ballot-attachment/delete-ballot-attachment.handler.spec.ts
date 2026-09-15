import { type DocumentStoragePort } from '@/modules/voting/application/ports/document-storage.port';
import {
  type VoteDocumentRecord,
  type VoteDocumentRepository,
} from '@/modules/voting/application/ports/vote-document.repository.port';
import { VoteDocumentNotFoundException } from '@/shared/application/exceptions/vote.exceptions';

import { DeleteBallotAttachmentCommand } from './delete-ballot-attachment.command';
import { DeleteBallotAttachmentHandler } from './delete-ballot-attachment.handler';

const PENDING_BALLOT_DOC: VoteDocumentRecord = {
  id: 'doc-1',
  tenantId: 'tenant-1',
  voteId: 'vote-1',
  uploadedByMembershipId: 'member-1',
  fileName: 'ballot.pdf',
  contentType: 'application/pdf',
  sizeBytes: 1024,
  objectKey: 'tenants/tenant-1/votes/vote-1/ballots/doc-1',
  kind: 'BALLOT',
  status: 'PENDING',
  createdAt: new Date('2026-09-15T10:00:00Z'),
  updatedAt: new Date('2026-09-15T10:00:00Z'),
};

describe('DeleteBallotAttachmentHandler', () => {
  let documentRepository: jest.Mocked<VoteDocumentRepository>;
  let storage: jest.Mocked<DocumentStoragePort>;
  let handler: DeleteBallotAttachmentHandler;

  beforeEach(() => {
    documentRepository = {
      findById: jest.fn().mockResolvedValue(PENDING_BALLOT_DOC),
      isAttachmentLinked: jest.fn().mockResolvedValue(false),
      deleteById: jest.fn(),
    } as unknown as jest.Mocked<VoteDocumentRepository>;
    storage = {
      delete: jest.fn(),
    } as unknown as jest.Mocked<DocumentStoragePort>;
    handler = new DeleteBallotAttachmentHandler(documentRepository, storage);
  });

  const command = new DeleteBallotAttachmentCommand(
    'tenant-1',
    'vote-1',
    'doc-1',
  );

  it('deletes the row and the R2 object', async () => {
    await handler.execute(command);

    expect(documentRepository.deleteById).toHaveBeenCalledWith(
      'tenant-1',
      'doc-1',
    );
    expect(storage.delete).toHaveBeenCalledWith(PENDING_BALLOT_DOC.objectKey);
  });

  it('still succeeds when the R2 object delete fails (best-effort)', async () => {
    storage.delete.mockRejectedValue(new Error('r2 down'));
    await expect(handler.execute(command)).resolves.toBeUndefined();
    expect(documentRepository.deleteById).toHaveBeenCalledWith(
      'tenant-1',
      'doc-1',
    );
  });

  it('rejects a kind=VOTE document', async () => {
    documentRepository.findById.mockResolvedValue({
      ...PENDING_BALLOT_DOC,
      kind: 'VOTE',
    });
    await expect(handler.execute(command)).rejects.toThrow(
      VoteDocumentNotFoundException,
    );
    expect(documentRepository.deleteById).not.toHaveBeenCalled();
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('rejects a missing document', async () => {
    documentRepository.findById.mockResolvedValue(null);
    await expect(handler.execute(command)).rejects.toThrow(
      VoteDocumentNotFoundException,
    );
    expect(documentRepository.deleteById).not.toHaveBeenCalled();
  });

  it('rejects a document already linked to a recorded ballot', async () => {
    documentRepository.isAttachmentLinked.mockResolvedValue(true);
    await expect(handler.execute(command)).rejects.toThrow(
      VoteDocumentNotFoundException,
    );
    expect(documentRepository.deleteById).not.toHaveBeenCalled();
    expect(storage.delete).not.toHaveBeenCalled();
  });
});
