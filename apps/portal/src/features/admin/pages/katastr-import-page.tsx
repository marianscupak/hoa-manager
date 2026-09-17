import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { format, parse } from "date-fns";
import { useAtomValue } from "jotai";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import {
    Button,
    DatePicker,
    ErrorState,
    FileDropzone,
    StatusChip,
    type FileRejection,
} from "@hoa-mngr/ui";

import type {
    KatastrImportPreviewResponseDto,
    KatastrImportResultResponseDto,
} from "@/api/generated/model";
import { applyKatastrImport, previewKatastrImport } from "@/api/katastr-import";
import { tenantContextAtom } from "@/auth/atoms";
import { Role } from "@/auth/roles";

import { Blockers } from "../components/katastr-import/blockers";
import {
    KATASTR_IMPORT_ACCEPTED_CONTENT_TYPES,
    KATASTR_IMPORT_MAX_SIZE_BYTES,
} from "../components/katastr-import/constants";
import {
    DROPZONE_REJECTION_KEY,
    isDropzoneRejectionError,
    katastrErrorMessages,
    stalePreviewFrom,
    type KatastrErrorBody,
    type Translate,
} from "../components/katastr-import/errors";
import { ImportDiffTable } from "../components/katastr-import/import-diff-table";
import { invalidateKatastrImportQueries } from "../components/katastr-import/invalidate-import-queries";
import {
    hasNothingToDo,
    messageKeyFor,
} from "../components/katastr-import/messages";

type PreviewOwner = KatastrImportPreviewResponseDto["owners"][number];

/** The trigger is a button, so the caption points at it by id rather than wrapping it. */
const EFFECTIVE_AT_LABEL_ID = "katastr-effective-at-label";

export function KatastrImportPage() {
    const { t } = useTranslation("katastr");
    const tenantCtx = useAtomValue(tenantContextAtom);
    const queryClient = useQueryClient();
    const [file, setFile] = useState<File | null>(null);
    const [effectiveAt, setEffectiveAt] = useState<string | null>(null);
    const [preview, setPreview] =
        useState<KatastrImportPreviewResponseDto | null>(null);
    const [previewError, setPreviewError] = useState<unknown>(null);
    const [result, setResult] = useState<KatastrImportResultResponseDto | null>(
        null,
    );
    const [applyError, setApplyError] = useState<unknown>(null);

    // Identifies the most recently dispatched preview request. Two dates
    // picked in quick succession can have their responses arrive out of
    // order on any real network — without this, the earlier one's response
    // landing last would silently overwrite `preview` and the date field
    // with data for a date the admin already moved past (Finding 1).
    // Comparing by reference to the exact object handed to `mutate` is
    // enough: every call to `runPreview` creates a fresh one.
    const latestRequestRef = useRef<{
        file: File;
        effectiveAt: string | null;
    } | null>(null);

    // Identifies which request produced the preview currently on screen.
    // This is the thing Confirm actually needs to know — not "is a preview
    // pending" (a naive check on `previewMutation.isPending` re-enables
    // Confirm the moment a *failed* re-preview stops being pending, even
    // though `preview`/`planHash` still describe the old inputs and
    // `effectiveAt` already reads the new ones) but "does the plan on
    // screen still describe the current inputs." Set only on a genuine,
    // still-latest preview success (never on error, never eagerly in
    // `runPreview`), so it naturally lags `latestRequestRef` — and stays
    // lagged, not just momentarily pending — for exactly as long as the
    // displayed plan is out of date with the current file/date.
    const previewRequestRef = useRef<{
        file: File;
        effectiveAt: string | null;
    } | null>(null);
    const previewIsCurrent =
        preview !== null &&
        previewRequestRef.current === latestRequestRef.current;

    const previewMutation = useMutation({
        mutationFn: (input: { file: File; effectiveAt: string | null }) =>
            previewKatastrImport(input.file, input.effectiveAt),
        onSuccess: (result, variables) => {
            if (variables !== latestRequestRef.current) return;
            setPreviewError(null);
            setPreview(result);
            // The API already hands back a YYYY-MM-DD calendar day (see
            // toPreviewResponse), which is exactly what the date input
            // wants — no reduction needed here.
            setEffectiveAt(result.effectiveAt);
            previewRequestRef.current = variables;
        },
        onError: (error, variables) => {
            if (variables !== latestRequestRef.current) return;
            setPreviewError(error);
        },
    });

    const runPreview = (nextEffectiveAt: string | null) => {
        if (file === null) return;
        const request = { file, effectiveAt: nextEffectiveAt };
        latestRequestRef.current = request;
        setPreviewError(null);
        // A fresh preview attempt makes any apply-time error (a stale
        // note, a re-surfaced blocker) moot — it referred to a plan the
        // admin is about to replace.
        setApplyError(null);
        previewMutation.mutate(request);
    };

    // Confirming writes real data, so its own error handling gets a
    // careful look. Its 409 (KATASTR_IMPORT_PLAN_STALE) path calls
    // `setPreview` with a fresh plan from the server — and now that
    // Confirm can only be clicked while `previewIsCurrent` is true (see
    // below), and the file/date inputs are locked for the whole time an
    // apply is in flight (so nothing can advance `latestRequestRef` behind
    // its back), that fresh plan necessarily describes exactly what the
    // admin was looking at when they clicked Confirm. There is no longer a
    // narrower, still-in-flight preview request that could supersede it,
    // so the fresh plan is applied unconditionally rather than guarded
    // against one.
    const applyMutation = useMutation({
        mutationFn: (input: {
            file: File;
            effectiveAt: string;
            planHash: string;
        }) => applyKatastrImport(input.file, input.effectiveAt, input.planHash),
        onSuccess: (r) => {
            setApplyError(null);
            setResult(r);
            setPreview(null);
            // The import can create/update any number of units and owners,
            // change the property's building-share total, and always writes
            // an audit event — exactly the data the admin lands on next
            // (the units/owners list, or the timeline that showed them
            // nothing had happened).
            invalidateKatastrImportQueries(queryClient);
        },
        onError: (error: unknown) => {
            const body =
                error instanceof AxiosError
                    ? (error.response?.data as KatastrErrorBody | undefined)
                    : undefined;
            const fresh = stalePreviewFrom(body);
            if (fresh !== null) {
                setPreview(fresh);
                setEffectiveAt(fresh.effectiveAt);
                // Re-affirms `previewIsCurrent`. Under the input lock above
                // this is provably already true, but it costs nothing to
                // keep the invariant self-consistent rather than relying
                // on that lock never being loosened later.
                previewRequestRef.current = latestRequestRef.current;
            }
            setApplyError(error);
        },
    });

    // This bulk write is hard to unwind, so it follows the ADMIN-only
    // precedent the endpoint itself enforces (@Roles(ADMIN), stricter than
    // the admin-or-board shell every other /admin route uses). The shared
    // route guard lets a board member reach this URL, so the page must
    // refuse on its own rather than showing a form the API will 403.
    const isAdmin = !!tenantCtx?.roles.includes(Role.ADMIN);
    if (!isAdmin) {
        return <ErrorState message={t("adminOnly")} />;
    }

    if (result !== null) {
        return <ImportDone result={result} />;
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-xl font-semibold">{t("title")}</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                    {t("intro")}
                </p>
            </div>

            <div className="flex flex-col gap-3">
                <FileDropzone
                    accept={KATASTR_IMPORT_ACCEPTED_CONTENT_TYPES}
                    maxSizeBytes={KATASTR_IMPORT_MAX_SIZE_BYTES}
                    // Locked for the same reason the date input below is:
                    // while an apply is in flight, nothing may advance
                    // `latestRequestRef`, or its 409 path's unconditional
                    // `setPreview` could silently overwrite whatever the
                    // admin has moved on to in the meantime.
                    disabled={
                        previewMutation.isPending || applyMutation.isPending
                    }
                    onFiles={([selected]) => {
                        setPreview(null);
                        setPreviewError(null);
                        setApplyError(null);
                        setFile(selected);
                    }}
                    onReject={({ reason }: FileRejection) =>
                        setPreviewError({ dropzoneRejection: reason })
                    }
                    label={t("dropzone.label")}
                    hint={t("dropzone.hint")}
                />
                {file !== null && (
                    <p className="text-muted-foreground text-sm">{file.name}</p>
                )}
                <Button
                    className="w-fit cursor-pointer"
                    disabled={
                        file === null ||
                        previewMutation.isPending ||
                        applyMutation.isPending
                    }
                    onClick={() => runPreview(null)}
                >
                    {t("analyze")}
                </Button>
            </div>

            {previewError !== null && <ImportErrors error={previewError} />}

            {preview !== null && (
                <>
                    <DocumentSummary preview={preview} />

                    <div className="flex flex-col gap-1 text-sm">
                        <span id={EFFECTIVE_AT_LABEL_ID}>
                            {t("effectiveAt.label")}
                        </span>
                        <DatePicker
                            className="w-44"
                            aria-labelledby={EFFECTIVE_AT_LABEL_ID}
                            // The state is the API's `YYYY-MM-DD` calendar
                            // day; `parse` reads it in local time, where
                            // `new Date(string)` would read it as UTC
                            // midnight and can land on the day before.
                            value={
                                effectiveAt
                                    ? parse(
                                          effectiveAt,
                                          "yyyy-MM-dd",
                                          new Date(),
                                      )
                                    : null
                            }
                            // The admin cannot pick a second date while the
                            // first one's preview is still in flight, nor
                            // while an apply is in flight — the latter
                            // keeps `latestRequestRef` from moving behind
                            // an in-flight apply's back, which is what
                            // lets its 409 path apply a fresh plan
                            // unconditionally (see `applyMutation` above).
                            disabled={
                                previewMutation.isPending ||
                                applyMutation.isPending
                            }
                            onChange={(day) => {
                                const value = day
                                    ? format(day, "yyyy-MM-dd")
                                    : null;
                                setEffectiveAt(value);
                                // Clearing the day leaves nothing to
                                // preview for. Re-preview with none rather
                                // than leaving the old preview on screen
                                // for a date that is no longer selected —
                                // the API falls back to its own default
                                // (ct:platnost), which then repopulates
                                // this field once the response lands
                                // (Finding 4).
                                runPreview(value);
                            }}
                        />
                        <span className="text-muted-foreground">
                            {t("effectiveAt.hint")}
                        </span>
                    </div>

                    <Counts preview={preview} />
                    <ImportDiffTable preview={preview} />
                    <OwnerMatches preview={preview} />
                    <Warnings preview={preview} />
                    <Blockers blockers={preview.blockers} />
                    <ApplyErrorNotice error={applyError} />

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="cursor-pointer"
                            // Completes the same lock the file/date inputs
                            // and "Show preview" have: without it, Cancel
                            // could clear `preview`/`file` while an apply
                            // is still in flight, without touching either
                            // ref — so a 409 landing afterward would still
                            // apply unconditionally and resurrect the
                            // panel Cancel just dismissed.
                            disabled={
                                previewMutation.isPending ||
                                applyMutation.isPending
                            }
                            onClick={() => {
                                setPreview(null);
                                setFile(null);
                                setApplyError(null);
                            }}
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            className="cursor-pointer"
                            disabled={
                                preview.blockers.length > 0 ||
                                file === null ||
                                effectiveAt === null ||
                                // The plan on screen must still describe
                                // the current file/date. A pending
                                // re-preview fails this (as before), but so
                                // does one that just *failed* — its error
                                // never updates `previewRequestRef`, so a
                                // naive "not pending" check would have
                                // re-enabled Confirm for a plan that no
                                // longer matches the visible `effectiveAt`.
                                !previewIsCurrent ||
                                applyMutation.isPending
                            }
                            onClick={() => {
                                if (file === null || effectiveAt === null) {
                                    return;
                                }
                                applyMutation.mutate({
                                    file,
                                    effectiveAt,
                                    planHash: preview.planHash,
                                });
                            }}
                        >
                            {t("confirm")}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}

function ImportDone({ result }: { result: KatastrImportResultResponseDto }) {
    const { t } = useTranslation("katastr");

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-xl font-semibold">{t("done.heading")}</h1>
            <p className="text-muted-foreground max-w-2xl text-sm">
                {t("done.summary", {
                    created: result.counts.unitsCreated,
                    updated: result.counts.unitsUpdated,
                })}
            </p>
            <Button className="w-fit cursor-pointer" asChild>
                <Link to="/units">{t("done.backToUnits")}</Link>
            </Button>
        </div>
    );
}

/**
 * Apply-time failures need a different treatment per shape: the 409 has
 * already swapped in a fresh plan, so it gets its own explanatory note
 * rather than an error list; a 422's `blockers` are `blockers.*` catalogue
 * keys, so they render through `Blockers`, not `ImportErrors` (whose
 * `errors.*` lookup would miss and fall back to a generic message); anything
 * else falls through to the same rendering the preview call uses.
 */
function ApplyErrorNotice({ error }: { error: unknown }) {
    const { t } = useTranslation("katastr");
    if (error === null) return null;

    const body =
        error instanceof AxiosError
            ? (error.response?.data as KatastrErrorBody | undefined)
            : undefined;

    if (stalePreviewFrom(body) !== null) {
        return <p className="text-warning-deep text-sm">{t("errors.STALE")}</p>;
    }
    if (body?.blockers) {
        return <Blockers blockers={body.blockers} />;
    }
    return <ImportErrors error={error} />;
}

function DocumentSummary({
    preview,
}: {
    preview: KatastrImportPreviewResponseDto;
}) {
    const { t } = useTranslation("katastr");
    const { document } = preview;
    const formatDate = (iso: string) => format(new Date(iso), "d. M. yyyy");

    const fields: { label: string; value: string }[] = [
        { label: t("document.lv"), value: document.lvNumber },
        { label: t("document.municipality"), value: document.municipality },
        { label: t("document.area"), value: document.cadastralArea },
        { label: t("document.validAt"), value: formatDate(document.validAt) },
        {
            label: t("document.issuedAt"),
            value: formatDate(document.issuedAt),
        },
    ];

    return (
        <div className="rounded-panel border-border bg-card border p-4">
            <h2 className="text-sm font-semibold">{t("document.heading")}</h2>
            <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                {fields.map((field) => (
                    <div key={field.label}>
                        <dt className="text-muted-foreground">{field.label}</dt>
                        <dd className="font-medium">{field.value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

function Counts({ preview }: { preview: KatastrImportPreviewResponseDto }) {
    const { t } = useTranslation("katastr");
    const { counts } = preview;

    if (hasNothingToDo(counts)) {
        return (
            <p className="text-muted-foreground text-sm">
                {t("counts.nothingToDo")}
            </p>
        );
    }

    const items = [
        counts.unitsCreated > 0 &&
            t("counts.unitsCreated", { count: counts.unitsCreated }),
        counts.unitsUpdated > 0 &&
            t("counts.unitsUpdated", { count: counts.unitsUpdated }),
        counts.unitsUnchanged > 0 &&
            t("counts.unitsUnchanged", { count: counts.unitsUnchanged }),
        counts.ownersCreated > 0 &&
            t("counts.ownersCreated", { count: counts.ownersCreated }),
        counts.ownersMatched > 0 &&
            t("counts.ownersMatched", { count: counts.ownersMatched }),
    ].filter((item) => item !== false) as string[];

    return (
        <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {items.map((item) => (
                <li key={item}>{item}</li>
            ))}
        </ul>
    );
}

const OWNER_MATCH_LABEL_KEY = {
    CREATE: "owners.create",
    MATCHED_BY_KATASTR_ID: "owners.byKatastrId",
    MATCHED_BY_ICO: "owners.byIco",
    MATCHED_BY_NAME: "owners.byName",
} as const satisfies Record<PreviewOwner["action"], string>;

function OwnerMatches({
    preview,
}: {
    preview: KatastrImportPreviewResponseDto;
}) {
    const { t } = useTranslation("katastr");
    const { owners } = preview;
    const hasNameMatch = owners.some(
        (owner) => owner.action === "MATCHED_BY_NAME",
    );

    return (
        <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">{t("owners.heading")}</h2>
            {hasNameMatch && (
                <p className="text-warning-deep text-sm">
                    {t("owners.checkNameMatches")}
                </p>
            )}
            <ul className="flex flex-col gap-1.5 text-sm">
                {owners.map((owner, index) => (
                    <li
                        key={`${owner.displayName}-${index}`}
                        className="flex flex-wrap items-center gap-2"
                    >
                        <span className="font-medium">{owner.displayName}</span>
                        <StatusChip
                            variant={
                                owner.action === "CREATE"
                                    ? "success"
                                    : "neutral"
                            }
                            dot={false}
                        >
                            {t(OWNER_MATCH_LABEL_KEY[owner.action])}
                        </StatusChip>
                        {owner.action !== "CREATE" && (
                            <>
                                {owner.existingDisplayName && (
                                    <span className="text-muted-foreground">
                                        → {owner.existingDisplayName}
                                    </span>
                                )}
                                <span className="text-muted-foreground">
                                    {owner.existingEmail ?? t("owners.noEmail")}
                                </span>
                                {owner.existingHasAccount && (
                                    <StatusChip variant="primary" dot={false}>
                                        {t("owners.hasAccount")}
                                    </StatusChip>
                                )}
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function Warnings({ preview }: { preview: KatastrImportPreviewResponseDto }) {
    const { t } = useTranslation("katastr");
    if (preview.warnings.length === 0) return null;

    return (
        <div className="border-warning-tint-border bg-warning-muted rounded-panel border p-4">
            <h2 className="text-warning-deep text-sm font-semibold">
                {t("warnings.heading")}
            </h2>
            <ul className="text-warning-deep mt-2 flex flex-col gap-1 text-sm">
                {preview.warnings.map((warning, index) => (
                    <li key={index}>
                        {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            t(
                                messageKeyFor("warnings", warning.code) as any,
                                warning,
                            )
                        }
                    </li>
                ))}
            </ul>
        </div>
    );
}

/**
 * A `FileDropzone` rejection never reaches the server — there is no
 * `AxiosError` and no catalogue-checked body to extract, just a reason the
 * dropzone already classified. It renders through the same box as an API
 * error (`ErrorBox` below), on its own translation key, instead of being
 * threaded through `katastrErrorMessages`, which exists to decode bodies
 * the API actually sends.
 */
function ImportErrors({ error }: { error: unknown }) {
    const { t } = useTranslation("katastr");

    if (isDropzoneRejectionError(error)) {
        return (
            <ErrorBox
                messages={[t(DROPZONE_REJECTION_KEY[error.dropzoneRejection])]}
            />
        );
    }

    const body =
        error instanceof AxiosError
            ? (error.response?.data as KatastrErrorBody | undefined)
            : undefined;

    // The extraction, the fallback for a code with no catalogue entry, and
    // the fallback for no parseable body at all now live in
    // `errors.ts` — this is the "code with no copy" risk surface the whole
    // task is about, so it has its own test rather than living only here.
    // `t`'s type only allows its own namespace's literal keys; `Translate`
    // is deliberately looser so `errors.ts` stays plain and testable
    // without i18next, hence the cast at this one boundary.
    const messages = katastrErrorMessages(t as unknown as Translate, body);

    return <ErrorBox messages={messages} />;
}

function ErrorBox({ messages }: { messages: string[] }) {
    const { t } = useTranslation("katastr");

    return (
        <div className="border-destructive/30 bg-destructive-muted rounded-panel border p-4">
            <h2 className="text-destructive text-sm font-semibold">
                {t("errors.heading")}
            </h2>
            <ul className="text-destructive mt-2 flex flex-col gap-1 text-sm">
                {messages.map((message, index) => (
                    <li key={index}>{message}</li>
                ))}
            </ul>
        </div>
    );
}
