import { Injectable } from '@nestjs/common';
import { and, count, eq, lt } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import { ballots, voteDocuments } from '@/infrastructure/db/schema';

import {
  type VoteDocumentKind,
  type VoteDocumentRecord,
  type VoteDocumentRepository,
  type VoteDocumentStatus,
} from '../../application/ports/vote-document.repository.port';

@Injectable()
export class DrizzleVoteDocumentRepository implements VoteDocumentRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return (DRIZZLE_TX_STORAGE.getStore() ??
      this.drizzle.db) as typeof this.drizzle.db;
  }

  async insert(
    record: Omit<VoteDocumentRecord, 'createdAt' | 'updatedAt'>,
  ): Promise<void> {
    await this.db.insert(voteDocuments).values(record);
  }

  async findById(
    tenantId: string,
    voteId: string,
    documentId: string,
  ): Promise<VoteDocumentRecord | null> {
    const rows = await this.db
      .select()
      .from(voteDocuments)
      .where(
        and(
          eq(voteDocuments.tenantId, tenantId),
          eq(voteDocuments.voteId, voteId),
          eq(voteDocuments.id, documentId),
        ),
      )
      .limit(1);
    return rows.length > 0 ? mapRow(rows[0]) : null;
  }

  async findByVoteId(
    tenantId: string,
    voteId: string,
  ): Promise<VoteDocumentRecord[]> {
    const rows = await this.db
      .select()
      .from(voteDocuments)
      .where(
        and(
          eq(voteDocuments.tenantId, tenantId),
          eq(voteDocuments.voteId, voteId),
          eq(voteDocuments.kind, 'VOTE'),
        ),
      )
      .orderBy(voteDocuments.createdAt);
    return rows.map(mapRow);
  }

  async countByVoteId(tenantId: string, voteId: string): Promise<number> {
    const rows = await this.db
      .select({ value: count() })
      .from(voteDocuments)
      .where(
        and(
          eq(voteDocuments.tenantId, tenantId),
          eq(voteDocuments.voteId, voteId),
          eq(voteDocuments.kind, 'VOTE'),
        ),
      );
    return rows[0]?.value ?? 0;
  }

  async markUploaded(tenantId: string, documentId: string): Promise<void> {
    await this.db
      .update(voteDocuments)
      .set({ status: 'UPLOADED' })
      .where(
        and(
          eq(voteDocuments.tenantId, tenantId),
          eq(voteDocuments.id, documentId),
        ),
      );
  }

  async deleteById(tenantId: string, documentId: string): Promise<void> {
    await this.db
      .delete(voteDocuments)
      .where(
        and(
          eq(voteDocuments.tenantId, tenantId),
          eq(voteDocuments.id, documentId),
        ),
      );
  }

  async findStalePending(olderThan: Date): Promise<VoteDocumentRecord[]> {
    const rows = await this.db
      .select()
      .from(voteDocuments)
      .where(
        and(
          eq(voteDocuments.status, 'PENDING'),
          lt(voteDocuments.createdAt, olderThan),
        ),
      );
    return rows.map(mapRow);
  }

  async isAttachmentLinked(
    tenantId: string,
    documentId: string,
  ): Promise<boolean> {
    const rows = await this.db
      .select({ value: count() })
      .from(ballots)
      .where(
        and(
          eq(ballots.tenantId, tenantId),
          eq(ballots.attachmentDocumentId, documentId),
        ),
      );
    return (rows[0]?.value ?? 0) > 0;
  }
}

function mapRow(row: typeof voteDocuments.$inferSelect): VoteDocumentRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    voteId: row.voteId,
    uploadedByMembershipId: row.uploadedByMembershipId,
    fileName: row.fileName,
    contentType: row.contentType,
    sizeBytes: row.sizeBytes,
    objectKey: row.objectKey,
    kind: row.kind as VoteDocumentKind,
    status: row.status as VoteDocumentStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
