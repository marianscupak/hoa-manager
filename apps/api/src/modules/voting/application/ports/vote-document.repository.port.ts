export type VoteDocumentStatus = 'PENDING' | 'UPLOADED';

export type VoteDocumentKind = 'VOTE' | 'BALLOT';

export interface VoteDocumentRecord {
  id: string;
  tenantId: string;
  voteId: string;
  uploadedByMembershipId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  objectKey: string;
  kind: VoteDocumentKind;
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
  /** Public vote attachments only — never ballot scans. */
  findByVoteId(tenantId: string, voteId: string): Promise<VoteDocumentRecord[]>;
  /** Counts public vote attachments only, so recorded ballots do not
   *  consume the per-vote document budget. */
  countByVoteId(tenantId: string, voteId: string): Promise<number>;
  markUploaded(tenantId: string, documentId: string): Promise<void>;
  deleteById(tenantId: string, documentId: string): Promise<void>;
  findStalePending(olderThan: Date): Promise<VoteDocumentRecord[]>;
  /** Whether a recorded ballot already points at this document. A linked
   *  attachment can neither be deleted nor reused for another ballot. */
  isAttachmentLinked(tenantId: string, documentId: string): Promise<boolean>;
}

export const VOTE_DOCUMENT_REPOSITORY = Symbol('VOTE_DOCUMENT_REPOSITORY');
