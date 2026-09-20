import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger as WinstonLogger } from 'winston';

import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';

import {
  DOCUMENT_STORAGE,
  type DocumentStoragePort,
} from '../application/ports/document-storage.port';
import {
  VOTE_DOCUMENT_REPOSITORY,
  type VoteDocumentRepository,
} from '../application/ports/vote-document.repository.port';

const PENDING_MAX_AGE_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class VoteDocumentCleanupService {
  constructor(
    @Inject(VOTE_DOCUMENT_REPOSITORY)
    private readonly documentRepository: VoteDocumentRepository,
    @Inject(DOCUMENT_STORAGE)
    private readonly storage: DocumentStoragePort,
    @Inject(CLOCK)
    private readonly clock: Clock,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron(): Promise<void> {
    const cutoff = new Date(this.clock.now().getTime() - PENDING_MAX_AGE_MS);
    const stale = await this.documentRepository.findStalePending(cutoff);
    if (stale.length === 0) {
      return;
    }

    this.logger.info('StalePendingDocumentsFound', { count: stale.length });

    for (const document of stale) {
      if (this.storage.isConfigured()) {
        try {
          await this.storage.delete(document.objectKey);
        } catch (error: unknown) {
          this.logger.warn('R2ObjectDeleteFailed', {
            operation: 'vote-document-cleanup',
            objectKey: document.objectKey,
            tenantId: document.tenantId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      await this.documentRepository.deleteById(document.tenantId, document.id);
    }
  }
}
