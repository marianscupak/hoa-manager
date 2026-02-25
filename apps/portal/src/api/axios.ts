import Axios, { AxiosError, AxiosRequestConfig } from "axios";

import { env } from "@/config/env";

export const AXIOS_INSTANCE = Axios.create({
    baseURL: env.VITE_API_URL,
});

AXIOS_INSTANCE.interceptors.request.use((config) => {
    const token = localStorage.getItem("auth_token");
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

AXIOS_INSTANCE.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Auto logout if 401 Unauthorized returned from API
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");

            // Only redirect if we aren't already on the login page
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
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

export type ErrorType<Error> = AxiosError<Error>;
export type BodyType<BodyData> = BodyData;
