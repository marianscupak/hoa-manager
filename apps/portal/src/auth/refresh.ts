import { getDefaultStore } from "jotai";

import { authControllerRefresh } from "@/api/generated/auth/auth";

import { accessTokenAtom } from "./atoms";

let refreshInFlight: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
    if (!refreshInFlight) {
        refreshInFlight = (async () => {
            try {
                const res = await authControllerRefresh();
                const token = res.accessToken;

                const store = getDefaultStore();
                store.set(accessTokenAtom, token);

                return token;
            } finally {
                refreshInFlight = null;
            }
        })();
    }
    return refreshInFlight;
}
