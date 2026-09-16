import { AxiosError } from "axios";
import { format, isValid, parseISO } from "date-fns";

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
 * The value a parametrised message has a placeholder for.
 *
 * The API answers with `{ code, details: [{ code, param }] }` and the toast
 * renders one message, keyed by the top-level code — so the value it needs is
 * the one belonging to that same code. Schedule validation answers with a
 * whole list of findings, and picking a neighbour's value out of it would put
 * the wrong number in the sentence.
 */
export function getApiErrorParam(err: unknown): string | undefined {
    if (!(err instanceof AxiosError)) return undefined;
    const data = err.response?.data as
        | { code?: string; details?: { code?: string; param?: string }[] }
        | undefined;
    return data?.details?.find((d) => d.code === data.code)?.param;
}

const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The value as the sentence should read it.
 *
 * The API states calendar dates as YYYY-MM-DD (`formatAssociationDate`), which
 * is not how a Czech sentence writes one. The renderer cannot know what a
 * given value means, but that shape is unambiguous — shares, counts and names
 * never look like it — so it is written the way every other date in the app
 * is. Anything else is passed through untouched.
 */
export function formatErrorParam(
    param: string | undefined,
): string | undefined {
    if (!param || !CALENDAR_DATE.test(param)) return param;
    const date = parseISO(param);
    return isValid(date) ? format(date, "d. M. yyyy") : param;
}

/**
 * Show a translated toast for an API error.
 * Looks up `errors:<CODE>` in the i18n resources.
 * Falls back to `errors:UNKNOWN` for unrecognised codes.
 */
export function showApiError(err: unknown): void {
    const code = getApiErrorCode(err) ?? "UNKNOWN";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = i18n.t(`errors:${code}` as any, {
        param: formatErrorParam(getApiErrorParam(err)),
    }) as string;

    // Longer than the global default: an API error usually names something the
    // user has to go and change, so it has to survive being read twice.
    const options = { duration: 10_000 };

    if (message === `errors:${code}`) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        toast.error(i18n.t("errors:UNKNOWN" as any) as string, options);
    } else {
        toast.error(message, options);
    }
}
