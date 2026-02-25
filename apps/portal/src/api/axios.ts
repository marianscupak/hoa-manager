import Axios, { AxiosError, AxiosRequestConfig } from "axios";

import { env } from "@/config/env";

export const AXIOS_INSTANCE = Axios.create({
    baseURL: env.VITE_API_URL,
});

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
