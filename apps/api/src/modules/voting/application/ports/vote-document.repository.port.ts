export type VoteDocumentStatus = 'PENDING' | 'UPLOADED';

export interface VoteDocumentRecord {
  id: string;
  tenantId: string;
  voteId: string;
  uploadedByMembershipId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  objectKey: string;
  status: VoteDocumentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface VoteDocumentRepository {
  insert(
    record: Omit<VoteDocumentRecord, 'createdAt' | 'updatedAt'>,
  ): Promise<void>;
  findById(
    tenantId: string,
    voteId: string,
    documentId: string,
  ): Promise<VoteDocumentRecord | null>;
  findByVoteId(tenantId: string, voteId: string): Promise<VoteDocumentRecord[]>;
  countByVoteId(tenantId: string, voteId: string): Promise<number>;
  markUploaded(tenantId: string, documentId: string): Promise<void>;
  deleteById(tenantId: string, documentId: string): Promise<void>;
  findStalePending(olderThan: Date): Promise<VoteDocumentRecord[]>;
}

export const VOTE_DOCUMENT_REPOSITORY = Symbol('VOTE_DOCUMENT_REPOSITORY');
