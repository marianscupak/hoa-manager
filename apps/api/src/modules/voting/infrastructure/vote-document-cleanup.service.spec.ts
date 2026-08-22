import { type DocumentStoragePort } from '@/modules/voting/application/ports/document-storage.port';
import {
  type VoteDocumentRecord,
  type VoteDocumentRepository,
} from '@/modules/voting/application/ports/vote-document.repository.port';
import { type Clock } from '@/shared/application/ports/clock.port';

import { VoteDocumentCleanupService } from './vote-document-cleanup.service';

const NOW = new Date('2026-08-22T12:00:00Z');

const STALE_DOC = {
  id: 'doc-1',
  tenantId: 'tenant-1',
  voteId: 'vote-1',
  objectKey: 'tenants/tenant-1/votes/vote-1/doc-1',
  status: 'PENDING',
} as unknown as VoteDocumentRecord;

describe('VoteDocumentCleanupService', () => {
  let documentRepository: jest.Mocked<VoteDocumentRepository>;
  let storage: jest.Mocked<DocumentStoragePort>;
  let service: VoteDocumentCleanupService;

  beforeEach(() => {
    documentRepository = {
      findStalePending: jest.fn().mockResolvedValue([STALE_DOC]),
      deleteById: jest.fn(),
    } as unknown as jest.Mocked<VoteDocumentRepository>;
    storage = {
      isConfigured: jest.fn().mockReturnValue(true),
      delete: jest.fn(),
    } as unknown as jest.Mocked<DocumentStoragePort>;
    const clock: Clock = { now: () => NOW };
    service = new VoteDocumentCleanupService(
      documentRepository,
      storage,
      clock,
    );
  });

  it('queries with a 24h cutoff and deletes object + row', async () => {
    await service.handleCron();
    expect(documentRepository.findStalePending).toHaveBeenCalledWith(
      new Date('2026-08-21T12:00:00Z'),
    );
    expect(storage.delete).toHaveBeenCalledWith(STALE_DOC.objectKey);
    expect(documentRepository.deleteById).toHaveBeenCalledWith(
      'tenant-1',
      'doc-1',
    );
  });

  it('still deletes the row when the object delete fails', async () => {
    storage.delete.mockRejectedValue(new Error('r2 down'));
    await service.handleCron();
    expect(documentRepository.deleteById).toHaveBeenCalledWith(
      'tenant-1',
      'doc-1',
    );
  });

  it('deletes rows without touching storage when unconfigured', async () => {
    storage.isConfigured.mockReturnValue(false);
    await service.handleCron();
    expect(storage.delete).not.toHaveBeenCalled();
    expect(documentRepository.deleteById).toHaveBeenCalled();
  });

  it('does nothing when there are no stale documents', async () => {
    documentRepository.findStalePending.mockResolvedValue([]);
    await service.handleCron();
    expect(documentRepository.deleteById).not.toHaveBeenCalled();
  });
});
