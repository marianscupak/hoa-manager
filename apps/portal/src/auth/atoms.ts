import { atom } from "jotai";

import { Role } from "./roles";

export type AuthStatus =
    | "initializing"
    | "anonymous"
    | "select-tenant"
    | "authenticated";

export type TenantCtx = {
    tenantId: string;
    membershipId: string;
    roles: Role[];
};

export type UserSummary = {
    userId: string;
    email?: string;
    fullName?: string;
    preferredLanguage?: string;
};

// Access token is memory-only
export const accessTokenAtom = atom<string | null>(null);

export const authStatusAtom = atom<AuthStatus>("initializing");

// Tenant context, populated only when a tenant-scoped token is active
export const tenantContextAtom = atom<TenantCtx | null>(null);

export const userAtom = atom<UserSummary | null>(null);
