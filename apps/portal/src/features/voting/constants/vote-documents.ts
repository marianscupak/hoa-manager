export const VOTE_DOCUMENT_MAX_SIZE_BYTES = 50 * 1024 * 1024;

export const VOTE_DOCUMENT_MAX_COUNT = 20;

export const VOTE_DOCUMENT_ALLOWED_CONTENT_TYPES: readonly string[] = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/png",
    "image/jpeg",
    "image/webp",
];
