export const STORAGE_KEYS = {
    LAST_TENANT_ID: "svj.portal.v1.lastTenantId",
    POST_LOGIN_REDIRECT: "svj.portal.v1.postLoginRedirect",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
