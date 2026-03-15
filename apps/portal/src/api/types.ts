export interface ApiError {
    code: string;
    message?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details?: any;
}
