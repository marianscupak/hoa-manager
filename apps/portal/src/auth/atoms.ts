import { atom } from "jotai";

export type AuthStatus =
    | "initializing"
    | "anonymous"
    | "select-tenant"
    | "authenticated";

export type TenantCtx = {
    tenantId: string;
    membershipId: string;
    roles: string[];
};

export type UserSummary = {
    userId: string;
    email?: string;
    fullName?: string;
};

// Access token is memory-only
export const accessTokenAtom = atom<string | null>(null);

// Auth status tracks the current phase of authentication
export const authStatusAtom = atom<AuthStatus>("initializing");

// Tenant context, populated only when a tenant-scoped token is active
export const tenantContextAtom = atom<TenantCtx | null>(null);

// Basic user info
export const userAtom = atom<UserSummary | null>(null);
