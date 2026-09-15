export const VOTE_DOCUMENT_MAX_SIZE_BYTES = 50 * 1024 * 1024;

export const VOTE_DOCUMENT_MAX_COUNT = 20;

export const VOTE_DOCUMENT_ALLOWED_CONTENT_TYPES: readonly string[] = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/webp',
];

/** A scan of one signed paper ballot. Tighter than the general vote-document
 *  limits: a phone photo or a scan, nothing else. */
export const BALLOT_SCAN_MAX_SIZE_BYTES = 20 * 1024 * 1024;

export const BALLOT_SCAN_ALLOWED_CONTENT_TYPES: readonly string[] = [
  'application/pdf',
  'image/png',
  'image/jpeg',
];
