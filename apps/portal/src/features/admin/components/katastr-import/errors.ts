import type { KatastrImportPreviewResponseDto } from "@/api/generated/model";

import { messageKeyFor, type KatastrCoded } from "./messages";

/**
 * A `FileDropzone` rejection (see `FileRejection` in `@hoa-mngr/ui`),
 * wrapped so it can sit in the same `previewError` state as a real API
 * error and render through the same error box. Its copy lives under
 * `katastr:dropzone.rejected.*`, not `katastr:errors.*` — these reasons are
 * never returned by the API (the dropzone rejects a file before an upload
 * ever starts), so they must not be added to `KATASTR_ERROR_CODES`, which
 * is asserted 1:1 against the API's checked-in
 * `katastr-error-codes.json` (see messages.test.ts).
 */
export interface DropzoneRejectionError {
    dropzoneRejection: "type" | "size";
}

export function isDropzoneRejectionError(
    error: unknown,
): error is DropzoneRejectionError {
    return (
        typeof error === "object" &&
        error !== null &&
        "dropzoneRejection" in error
    );
}

/** Literal i18next keys per rejection reason — a `t(\`...${reason}\`)`
 *  template key would work identically, but this keeps every key statically
 *  visible to i18next's own tooling and to a reader of this file. */
export const DROPZONE_REJECTION_KEY = {
    type: "dropzone.rejected.type",
    size: "dropzone.rejected.size",
} as const satisfies Record<
    DropzoneRejectionError["dropzoneRejection"],
    string
>;

/**
 * The API error bodies this renderer has to make sense of. `errors` comes
 * from `KATASTR_FILE_REJECTED` (the parser's own coded errors, preview and
 * apply both throw it); `blockers` comes from `KATASTR_IMPORT_BLOCKED`
 * (apply only, thrown when the plan's blockers are still present at
 * confirm time); a bare `code` with neither array is `FILE_REQUIRED`,
 * `FILE_TOO_LARGE`, or `UNEXPECTED_FILE`. The same shape, and the same
 * renderer, serves both the preview call and (Task 10's) apply call.
 * `preview` is `KATASTR_IMPORT_PLAN_STALE`'s (409) own field: the register
 * moved, or the file or date changed, so the body carries a complete fresh
 * plan instead of coded items.
 */
export interface KatastrErrorBody {
    code?: string;
    errors?: KatastrCoded[];
    blockers?: KatastrCoded[];
    preview?: KatastrImportPreviewResponseDto;
}

/**
 * Pulls the fresh plan out of a `KATASTR_IMPORT_PLAN_STALE` body, the one
 * apply-time outcome that isn't a list of coded items to translate but a
 * complete replacement preview. Anything else — a different code, a 409
 * with no `preview` for some reason — yields `null`, so the caller falls
 * through to its ordinary error handling instead of assuming the shape.
 */
export function stalePreviewFrom(
    body: KatastrErrorBody | undefined,
): KatastrImportPreviewResponseDto | null {
    return body?.code === "KATASTR_IMPORT_PLAN_STALE" && body.preview
        ? body.preview
        : null;
}

/**
 * Pulls the coded items out of an API error body, whichever of the shapes
 * above it arrived in. A body with none of them — a 500, a guard rejection
 * with no `code`, a network failure with no response at all — yields no
 * items; the caller falls back to a generic message in that case rather
 * than showing nothing.
 */
export function extractKatastrErrorItems(
    body: KatastrErrorBody | undefined,
): KatastrCoded[] {
    if (body?.errors) return body.errors;
    if (body?.blockers) return body.blockers;
    if (body?.code) return [{ code: body.code, ...body }];
    return [];
}

/** A plain stand-in for react-i18next's `t`, loose enough for a dynamic key
 *  and easy to fake in a test without pulling in i18next itself. */
export type Translate = (
    key: string,
    options?: Record<string, unknown>,
) => string;

/**
 * A code this catalogue does not know about — a future HTTP outcome, a
 * guard rejection, anything not in `KATASTR_ERROR_CODES` or
 * `KATASTR_BLOCKER_CODES` — must still read as a sentence, not as
 * `katastr:errors.WHATEVER` or `katastr:blockers.WHATEVER`. Mirrors the
 * fallback `api/error-utils.ts` already uses: an unresolved key comes back
 * from i18next unchanged, so comparing the result to the key detects the
 * miss. Vars are taken separately from the code rather than assumed to be
 * "the item itself" — `blockers.tsx` needs to interpolate `blockerVars`'
 * array-stripped, date-localized output, not the raw blocker object.
 */
export function translateCoded(
    t: Translate,
    kind: "errors" | "blockers",
    code: string,
    vars: Record<string, unknown>,
): string {
    const key = messageKeyFor(kind, code);
    const message = t(key, vars);
    return message === key ? t("errors:UNKNOWN") : message;
}

/** `translateCoded` for the simpler "errors" case, where the raw item is
 *  already fit to interpolate as-is. */
export function translateKatastrError(
    t: Translate,
    item: KatastrCoded,
): string {
    return translateCoded(t, "errors", item.code, item);
}

/**
 * The full pipeline from an Axios error's response body to the sentences an
 * admin should read: extract, then translate every item, falling back to
 * one generic message when there was nothing to extract at all. This is
 * the one place that decides whether a code reaches the admin as copy or
 * as itself — see the module doc for why that decision needs its own test.
 */
export function katastrErrorMessages(
    t: Translate,
    body: KatastrErrorBody | undefined,
): string[] {
    const items = extractKatastrErrorItems(body);
    return items.length > 0
        ? items.map((item) => translateKatastrError(t, item))
        : [t("errors:UNKNOWN")];
}
