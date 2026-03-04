import { AxiosError } from "axios";

import { toast } from "@hoa-mngr/ui";

import i18n from "@/i18n";

/**
 * Extract the domain error code from an API error response.
 * Backend returns `{ code: "ERROR_CODE" }` for all DomainExceptions.
 */
export function getApiErrorCode(err: unknown): string | undefined {
    if (err instanceof AxiosError) {
        return (err.response?.data as { code?: string })?.code;
    }
    return undefined;
}

/**
 * Show a translated toast for an API error.
 * Looks up `errors:<CODE>` in the i18n resources.
 * Falls back to `errors:UNKNOWN` for unrecognised codes.
 */
export function showApiError(err: unknown): void {
    const code = getApiErrorCode(err) ?? "UNKNOWN";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = i18n.t(`errors:${code}` as any) as string;

    if (message === `errors:${code}`) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        toast.error(i18n.t("errors:UNKNOWN" as any) as string);
    } else {
        toast.error(message);
    }
}
