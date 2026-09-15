import Axios, {
    AxiosError,
    AxiosRequestConfig,
    InternalAxiosRequestConfig,
} from "axios";
import { getDefaultStore } from "jotai";

import {
    accessTokenAtom,
    authStatusAtom,
    tenantContextAtom,
    userAtom,
} from "@/auth/atoms";
import { refreshAccessToken } from "@/auth/refresh";
import { env } from "@/config/env";
import i18n from "@/i18n";
import { StorageService } from "@/storage/storage";

import { shouldAttemptRefresh } from "./refresh-policy";
import { ApiError } from "./types";

export const AXIOS_INSTANCE = Axios.create({
    baseURL: env.VITE_API_URL,
    withCredentials: true,
    // Serialize array params as repeated keys (`?k=a&k=b`) so NestJS
    // recognizes them as arrays. Default axios behavior emits `?k[]=a&k[]=b`
    // which Nest does not parse.
    paramsSerializer: { indexes: null },
});

AXIOS_INSTANCE.interceptors.request.use((config) => {
    const store = getDefaultStore();
    const token = store.get(accessTokenAtom);
    if (config.headers) {
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        config.headers["Accept-Language"] = i18n.language;
    }
    return config;
});

AXIOS_INSTANCE.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        if (error.response?.status === 401) {
            // Prevent infinite refresh loops if the refresh itself fails
            if (originalRequest.url?.includes("/api/auth/refresh")) {
                const store = getDefaultStore();
                store.set(accessTokenAtom, null);
                store.set(authStatusAtom, "anonymous");
                store.set(tenantContextAtom, null);
                store.set(userAtom, null);
                StorageService.clearAuthHints();

                return Promise.reject(error);
            }

            // Credentials were rejected, not a token — retrying behind a
            // refresh would swap the real error for the refresh endpoint's
            // own UNAUTHORIZED before the caller ever sees it.
            if (!shouldAttemptRefresh(originalRequest.url)) {
                return Promise.reject(error);
            }

            if (!originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    const newToken = await refreshAccessToken();
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    }
                    return AXIOS_INSTANCE(originalRequest);
                } catch (refreshError) {
                    const store = getDefaultStore();
                    store.set(accessTokenAtom, null);
                    store.set(authStatusAtom, "anonymous");
                    store.set(tenantContextAtom, null);
                    store.set(userAtom, null);
                    StorageService.clearAuthHints();

                    return Promise.reject(refreshError);
                }
            }
        }
        return Promise.reject(error);
    },
);

export const customInstance = <T>(
    config: AxiosRequestConfig,
    options?: AxiosRequestConfig,
): Promise<T> => {
    return AXIOS_INSTANCE({
        ...config,
        ...options,
    }).then(({ data }) => data);
};

export type ErrorType<_> = AxiosError<ApiError>;
export type BodyType<BodyData> = BodyData;
